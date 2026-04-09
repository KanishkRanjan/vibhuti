import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMunicipalAuth } from "@/hooks/use-municipal-auth";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, LogOut, CheckCircle2, Clock, MapPin, Wrench, User, AlertTriangle, HandshakeIcon } from "lucide-react";
import type { IssueResponse } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import nagarSetuLogo from "@assets/image_1773048982249.png";
import { useToast } from "@/hooks/use-toast";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700 border-amber-200",
  claimed: "bg-blue-100 text-blue-700 border-blue-200",
  in_progress: "bg-purple-100 text-purple-700 border-purple-200",
  resolved: "bg-green-100 text-green-700 border-green-200",
};
const STATUS_LABELS: Record<string, string> = {
  pending: "Pending", claimed: "Claimed", in_progress: "In Progress", resolved: "Resolved",
};

export default function MunicipalDashboard() {
  const { municipal, isAuthenticated, isLoading: authLoading, logout } = useMunicipalAuth();
  const [_, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [statusDialog, setStatusDialog] = useState<{ issueId: number; currentStatus: string } | null>(null);
  const [statusUpdate, setStatusUpdate] = useState({ status: "in_progress", note: "" });

  if (authLoading) return <LoadingScreen />;
  if (!isAuthenticated) { navigate("/municipal/login"); return null; }

  const { data: myIssues, isLoading: myLoading } = useQuery<IssueResponse[]>({
    queryKey: ["/api/municipal/issues"],
    queryFn: () => fetch("/api/municipal/issues", { credentials: "include" }).then(r => r.json()),
  });

  const { data: unclaimedIssues, isLoading: unclaimedLoading } = useQuery<IssueResponse[]>({
    queryKey: ["/api/municipal/unclaimed"],
    queryFn: () => fetch("/api/municipal/unclaimed", { credentials: "include" }).then(r => r.json()),
  });

  const claimMutation = useMutation({
    mutationFn: async (issueId: number) => {
      const res = await fetch(`/api/municipal/issues/${issueId}/claim`, { method: "POST", credentials: "include" });
      if (!res.ok) { const e = await res.json(); throw new Error(e.message); }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/municipal/issues"] });
      queryClient.invalidateQueries({ queryKey: ["/api/municipal/unclaimed"] });
      toast({ title: "Issue claimed!", description: "The issue has been assigned to your ward." });
    },
    onError: (err: any) => toast({ title: "Failed to claim", description: err.message, variant: "destructive" }),
  });

  const statusMutation = useMutation({
    mutationFn: async ({ issueId, status, note }: { issueId: number; status: string; note: string }) => {
      const res = await fetch(`/api/municipal/issues/${issueId}/status`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, note }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.message); }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/municipal/issues"] });
      setStatusDialog(null);
      toast({ title: "Status updated!", description: "The issue status has been updated." });
    },
  });

  const claimed = myIssues?.filter(i => i.status === "claimed") || [];
  const inProgress = myIssues?.filter(i => i.status === "in_progress") || [];
  const resolved = myIssues?.filter(i => i.status === "resolved") || [];

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-[#6984A9] text-white sticky top-0 z-50 shadow-lg">
        <div className="max-w-screen-xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={nagarSetuLogo} alt="NagarSetu" className="h-8 w-auto opacity-90" />
            <div>
              <span className="font-display font-bold text-lg text-white block leading-none">NagarSetu</span>
              <span className="text-xs text-white/70">Municipal Portal</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-right">
              <p className="font-semibold">{municipal?.name}</p>
              <p className="text-xs text-white/70">{municipal?.ward}</p>
            </div>
            <Button onClick={() => logout()} variant="ghost" size="sm" className="text-white hover:bg-white/10">
              <LogOut className="w-4 h-4 mr-1" /> Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-screen-xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold mb-1">Municipal Dashboard</h1>
          <p className="text-muted-foreground">{municipal?.ward} · Manage and resolve civic issues in your jurisdiction</p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <SummaryCard label="Claimed" value={claimed.length} icon={<HandshakeIcon className="w-5 h-5 text-blue-600" />} color="blue" />
          <SummaryCard label="In Progress" value={inProgress.length} icon={<Clock className="w-5 h-5 text-purple-600" />} color="purple" />
          <SummaryCard label="Resolved" value={resolved.length} icon={<CheckCircle2 className="w-5 h-5 text-green-600" />} color="green" />
          <SummaryCard label="Unclaimed Nearby" value={unclaimedIssues?.length || 0} icon={<AlertTriangle className="w-5 h-5 text-amber-600" />} color="amber" />
        </div>

        <Tabs defaultValue="unclaimed">
          <TabsList className="mb-6 rounded-xl">
            <TabsTrigger value="unclaimed" className="rounded-lg">Unclaimed Issues ({unclaimedIssues?.length || 0})</TabsTrigger>
            <TabsTrigger value="mine" className="rounded-lg">My Issues ({myIssues?.length || 0})</TabsTrigger>
            <TabsTrigger value="history" className="rounded-lg">Resolved ({resolved.length})</TabsTrigger>
          </TabsList>

          {/* Unclaimed Feed */}
          <TabsContent value="unclaimed">
            <div className="space-y-4">
              {unclaimedLoading ? (
                Array.from({length: 3}).map((_,i) => <Skeleton key={i} className="h-32 rounded-2xl" />)
              ) : unclaimedIssues?.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">No unclaimed issues at the moment</div>
              ) : unclaimedIssues?.map(issue => (
                <Card key={issue.id} className="p-5 rounded-2xl border-border/60 shadow-sm">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-display font-bold text-lg">{issue.title}</h3>
                        <Badge className="text-xs border bg-amber-100 text-amber-700 border-amber-200">Pending</Badge>
                      </div>
                      <p className="text-muted-foreground text-sm line-clamp-2 mb-2">{issue.description}</p>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {issue.location}</span>
                        <span className="flex items-center gap-1"><Wrench className="w-3 h-3" /> {issue.maintenanceType}</span>
                        <span className="flex items-center gap-1"><User className="w-3 h-3" /> {issue.authorName}</span>
                        <span>{formatDistanceToNow(new Date(issue.createdAt), { addSuffix: true })}</span>
                      </div>
                    </div>
                    <Button
                      onClick={() => claimMutation.mutate(issue.id)}
                      disabled={claimMutation.isPending}
                      className="bg-[#6984A9] hover:bg-[#263B6A] text-white rounded-xl shrink-0"
                    >
                      <HandshakeIcon className="w-4 h-4 mr-2" /> Claim This Issue
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* My Issues */}
          <TabsContent value="mine">
            <div className="space-y-4">
              {myLoading ? (
                Array.from({length: 3}).map((_,i) => <Skeleton key={i} className="h-32 rounded-2xl" />)
              ) : (myIssues?.filter(i => i.status !== "resolved") || []).length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">No active issues. Claim some from the unclaimed feed!</div>
              ) : (myIssues?.filter(i => i.status !== "resolved") || []).map(issue => (
                <Card key={issue.id} className="p-5 rounded-2xl border-border/60 shadow-sm">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-display font-bold text-lg">{issue.title}</h3>
                        <Badge className={`text-xs border ${STATUS_COLORS[issue.status]}`}>{STATUS_LABELS[issue.status]}</Badge>
                      </div>
                      <p className="text-muted-foreground text-sm line-clamp-2 mb-2">{issue.description}</p>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {issue.location}</span>
                        <span className="flex items-center gap-1"><Wrench className="w-3 h-3" /> {issue.maintenanceType}</span>
                        <span>Open for {issue.daysOpen} day{issue.daysOpen !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      {issue.status === "claimed" && (
                        <Button onClick={() => { setStatusDialog({ issueId: issue.id, currentStatus: issue.status }); setStatusUpdate({ status: "in_progress", note: "" }); }}
                          variant="outline" className="rounded-xl border-purple-200 text-purple-700 hover:bg-purple-50">
                          Mark In Progress
                        </Button>
                      )}
                      {(issue.status === "claimed" || issue.status === "in_progress") && (
                        <Button onClick={() => { setStatusDialog({ issueId: issue.id, currentStatus: issue.status }); setStatusUpdate({ status: "resolved", note: "" }); }}
                          className="rounded-xl bg-green-600 hover:bg-green-700 text-white">
                          <CheckCircle2 className="w-4 h-4 mr-2" /> Mark Resolved
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* History */}
          <TabsContent value="history">
            <div className="space-y-4">
              {resolved.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">No resolved issues yet</div>
              ) : resolved.map(issue => (
                <Card key={issue.id} className="p-5 rounded-2xl border-border/60 shadow-sm bg-green-50/30">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        <h3 className="font-display font-bold">{issue.title}</h3>
                        <Badge className="text-xs border bg-green-100 text-green-700 border-green-200">Resolved</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">
                        Resolved on {issue.resolvedAt ? new Date(issue.resolvedAt).toLocaleDateString('en-IN') : "—"}
                      </p>
                      {issue.resolutionNote && (
                        <p className="text-sm text-green-700 bg-green-100 rounded-lg px-3 py-2 mt-2">📝 {issue.resolutionNote}</p>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Status Update Dialog */}
      <Dialog open={!!statusDialog} onOpenChange={() => setStatusDialog(null)}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>
              {statusUpdate.status === "resolved" ? "Mark as Resolved" : "Mark as In Progress"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Select value={statusUpdate.status} onValueChange={v => setStatusUpdate(s => ({ ...s, status: v }))}>
              <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
            <Textarea
              placeholder={statusUpdate.status === "resolved" ? "Describe the resolution (required)..." : "Add a progress note..."}
              value={statusUpdate.note}
              onChange={e => setStatusUpdate(s => ({ ...s, note: e.target.value }))}
              className="rounded-xl min-h-[100px]"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusDialog(null)}>Cancel</Button>
            <Button
              disabled={statusUpdate.status === "resolved" && !statusUpdate.note.trim() || statusMutation.isPending}
              onClick={() => statusMutation.mutate({ issueId: statusDialog!.issueId, ...statusUpdate })}
              className={statusUpdate.status === "resolved" ? "bg-green-600 hover:bg-green-700 text-white" : ""}
            >
              Update Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SummaryCard({ label, value, icon, color }: { label: string; value: number; icon: React.ReactNode; color: string }) {
  const colorMap: Record<string, string> = {
    blue: "bg-blue-50 border-blue-100", green: "bg-green-50 border-green-100",
    purple: "bg-purple-50 border-purple-100", amber: "bg-amber-50 border-amber-100",
  };
  return (
    <Card className={`p-5 rounded-2xl border ${colorMap[color]} shadow-sm`}>
      <div className="flex items-center gap-2 mb-2">{icon}<span className="text-sm font-medium text-muted-foreground">{label}</span></div>
      <p className="text-3xl font-display font-bold">{value}</p>
    </Card>
  );
}

function LoadingScreen() {
  return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;
}
