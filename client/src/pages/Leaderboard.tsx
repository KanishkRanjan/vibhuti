import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/hooks/use-profile";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Star, Medal, Crown, Flame } from "lucide-react";
import type { LeaderboardEntry } from "@shared/schema";

const BADGE_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  citizen: { label: "Citizen", color: "bg-gray-100 text-gray-600 border-gray-200", icon: <Star className="w-3 h-3" /> },
  active_member: { label: "Active Member", color: "bg-amber-100 text-amber-700 border-amber-200", icon: <Flame className="w-3 h-3" /> },
  community_hero: { label: "Community Hero", color: "bg-slate-100 text-slate-600 border-slate-200", icon: <Medal className="w-3 h-3" /> },
  ward_champion: { label: "Ward Champion", color: "bg-yellow-100 text-yellow-700 border-yellow-200", icon: <Crown className="w-3 h-3" /> },
  city_legend: { label: "City Legend", color: "bg-purple-100 text-purple-700 border-purple-200", icon: <Trophy className="w-3 h-3" /> },
};

export function BadgePill({ badge }: { badge: string }) {
  const config = BADGE_CONFIG[badge] || BADGE_CONFIG.citizen;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${config.color}`}>
      {config.icon} {config.label}
    </span>
  );
}

export default function Leaderboard() {
  const { user } = useAuth();
  const { data: myProfile } = useProfile();
  const [period, setPeriod] = useState<"week" | "month" | "all">("all");

  const { data: entries, isLoading } = useQuery<LeaderboardEntry[]>({
    queryKey: ["/api/leaderboard", period],
    queryFn: () => fetch(`/api/leaderboard?period=${period}`).then(r => r.json()),
  });

  const myEntry = entries?.find(e => e.userId === user?.id);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-2xl bg-[#263B6A] flex items-center justify-center">
            <Trophy className="w-6 h-6 text-[#EEFABD]" />
          </div>
          <div>
            <h1 className="text-4xl font-display font-bold">Community Leaderboard</h1>
            <p className="text-muted-foreground">Top citizens making their city better</p>
          </div>
        </div>
      </div>

      {/* Badge Legend */}
      <Card className="p-5 rounded-2xl border-border/60 shadow-sm mb-8">
        <h3 className="font-display font-bold mb-3 text-sm text-muted-foreground uppercase tracking-wide">Badge System</h3>
        <div className="flex flex-wrap gap-2">
          {Object.entries(BADGE_CONFIG).map(([key, cfg]) => (
            <div key={key} className="flex items-center gap-2">
              <BadgePill badge={key} />
              <span className="text-xs text-muted-foreground">
                {key === "citizen" && "0–49 pts"}
                {key === "active_member" && "50–149 pts"}
                {key === "community_hero" && "150–499 pts"}
                {key === "ward_champion" && "500–999 pts"}
                {key === "city_legend" && "1000+ pts"}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* Period Tabs */}
      <Tabs value={period} onValueChange={v => setPeriod(v as any)}>
        <TabsList className="mb-6 rounded-xl">
          <TabsTrigger value="week" className="rounded-lg">This Week</TabsTrigger>
          <TabsTrigger value="month" className="rounded-lg">This Month</TabsTrigger>
          <TabsTrigger value="all" className="rounded-lg">All Time</TabsTrigger>
        </TabsList>

        <TabsContent value={period}>
          {/* My Rank (if outside top 50 or logged in) */}
          {user && myProfile && !myEntry && (
            <Card className="p-4 rounded-2xl border-[#6984A9] border-2 bg-[#6984A9]/5 shadow-sm mb-4">
              <div className="flex items-center gap-4">
                <div className="text-2xl font-bold text-muted-foreground w-10 text-center">—</div>
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user.profileImageUrl || ""} />
                  <AvatarFallback className="bg-primary/10 text-primary">{user.firstName?.[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-semibold">{user.firstName} {user.lastName} <span className="text-xs text-primary">(You)</span></p>
                  <BadgePill badge={myProfile.badge || "citizen"} />
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">{myProfile.points || 0}</p>
                  <p className="text-xs text-muted-foreground">points</p>
                </div>
              </div>
            </Card>
          )}

          <Card className="rounded-2xl border-border/60 shadow-sm overflow-hidden">
            {isLoading ? (
              <div className="p-6 space-y-4">
                {Array.from({length: 10}).map((_,i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="w-8 h-5 rounded" />
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <div className="flex-1 space-y-2"><Skeleton className="h-4 w-32 rounded" /><Skeleton className="h-3 w-20 rounded" /></div>
                    <Skeleton className="h-5 w-16 rounded" />
                  </div>
                ))}
              </div>
            ) : entries?.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No leaderboard data yet. Be the first to report an issue!</p>
              </div>
            ) : (
              <div className="divide-y divide-border/40">
                {(entries || []).map((entry, index) => {
                  const isMe = entry.userId === user?.id;
                  const isTop3 = index < 3;
                  return (
                    <div key={entry.userId} className={`flex items-center gap-4 px-6 py-4 transition-colors ${isMe ? "bg-[#6984A9]/10 border-l-4 border-l-[#6984A9]" : "hover:bg-muted/30"}`}>
                      {/* Rank */}
                      <div className={`w-8 text-center font-bold text-lg ${
                        index === 0 ? "text-yellow-500" : index === 1 ? "text-slate-400" : index === 2 ? "text-amber-600" : "text-muted-foreground"
                      }`}>
                        {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `${entry.rank}`}
                      </div>
                      {/* Avatar */}
                      <Avatar className={`h-10 w-10 ${isTop3 ? "border-2 border-yellow-300" : ""}`}>
                        <AvatarImage src={entry.profileImageUrl || ""} />
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                          {entry.firstName?.[0] || "?"}
                        </AvatarFallback>
                      </Avatar>
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold">{entry.firstName} {entry.lastName}</p>
                          {isMe && <span className="text-xs text-primary font-medium">(You)</span>}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <BadgePill badge={entry.badge} />
                          <span className="text-xs text-muted-foreground">{entry.issuesReported} issue{entry.issuesReported !== 1 ? "s" : ""} reported</span>
                        </div>
                      </div>
                      {/* Points */}
                      <div className="text-right">
                        <p className={`font-bold text-xl ${isTop3 ? "text-[#263B6A]" : ""}`}>{entry.points}</p>
                        <p className="text-xs text-muted-foreground">points</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
