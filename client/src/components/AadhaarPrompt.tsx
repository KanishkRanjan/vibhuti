import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ShieldAlert, Fingerprint, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useProfile, useUpdateProfile } from "@/hooks/use-profile";
import { insertProfileSchema } from "@shared/schema";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";

const formSchema = insertProfileSchema.omit({ userId: true }).extend({
  aadhaarNumber: z.string().regex(/^\d{12}$/, "Aadhaar must be exactly 12 digits"),
});

type FormValues = z.infer<typeof formSchema>;

export function AadhaarPrompt() {
  const { isAuthenticated } = useAuth();
  const { data: profile, isLoading: isLoadingProfile } = useProfile();
  const updateProfile = useUpdateProfile();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isAuthenticated && !isLoadingProfile && !profile) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  }, [isAuthenticated, isLoadingProfile, profile]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      aadhaarNumber: "",
    },
  });

  function onSubmit(data: FormValues) {
    updateProfile.mutate(data, {
      onSuccess: () => {
        toast({
          title: "Identity Verified",
          description: "Your Aadhaar number has been securely linked.",
        });
        setIsOpen(false);
      },
    });
  }

  // Prevents closing by clicking outside
  const handleOpenChange = (open: boolean) => {
    if (profile) setIsOpen(open);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden border-0 shadow-2xl rounded-3xl">
        <div className="bg-gradient-to-br from-primary/10 to-transparent p-8 pb-6 border-b border-border/50 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent"></div>
          
          <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-2xl shadow-xl flex items-center justify-center mx-auto mb-4 relative z-10">
            <Fingerprint className="w-8 h-8 text-primary" />
          </div>
          <DialogTitle className="text-2xl font-display relative z-10">Verify Your Identity</DialogTitle>
          <DialogDescription className="text-base mt-2 relative z-10 max-w-sm mx-auto text-slate-600 dark:text-slate-400">
            To maintain a trusted civic environment, all users must link their 12-digit Aadhaar number before posting issues.
          </DialogDescription>
        </div>

        <div className="p-8 pt-6 bg-card">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="aadhaarNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold text-foreground">Aadhaar Number</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input 
                          placeholder="XXXX XXXX XXXX" 
                          {...field} 
                          className="pl-10 text-lg tracking-widest h-14 rounded-xl bg-muted/50 border-transparent focus:bg-background focus:border-primary focus:ring-primary/20 transition-all"
                          maxLength={12}
                        />
                        <ShieldAlert className="w-5 h-5 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button 
                type="submit" 
                className="w-full h-14 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5" 
                disabled={updateProfile.isPending}
              >
                {updateProfile.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : "Securely Link Aadhaar"}
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                Your data is securely stored and only used for municipal verification purposes.
              </p>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
