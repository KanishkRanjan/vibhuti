import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { ShieldCheck, User, Fingerprint, Loader2, Trophy, Star, TrendingUp, Clock } from "lucide-react";
import { insertProfileSchema } from "@shared/schema";
import { useProfile, useUpdateProfile } from "@/hooks/use-profile";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { BadgePill } from "@/pages/Leaderboard";

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

const formSchema = insertProfileSchema.omit({ userId: true, points: true, badge: true }).extend({
  aadhaarNumber: z.string().regex(/^\d{12}$/, "Aadhaar must be exactly 12 digits"),
});

type PointsData = {
  total: number;
  badge: string;
  rank: number;
  breakdown: { fromReports: number; fromResolutions: number };
  recentLogs: { id: number; pointsChange: number; reason: string; issueId: number | null; createdAt: string }[];
};

export default function Profile() {
  const { user } = useAuth();
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const { toast } = useToast();

  const { data: pointsData, isLoading: pointsLoading } = useQuery<PointsData>({
    queryKey: ["/api/user/points"],
    queryFn: () => fetch("/api/user/points", { credentials: "include" }).then(r => r.ok ? r.json() : null),
    retry: false,
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    values: { aadhaarNumber: profile?.aadhaarNumber || "" },
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    updateProfile.mutate(data, {
      onSuccess: () => {
        toast({ title: "Profile Updated", description: "Your Aadhaar details have been saved successfully." });
      },
    });
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-10">
        <h1 className="text-4xl font-display font-bold mb-3">Profile & Stats</h1>
        <p className="text-muted-foreground text-lg">Your civic contribution and account details.</p>
      </div>

      <div className="space-y-6">
        {/* Account Details + Points */}
        <Card className="p-8 rounded-3xl border-border/60 shadow-sm">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <Avatar className="w-28 h-28 border-4 border-background shadow-xl">
              <AvatarImage src={user?.profileImageUrl || ""} />
              <AvatarFallback className="text-4xl bg-primary/10 text-primary">
                {user?.firstName?.[0] || <User className="w-12 h-12" />}
              </AvatarFallback>
            </Avatar>
            <div className="text-center md:text-left flex-1">
              <h2 className="text-2xl font-bold font-display">{user?.firstName} {user?.lastName}</h2>
              <p className="text-muted-foreground mb-3">{user?.email}</p>
              <div className="flex flex-wrap items-center gap-3">
                <div className="inline-flex items-center text-sm font-medium text-green-600 bg-green-100 dark:bg-green-900/30 px-3 py-1 rounded-full">
                  <ShieldCheck className="w-4 h-4 mr-1" /> Verified Citizen
                </div>
                {pointsData && <BadgePill badge={pointsData.badge} />}
              </div>
            </div>
          </div>
        </Card>

        {/* Points & Ranking */}
        <Card className="p-8 rounded-3xl border-border/60 shadow-sm">
          <h3 className="text-xl font-display font-bold mb-6 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-[#263B6A]" /> Civic Contribution Points
          </h3>
          {pointsLoading ? (
            <div className="grid grid-cols-3 gap-4">
              {Array.from({length: 3}).map((_,i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
            </div>
          ) : pointsData ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-[#263B6A]/5 border border-[#263B6A]/10 rounded-2xl p-4 text-center">
                  <p className="text-3xl font-bold font-display text-[#263B6A]">{pointsData.total}</p>
                  <p className="text-sm text-muted-foreground mt-1">Total Points</p>
                </div>
                <div className="bg-muted/50 border border-border rounded-2xl p-4 text-center">
                  <p className="text-3xl font-bold font-display">#{pointsData.rank}</p>
                  <p className="text-sm text-muted-foreground mt-1">City Rank</p>
                </div>
                <div className="bg-muted/50 border border-border rounded-2xl p-4 text-center">
                  <div className="flex justify-center mb-1"><BadgePill badge={pointsData.badge} /></div>
                  <p className="text-sm text-muted-foreground mt-1">Current Badge</p>
                </div>
              </div>

              {/* Points Breakdown */}
              <div className="mb-6">
                <p className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Points Breakdown</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2"><TrendingUp className="w-4 h-4 text-primary" /> From issue reports</span>
                    <span className="font-semibold">+{pointsData.breakdown.fromReports} pts</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2"><Star className="w-4 h-4 text-green-500" /> From resolutions & bonuses</span>
                    <span className="font-semibold">+{pointsData.breakdown.fromResolutions} pts</span>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              {pointsData.recentLogs.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Recent Activity</p>
                  <div className="space-y-2">
                    {pointsData.recentLogs.map(log => (
                      <div key={log.id} className="flex items-center justify-between text-sm py-2 border-b border-border/40 last:border-0">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3 h-3 text-muted-foreground" />
                          <span className="text-muted-foreground">{log.reason}</span>
                          {log.issueId && <span className="text-xs text-muted-foreground">• Issue #{log.issueId}</span>}
                        </div>
                        <span className={`font-semibold ${log.pointsChange >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {log.pointsChange >= 0 ? "+" : ""}{log.pointsChange} pts
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <p>No points data yet. Start by reporting an issue to earn points!</p>
            </div>
          )}
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
              Your 12-digit Aadhaar number is required to post or support issues.
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
                          data-testid="input-aadhaar"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  data-testid="button-save-aadhaar"
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
