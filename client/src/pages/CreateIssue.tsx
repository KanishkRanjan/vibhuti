import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Image as ImageIcon, Loader2, MapPin, Send } from "lucide-react";
import { insertIssueSchema } from "@shared/schema";
import { useCreateIssue } from "@/hooks/use-issues";
import { useToast } from "@/hooks/use-toast";
import type { IssueInput } from "@shared/routes";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";

export default function CreateIssue() {
  const [_, setLocation] = useLocation();
  const createIssue = useCreateIssue();
  const { toast } = useToast();

  const form = useForm<IssueInput>({
    resolver: zodResolver(insertIssueSchema),
    defaultValues: {
      title: "",
      description: "",
      location: "",
      maintenanceType: "Roads",
      imageUrl: "",
    },
  });

  const onSubmit = (data: IssueInput) => {
    createIssue.mutate(data, {
      onSuccess: () => {
        toast({
          title: "Issue Reported Successfully",
          description: "Thank you for helping improve the community!",
        });
        setLocation("/");
      },
      onError: (err) => {
        toast({
          title: "Submission Failed",
          description: err.message,
          variant: "destructive",
        });
      },
    });
  };

  const imagePreview = form.watch("imageUrl");

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-10">
        <h1 className="text-4xl font-display font-bold mb-3">Report a Civic Issue</h1>
        <p className="text-muted-foreground text-lg">Provide details about the problem so authorities can address it effectively.</p>
      </div>

      <div className="grid md:grid-cols-[1fr_400px] gap-8">
        <Card className="p-8 rounded-3xl shadow-sm border-border/60">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-semibold">Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Deep pothole on Main Street" className="h-12 rounded-xl bg-muted/30" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-semibold">Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Provide more details about the severity and exact location..." 
                        className="min-h-[120px] resize-none rounded-xl bg-muted/30"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid sm:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="maintenanceType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-semibold">Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-12 rounded-xl bg-muted/30">
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-xl">
                          <SelectItem value="Roads">Roads & Transport</SelectItem>
                          <SelectItem value="Water">Water & Sewage</SelectItem>
                          <SelectItem value="Electricity">Electricity</SelectItem>
                          <SelectItem value="Sanitation">Sanitation & Garbage</SelectItem>
                          <SelectItem value="Others">Others</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-semibold">Location</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input placeholder="Enter address or landmark" className="h-12 pl-10 rounded-xl bg-muted/30" {...field} />
                          <MapPin className="w-5 h-5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-semibold">Image URL (Optional)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input placeholder="https://example.com/image.jpg" className="h-12 pl-10 rounded-xl bg-muted/30" {...field} value={field.value || ""} />
                        <ImageIcon className="w-5 h-5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="pt-6 mt-6 border-t border-border/50">
                <Button 
                  type="submit" 
                  size="lg" 
                  className="w-full h-14 text-lg rounded-xl shadow-lg shadow-primary/20 hover:shadow-xl hover:-translate-y-0.5 transition-all"
                  disabled={createIssue.isPending}
                >
                  {createIssue.isPending ? (
                    <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Submitting...</>
                  ) : (
                    <><Send className="w-5 h-5 mr-2" /> Submit Report</>
                  )}
                </Button>
              </div>

            </form>
          </Form>
        </Card>

        {/* Side Panel - Image Preview & Guidelines */}
        <div className="space-y-6">
          <Card className="p-6 rounded-3xl border-border/60 overflow-hidden bg-muted/10">
            <h3 className="font-semibold mb-4 flex items-center">
              <ImageIcon className="w-5 h-5 mr-2 text-primary" /> Image Preview
            </h3>
            <div className="aspect-video rounded-xl bg-muted border-2 border-dashed border-border/80 flex items-center justify-center overflow-hidden relative">
              {imagePreview ? (
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                  }}
                />
              ) : (
                <div className="text-center p-4 text-muted-foreground">
                  <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <span className="text-sm">Provide a URL to see preview</span>
                </div>
              )}
              <div className="hidden absolute inset-0 bg-muted flex items-center justify-center text-center p-4 text-muted-foreground">
                <span>Invalid image URL</span>
              </div>
            </div>
          </Card>

          <Card className="p-6 rounded-3xl border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-900/50 text-orange-800 dark:text-orange-200">
            <h3 className="font-semibold mb-2 flex items-center">
              <AlertCircle className="w-5 h-5 mr-2" /> Guidelines
            </h3>
            <ul className="space-y-2 text-sm opacity-90 list-disc pl-5">
              <li>Ensure the photo clearly shows the issue.</li>
              <li>Provide accurate location details (landmarks help).</li>
              <li>Do not upload sensitive personal information.</li>
              <li>False reporting may lead to account suspension.</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
