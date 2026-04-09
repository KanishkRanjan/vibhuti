import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ChevronLeft, ThumbsUp, MapPin, Wrench, Flag, CheckCircle2, Clock, HandshakeIcon, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { IssueResponse } from "@shared/schema";
import { BadgePill } from "@/pages/Leaderboard";

const ROADMAP_STEPS = [
  { status: "pending", label: "Pending", description: "Issue submitted and awaiting review", icon: <Clock className="w-4 h-4" /> },
  { status: "claimed", label: "Claimed", description: "Assigned to Municipal Corporation", icon: <HandshakeIcon className="w-4 h-4" /> },
  { status: "in_progress", label: "In Progress", description: "Work underway by municipal team", icon: <Wrench className="w-4 h-4" /> },
  { status: "resolved", label: "Resolved", description: "Issue has been fully resolved", icon: <CheckCircle2 className="w-4 h-4" /> },
];

const STATUS_ORDER = ["pending", "claimed", "in_progress", "resolved"];

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700 border-amber-200",
  claimed: "bg-blue-100 text-blue-700 border-blue-200",
  in_progress: "bg-purple-100 text-purple-700 border-purple-200",
  resolved: "bg-green-100 text-green-700 border-green-200",
};
const STATUS_LABELS: Record<string, string> = {
  pending: "Pending", claimed: "Claimed", in_progress: "In Progress", resolved: "Resolved",
};

