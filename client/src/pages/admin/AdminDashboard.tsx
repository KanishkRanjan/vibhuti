import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Shield, LogOut, Search, Filter, Download, AlertTriangle,
  CheckCircle2, Clock, TrendingUp, Building2, MapPin, Calendar,
  ChevronRight, MessageSquarePlus, Flag
} from "lucide-react";
import type { IssueResponse, MunicipalCorp } from "@shared/schema";
import nagarSetuLogo from "@assets/image_1773048982249.png";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700 border-amber-200",
  claimed: "bg-blue-100 text-blue-700 border-blue-200",
  in_progress: "bg-purple-100 text-purple-700 border-purple-200",
  resolved: "bg-green-100 text-green-700 border-green-200",
  escalated: "bg-red-100 text-red-700 border-red-200",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  claimed: "Claimed",
  in_progress: "In Progress",
  resolved: "Resolved",
  escalated: "Escalated",
};

export default function AdminDashboard() {
  const { admin, isAuthenticated, isLoading: authLoading, logout } = useAdminAuth();
  const [_, navigate] = useLocation();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [municipalFilter, setMunicipalFilter] = useState("all");
  const [noteDialogIssue, setNoteDialogIssue] = useState<number | null>(null);
  const [noteText, setNoteText] = useState("");

  if (authLoading) return <LoadingScreen />;
  if (!isAuthenticated) { navigate("/admin/login"); return null; }

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/admin/stats"],
    queryFn: () => fetch("/api/admin/stats", { credentials: "include" }).then(r => r.json()),
  });

  const { data: issues, isLoading: issuesLoading } = useQuery<IssueResponse[]>({
    queryKey: ["/api/admin/issues"],
    queryFn: () => fetch("/api/admin/issues", { credentials: "include" }).then(r => r.json()),
  });

  const { data: municipals } = useQuery<MunicipalCorp[]>({
    queryKey: ["/api/admin/municipals"],
    queryFn: () => fetch("/api/admin/municipals", { credentials: "include" }).then(r => r.json()),
  });

  const escalateMutation = useMutation({
    mutationFn: async (issueId: number) => {
      await fetch(`/api/admin/issues/${issueId}/escalate`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: "Escalated by District Magistrate" }),
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/admin/issues"] }),
  });

  const noteMutation = useMutation({
    mutationFn: async ({ issueId, note }: { issueId: number; note: string }) => {
      await fetch(`/api/admin/issues/${issueId}/note`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/issues"] });
      setNoteDialogIssue(null);
      setNoteText("");
    },
  });

  const filteredIssues = (issues || []).filter(issue => {
    if (statusFilter !== "all" && issue.status !== statusFilter) return false;
    if (categoryFilter !== "all" && issue.maintenanceType !== categoryFilter) return false;
    if (municipalFilter !== "all" && String(issue.assignedMunicipalId) !== municipalFilter) return false;
    if (search && !issue.title.toLowerCase().includes(search.toLowerCase()) && !issue.location.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const exportCSV = () => {
    const headers = ["ID", "Title", "Category", "Location", "Reported Date", "Assigned To", "Status", "Days Open", "Resolution Note"];
    const rows = filteredIssues.map(i => [
      i.id, `"${i.title}"`, i.maintenanceType, `"${i.location}"`,
      new Date(i.createdAt).toLocaleDateString(), i.municipalName || "Unassigned",
      i.status, i.daysOpen, `"${i.resolutionNote || ""}"`
    ]);
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "nagarsetu_issues.csv"; a.click();
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Admin Navbar */}
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
            <Button onClick={() => navigate("/admin/municipals")} variant="ghost" size="sm" className="text-white hover:bg-white/10">
              <Building2 className="w-4 h-4 mr-1" /> Municipals
            </Button>
            <Button onClick={() => logout()} variant="ghost" size="sm" className="text-white hover:bg-white/10">
              <LogOut className="w-4 h-4 mr-1" /> Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-screen-2xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold mb-1">Issue Overview</h1>
          <p className="text-muted-foreground">District-wide civic issue management dashboard</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard icon={<TrendingUp className="w-5 h-5 text-blue-600" />} label="Total Issues" value={statsLoading ? "—" : stats?.total} color="blue" />
          <StatCard icon={<CheckCircle2 className="w-5 h-5 text-green-600" />} label="Resolved This Month" value={statsLoading ? "—" : stats?.resolved} color="green" />
          <StatCard icon={<Clock className="w-5 h-5 text-purple-600" />} label="In Progress" value={statsLoading ? "—" : stats?.inProgress} color="purple" />
          <StatCard icon={<AlertTriangle className="w-5 h-5 text-red-600" />} label="Overdue (>7 days)" value={statsLoading ? "—" : stats?.overdue} color="red" />
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search by title or location..." className="pl-9 h-11 rounded-xl" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-11 w-full md:w-44 rounded-xl"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="claimed">Claimed</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="h-11 w-full md:w-44 rounded-xl"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="Roads">Roads</SelectItem>
              <SelectItem value="Water">Water</SelectItem>
              <SelectItem value="Electricity">Electricity</SelectItem>
              <SelectItem value="Sanitation">Sanitation</SelectItem>
              <SelectItem value="Others">Others</SelectItem>
            </SelectContent>
          </Select>
          <Select value={municipalFilter} onValueChange={setMunicipalFilter}>
            <SelectTrigger className="h-11 w-full md:w-52 rounded-xl"><SelectValue placeholder="Municipal Corp" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Municipals</SelectItem>
              {(municipals || []).map(m => <SelectItem key={m.id} value={String(m.id)}>{m.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button onClick={exportCSV} variant="outline" className="h-11 rounded-xl gap-2 shrink-0">
            <Download className="w-4 h-4" /> Export CSV
          </Button>
        </div>

        {/* Issues Table */}
        <Card className="rounded-2xl border-border/60 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60 bg-muted/50">
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">ID</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Title</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Category</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Location</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Reported</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Assigned To</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Status</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Days Open</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {issuesLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-border/30">
                      {Array.from({ length: 9 }).map((_, j) => (
                        <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-full rounded" /></td>
                      ))}
                    </tr>
                  ))
                ) : filteredIssues.length === 0 ? (
                  <tr><td colSpan={9} className="px-4 py-12 text-center text-muted-foreground">No issues found</td></tr>
                ) : (
                  filteredIssues.map(issue => (
                    <tr key={issue.id} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-mono text-muted-foreground">#{issue.id}</td>
                      <td className="px-4 py-3 font-medium max-w-[200px]">
                        <span className="line-clamp-1">{issue.title}</span>
                        {issue.isEscalated && <span className="ml-1 text-red-500 text-xs font-bold">⚡ ESCALATED</span>}
                      </td>
                      <td className="px-4 py-3">{issue.maintenanceType}</td>
                      <td className="px-4 py-3 max-w-[150px]"><span className="line-clamp-1 text-muted-foreground">{issue.location}</span></td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{new Date(issue.createdAt).toLocaleDateString('en-IN')}</td>
                      <td className="px-4 py-3">
                        {issue.municipalName ? (
                          <button onClick={() => navigate(`/admin/municipal/${issue.assignedMunicipalId}`)} className="text-primary hover:underline">{issue.municipalName}</button>
                        ) : <span className="text-muted-foreground">Unassigned</span>}
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={`text-xs border ${STATUS_COLORS[issue.status] || STATUS_COLORS.pending}`}>
                          {STATUS_LABELS[issue.status] || issue.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <span className={issue.daysOpen > 7 && issue.status !== "resolved" ? "text-red-600 font-semibold" : "text-muted-foreground"}>
                          {issue.daysOpen}d
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => { setNoteDialogIssue(issue.id); setNoteText(""); }}>
                            <MessageSquarePlus className="w-3 h-3" />
                          </Button>
                          {issue.status !== "resolved" && !issue.isEscalated && (
                            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-red-500 hover:text-red-600" onClick={() => escalateMutation.mutate(issue.id)}>
                              <Flag className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-border/30 text-sm text-muted-foreground">
            Showing {filteredIssues.length} of {issues?.length || 0} issues
          </div>
        </Card>
      </div>

      {/* Add Note Dialog */}
      <Dialog open={noteDialogIssue !== null} onOpenChange={() => setNoteDialogIssue(null)}>
        <DialogContent className="rounded-2xl">
          <DialogHeader><DialogTitle>Add Admin Note</DialogTitle></DialogHeader>
          <Textarea placeholder="Enter your note..." value={noteText} onChange={e => setNoteText(e.target.value)} className="rounded-xl min-h-[100px]" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setNoteDialogIssue(null)}>Cancel</Button>
            <Button disabled={!noteText.trim() || noteMutation.isPending} onClick={() => noteMutation.mutate({ issueId: noteDialogIssue!, note: noteText })}>
              Save Note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: any; color: string }) {
  const colorMap: Record<string, string> = {
    blue: "bg-blue-50 border-blue-100", green: "bg-green-50 border-green-100",
    purple: "bg-purple-50 border-purple-100", red: "bg-red-50 border-red-100",
  };
  return (
    <Card className={`p-5 rounded-2xl border ${colorMap[color]} shadow-sm`}>
      <div className="flex items-center gap-3 mb-3">{icon}<span className="text-sm font-medium text-muted-foreground">{label}</span></div>
      <p className="text-3xl font-display font-bold">{value ?? "—"}</p>
    </Card>
  );
}

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
