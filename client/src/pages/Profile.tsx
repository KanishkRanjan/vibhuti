import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ShieldCheck, User, Fingerprint, Loader2 } from "lucide-react";
import { insertProfileSchema } from "@shared/schema";
import { useProfile, useUpdateProfile } from "@/hooks/use-profile";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

const formSchema = insertProfileSchema.omit({ userId: true }).extend({
  aadhaarNumber: z.string().regex(/^\d{12}$/, "Aadhaar must be exactly 12 digits"),
});

export default function Profile() {
  const { user } = useAuth();
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    values: {
      aadhaarNumber: profile?.aadhaarNumber || "",
    },
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    updateProfile.mutate(data, {
      onSuccess: () => {
        toast({
          title: "Profile Updated",
          description: "Your Aadhaar details have been saved successfully.",
        });
      },
    });
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-10">
        <h1 className="text-4xl font-display font-bold mb-3">Profile Settings</h1>
        <p className="text-muted-foreground text-lg">Manage your identity and account details.</p>
      </div>

      <div className="space-y-8">
        {/* Account Details */}
        <Card className="p-8 rounded-3xl border-border/60 shadow-sm flex flex-col md:flex-row items-center gap-8">
          <Avatar className="w-32 h-32 border-4 border-background shadow-xl">
            <AvatarImage src={user?.profileImageUrl || ""} />
            <AvatarFallback className="text-4xl bg-primary/10 text-primary">
              {user?.firstName?.[0] || <User className="w-12 h-12" />}
            </AvatarFallback>
          </Avatar>
          <div className="text-center md:text-left flex-1">
            <h2 className="text-2xl font-bold font-display">{user?.firstName} {user?.lastName}</h2>
            <p className="text-muted-foreground mb-4">{user?.email}</p>
            <div className="inline-flex items-center text-sm font-medium text-green-600 bg-green-100 dark:bg-green-900/30 px-3 py-1 rounded-full">
              <ShieldCheck className="w-4 h-4 mr-1" /> Replit Authenticated
            </div>
          </div>
        </Card>

        {/* Identity Verification */}
        <Card className="p-8 rounded-3xl border-border/60 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
            <Fingerprint className="w-48 h-48" />
          </div>
          
          <div className="mb-6 relative z-10">
            <h3 className="text-xl font-bold font-display flex items-center mb-2">
              <Fingerprint className="w-5 h-5 mr-2 text-primary" /> Identity Verification
            </h3>
            <p className="text-muted-foreground">
              Your 12-digit Aadhaar number is required to post or support issues. This ensures all reports are from verified citizens.
            </p>
          </div>

          {isLoading ? (
            <div className="space-y-4 max-w-md">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-12 w-full rounded-xl" />
              <Skeleton className="h-12 w-40 rounded-xl" />
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-md relative z-10">
                <FormField
                  control={form.control}
                  name="aadhaarNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Aadhaar Number</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="XXXX XXXX XXXX" 
                          {...field} 
                          className="h-12 text-lg tracking-widest rounded-xl bg-muted/50 font-mono"
                          maxLength={12}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button 
                  type="submit" 
                  className="h-12 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all"
                  disabled={updateProfile.isPending || form.watch("aadhaarNumber") === profile?.aadhaarNumber}
                >
                  {updateProfile.isPending ? (
                    <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Saving...</>
                  ) : "Save Identity Details"}
                </Button>
              </form>
            </Form>
          )}
        </Card>
      </div>
    </div>
  );
}