export default function IssueDetail() {
  const [_, navigate] = useLocation();
  const queryClient = useQueryClient();

  const params = new URLSearchParams(window.location.search);
  const issueId = params.get("id");

  const { data: issue, isLoading } = useQuery<IssueResponse>({
    queryKey: ["/api/issues", issueId],
    queryFn: () => fetch(`/api/issues/${issueId}`, { credentials: "include" }).then(r => r.json()),
    enabled: !!issueId,
  });

  const upvoteMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/issues/${issueId}/upvote`, { method: "POST", credentials: "include" });
      if (!response.ok) throw new Error("Failed to toggle upvote");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/issues", issueId] });
      queryClient.invalidateQueries({ queryKey: ["/api/issues"] });
    }
  });

  const currentStepIndex = issue ? STATUS_ORDER.indexOf(issue.status) : 0;

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Skeleton className="h-10 w-32 rounded-xl mb-6" />
        <div className="space-y-4">
          <Skeleton className="h-12 w-3/4 rounded" />
          <Skeleton className="h-64 w-full rounded-2xl" />
          <Skeleton className="h-40 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Button onClick={() => navigate("/")} variant="outline" className="mb-6">
          <ChevronLeft className="w-4 h-4 mr-2" /> Back to Issues
        </Button>
        <div className="text-center py-12 text-muted-foreground">Issue not found</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <Button onClick={() => navigate("/")} variant="outline" className="mb-6 rounded-xl">
        <ChevronLeft className="w-4 h-4 mr-2" /> Back to Issues
      </Button>

      <div className="space-y-6">
        {/* Header Card */}
        <div className="bg-card rounded-3xl border border-border/50 p-8">
          <div className="flex flex-wrap items-start gap-3 mb-4">
            <Badge className={`text-sm border ${STATUS_COLORS[issue.status] || STATUS_COLORS.pending}`}>
              {STATUS_LABELS[issue.status] || issue.status}
            </Badge>
            {issue.isEscalated && (
              <Badge className="text-sm border bg-red-100 text-red-700 border-red-200">
                <AlertTriangle className="w-3 h-3 mr-1" /> Escalated
              </Badge>
            )}
          </div>
          <h1 className="text-4xl font-display font-bold mb-4">{issue.title}</h1>
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-6">
            <span className="flex items-center gap-2"><MapPin className="w-4 h-4 text-primary" />{issue.location}</span>
            <span className="flex items-center gap-2"><Wrench className="w-4 h-4" />{issue.maintenanceType}</span>
            <span>
              Reported by <strong>{issue.authorName}</strong>
              {issue.authorBadge && <span className="ml-1 inline-flex"><BadgePill badge={issue.authorBadge} /></span>}
            </span>
          </div>
          {issue.municipalName && (
            <div className="flex items-center gap-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-100 rounded-xl px-4 py-2 inline-flex w-fit mb-4">
              <HandshakeIcon className="w-4 h-4" /> Assigned to: {issue.municipalName}
            </div>
          )}
          <p className="text-muted-foreground leading-relaxed">{issue.description}</p>
        </div>

        {/* Image */}
        {issue.imageUrl && (
          <div className="rounded-3xl overflow-hidden border border-border/50 shadow-sm">
            <img src={issue.imageUrl} alt={issue.title} className="w-full object-cover max-h-96" />
          </div>
        )}

        {/* Progress Roadmap */}
        <div className="bg-card rounded-3xl border border-border/50 p-8">
          <h2 className="text-xl font-display font-bold mb-6">Issue Progress</h2>
          <div className="relative">
            {ROADMAP_STEPS.map((step, index) => {
              const isCompleted = index <= currentStepIndex;
              const isCurrent = index === currentStepIndex;
              return (
                <div key={step.status} className="relative flex gap-6 pb-8 last:pb-0">
                  {/* Connector */}
                  {index < ROADMAP_STEPS.length - 1 && (
                    <div className={`absolute left-4 top-10 bottom-0 w-0.5 ${isCompleted ? 'bg-primary' : 'bg-border'}`} />
                  )}
                  {/* Circle */}
                  <div className={`relative z-10 flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                    isCompleted ? "bg-primary text-primary-foreground shadow-md" : "bg-muted text-muted-foreground border border-border"
                  } ${isCurrent ? "ring-4 ring-primary/20 scale-110" : ""}`}>
                    {step.icon}
                  </div>
                  {/* Content */}
                  <div className="flex-1 pt-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className={`font-semibold ${isCompleted ? "text-foreground" : "text-muted-foreground"}`}>{step.label}</p>
                      {isCurrent && <Badge className="text-xs bg-primary/10 text-primary border-0">Current</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                    {/* Show relevant timestamp */}
                    {step.status === "pending" && (
                      <p className="text-xs text-muted-foreground mt-1">{new Date(issue.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    )}
                    {step.status === "claimed" && issue.claimedAt && (
                      <p className="text-xs text-muted-foreground mt-1">{new Date(issue.claimedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} by {issue.municipalName}</p>
                    )}
                    {step.status === "resolved" && issue.resolvedAt && (
                      <p className="text-xs text-muted-foreground mt-1">{new Date(issue.resolvedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Resolution Note */}
          {issue.resolutionNote && (
            <div className="mt-6 p-4 bg-green-50 border border-green-100 rounded-2xl">
              <p className="text-sm font-semibold text-green-800 mb-1">Resolution Note</p>
              <p className="text-sm text-green-700">{issue.resolutionNote}</p>
            </div>
          )}
        </div>

        {/* Activity Log */}
        {issue.logs && issue.logs.length > 0 && (
          <div className="bg-card rounded-3xl border border-border/50 p-8">
            <h2 className="text-xl font-display font-bold mb-6">Activity Timeline</h2>
            <div className="space-y-4">
              {issue.logs.map((log) => (
                <div key={log.id} className="flex gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
                  <div>
                    <p className="text-sm font-medium">{log.changedBy} <span className="text-muted-foreground font-normal">• {log.status}</span></p>
                    {log.note && <p className="text-sm text-muted-foreground mt-0.5">{log.note}</p>}
                    <p className="text-xs text-muted-foreground mt-0.5">{new Date(log.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions Footer */}
        <div className="bg-card rounded-3xl border border-border/50 p-6 flex flex-col sm:flex-row gap-4 items-center">
          <Button
            onClick={() => upvoteMutation.mutate()}
            disabled={upvoteMutation.isPending}
            variant={issue.hasUpvoted ? "default" : "outline"}
            className="rounded-full px-6"
          >
            <ThumbsUp className={`w-4 h-4 mr-2 ${issue.hasUpvoted ? 'fill-current' : ''}`} />
            {issue.upvotesCount} Upvote{issue.upvotesCount !== 1 ? 's' : ''}
          </Button>
          <div className="flex-1" />
          <p className="text-sm text-muted-foreground">
            Open for {issue.daysOpen} day{issue.daysOpen !== 1 ? 's' : ''}
          </p>
        </div>
      </div>
    </div>
  );
}
