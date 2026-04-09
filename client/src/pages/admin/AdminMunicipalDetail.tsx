import { useQuery } from "@tanstack/react-query";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, Building2, CheckCircle2, Clock, AlertTriangle, Timer, Shield, LogOut } from "lucide-react";
import type { IssueResponse, MunicipalCorp } from "@shared/schema";
import nagarSetuLogo from "@assets/image_1773048982249.png";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700 border-amber-200",
  claimed: "bg-blue-100 text-blue-700 border-blue-200",
  in_progress: "bg-purple-100 text-purple-700 border-purple-200",
  resolved: "bg-green-100 text-green-700 border-green-200",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending", claimed: "Claimed", in_progress: "In Progress", resolved: "Resolved",
};

export default function AdminMunicipalDetail() {
  const { admin, isAuthenticated, isLoading: authLoading, logout } = useAdminAuth();
  const [location, navigate] = useLocation();
  const id = location.split("/").pop();

  if (authLoading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (!isAuthenticated) { navigate("/admin/login"); return null; }

  const { data, isLoading } = useQuery<{ corp: MunicipalCorp; stats: any; issues: IssueResponse[] }>({
    queryKey: ["/api/admin/municipals", id],
    queryFn: () => fetch(`/api/admin/municipals/${id}`, { credentials: "include" }).then(r => r.json()),
    enabled: !!id,
  });

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-[#263B6A] text-white sticky top-0 z-50 shadow-lg">
        <div className="max-w-screen-2xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={nagarSetuLogo} alt="NagarSetu" className="h-8 w-auto opacity-90" />
            <div>
              <span className="font-display font-bold text-lg text-white block leading-none">NagarSetu</span>
              <span className="text-xs text-white/60">Admin Portal — DM</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <Shield className="w-4 h-4 text-[#A0D585]" />
              <span className="text-white/80">{admin?.name}</span>
            </div>
            <Button onClick={() => logout()} variant="ghost" size="sm" className="text-white hover:bg-white/10">
              <LogOut className="w-4 h-4 mr-1" /> Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-screen-2xl mx-auto px-6 py-8">
        <Button variant="outline" className="mb-6" onClick={() => navigate("/admin/dashboard")}>
          <ChevronLeft className="w-4 h-4 mr-2" /> Back to Dashboard
        </Button>

        {isLoading ? (
          <div className="space-y-4">{Array.from({length: 4}).map((_,i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}</div>
        ) : data ? (
          <>
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                <Building2 className="w-6 h-6 text-[#6984A9]" />
                <h1 className="text-3xl font-display font-bold">{data.corp.name}</h1>
              </div>
              <p className="text-muted-foreground">Ward: {data.corp.ward} · Username: {data.corp.username}</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
              <StatCard label="Total Issues" value={data.stats.total} icon={<Clock className="w-5 h-5 text-blue-600" />} color="blue" />
              <StatCard label="Resolved" value={data.stats.resolved} icon={<CheckCircle2 className="w-5 h-5 text-green-600" />} color="green" />
              <StatCard label="Pending/Active" value={data.stats.pending} icon={<Clock className="w-5 h-5 text-amber-600" />} color="amber" />
              <StatCard label="Overdue" value={data.stats.overdue} icon={<AlertTriangle className="w-5 h-5 text-red-600" />} color="red" />
              <StatCard label="Avg Resolution (days)" value={data.stats.avgResolutionDays} icon={<Timer className="w-5 h-5 text-purple-600" />} color="purple" />
            </div>

            {/* Issues Table */}
            <Card className="rounded-2xl border-border/60 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-border/60 bg-muted/30">
                <h2 className="font-display font-bold text-lg">All Assigned Issues</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/30 bg-muted/20">
                      <th className="text-left px-4 py-3 font-semibold text-muted-foreground">ID</th>
                      <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Title</th>
                      <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Category</th>
                      <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Reported</th>
                      <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Claimed At</th>
                      <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Resolved At</th>
                      <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Status</th>
                      <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Resolution Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.issues.length === 0 ? (
                      <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">No issues assigned yet</td></tr>
                    ) : data.issues.map(issue => (
                      <tr key={issue.id} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3 font-mono text-muted-foreground">#{issue.id}</td>
                        <td className="px-4 py-3 font-medium max-w-[200px]"><span className="line-clamp-1">{issue.title}</span></td>
                        <td className="px-4 py-3">{issue.maintenanceType}</td>
                        <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{new Date(issue.createdAt).toLocaleDateString('en-IN')}</td>
                        <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{issue.claimedAt ? new Date(issue.claimedAt).toLocaleDateString('en-IN') : "—"}</td>
                        <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{issue.resolvedAt ? new Date(issue.resolvedAt).toLocaleDateString('en-IN') : "—"}</td>
                        <td className="px-4 py-3">
                          <Badge className={`text-xs border ${STATUS_COLORS[issue.status] || STATUS_COLORS.pending}`}>
                            {STATUS_LABELS[issue.status] || issue.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 max-w-[200px] text-muted-foreground"><span className="line-clamp-1">{issue.resolutionNote || "—"}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        ) : (
          <div className="text-center py-12 text-muted-foreground">Municipal corporation not found</div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: any; color: string }) {
  const colorMap: Record<string, string> = {
    blue: "bg-blue-50 border-blue-100", green: "bg-green-50 border-green-100",
    amber: "bg-amber-50 border-amber-100", red: "bg-red-50 border-red-100",
    purple: "bg-purple-50 border-purple-100",
  };
  return (
    <Card className={`p-5 rounded-2xl border ${colorMap[color]} shadow-sm`}>
      <div className="flex items-center gap-2 mb-2">{icon}<span className="text-xs font-medium text-muted-foreground">{label}</span></div>
      <p className="text-3xl font-display font-bold">{value ?? "—"}</p>
    </Card>
  );
}
