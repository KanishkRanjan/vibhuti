import { formatDistanceToNow } from "date-fns";
import { Heart, MapPin, Wrench, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToggleUpvote } from "@/hooks/use-issues";
import type { IssuesListResponse } from "@shared/routes";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { BadgePill } from "@/pages/Leaderboard";

type IssueCardProps = {
  issue: IssuesListResponse[0];
};

const categoryColors: Record<string, string> = {
  Roads: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800",
  Water: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800",
  Electricity: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800",
  Sanitation: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800",
  Others: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-50 text-amber-600 border-amber-200",
  claimed: "bg-blue-50 text-blue-600 border-blue-200",
  in_progress: "bg-purple-50 text-purple-600 border-purple-200",
  resolved: "bg-green-50 text-green-600 border-green-200",
};
const STATUS_LABELS: Record<string, string> = {
  pending: "Pending", claimed: "Claimed", in_progress: "In Progress", resolved: "Resolved",
};

export function IssueCard({ issue }: IssueCardProps) {
  const { isAuthenticated } = useAuth();
  const toggleUpvote = useToggleUpvote();
  const { toast } = useToast();

  const handleUpvote = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      toast({ title: "Login Required", description: "Please log in to upvote issues." });
      return;
    }
    toggleUpvote.mutate(issue.id);
  };

  const badgeClass = categoryColors[issue.maintenanceType] || categoryColors["Others"];
  const statusColor = STATUS_COLORS[(issue as any).status] || STATUS_COLORS.pending;
  const statusLabel = STATUS_LABELS[(issue as any).status] || "Pending";

  return (
    <div className="card-hover bg-card rounded-2xl border border-border/60 overflow-hidden flex flex-col h-full group">
      {/* Image Header */}
      {issue.imageUrl ? (
        <div className="h-48 w-full overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
          <img
            src={issue.imageUrl}
            alt={issue.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=800&q=80";
            }}
          />
          <Badge className={`absolute top-4 left-4 z-20 border shadow-sm ${badgeClass}`}>
            <Wrench className="w-3 h-3 mr-1" />
            {issue.maintenanceType}
          </Badge>
          <Badge className={`absolute top-4 right-4 z-20 border text-xs ${statusColor}`}>
            {statusLabel}
          </Badge>
        </div>
      ) : (
        <div className="h-20 bg-muted/50 border-b relative">
          <Badge className={`absolute top-4 left-4 border shadow-sm ${badgeClass}`}>
            <Wrench className="w-3 h-3 mr-1" />
            {issue.maintenanceType}
          </Badge>
          <Badge className={`absolute top-4 right-4 border text-xs ${statusColor}`}>
            {statusLabel}
          </Badge>
        </div>
      )}

      {/* Content */}
      <div className="p-6 flex-1 flex flex-col">
        <h3 className="font-display font-bold text-xl leading-tight line-clamp-2 mb-2">
          {issue.title}
        </h3>

        <p className="text-muted-foreground text-sm line-clamp-3 mb-4 flex-1">
          {issue.description}
        </p>

        {/* Meta Info */}
        <div className="space-y-2 mb-6">
          <div className="flex items-center text-sm text-slate-500 dark:text-slate-400">
            <MapPin className="w-4 h-4 mr-2 shrink-0 text-primary" />
            <span className="truncate">{issue.location}</span>
          </div>
          <div className="flex items-center text-sm text-slate-500 dark:text-slate-400 gap-1 flex-wrap">
            <User className="w-4 h-4 shrink-0" />
            <span className="truncate max-w-[120px]">{issue.authorName || "Anonymous"}</span>
            {(issue as any).authorBadge && <BadgePill badge={(issue as any).authorBadge} />}
            <span className="mx-1">•</span>
            <span className="whitespace-nowrap">{formatDistanceToNow(new Date(issue.createdAt), { addSuffix: true })}</span>
          </div>
        </div>

        {/* Action Footer */}
        <div className="pt-4 border-t border-border/50 flex items-center justify-between mt-auto">
          <Button
            variant={issue.hasUpvoted ? "secondary" : "outline"}
            onClick={handleUpvote}
            disabled={toggleUpvote.isPending}
            data-testid={`button-upvote-${issue.id}`}
            className={`rounded-xl px-5 shadow-sm transition-all ${
              issue.hasUpvoted
                ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-primary/20 border-transparent"
                : "hover:bg-primary/5 hover:text-primary hover:border-primary/30"
            }`}
          >
            <Heart className={`w-4 h-4 mr-2 ${issue.hasUpvoted ? "fill-current" : ""}`} />
            {issue.upvotesCount} {issue.upvotesCount === 1 ? "Upvote" : "Upvotes"}
          </Button>
          <span className="text-xs text-muted-foreground">{(issue as any).daysOpen || 0}d open</span>
        </div>
      </div>
    </div>
  );
}
