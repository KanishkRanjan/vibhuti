import { formatDistanceToNow } from "date-fns";
import { Heart, MapPin, Wrench, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToggleUpvote } from "@/hooks/use-issues";
import type { IssuesListResponse } from "@shared/routes";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

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

export function IssueCard({ issue }: IssueCardProps) {
  const { isAuthenticated } = useAuth();
  const toggleUpvote = useToggleUpvote();
  const { toast } = useToast();

  const handleUpvote = () => {
    if (!isAuthenticated) {
      toast({
        title: "Login Required",
        description: "Please log in to upvote issues.",
      });
      return;
    }
    toggleUpvote.mutate(issue.id);
  };

  const badgeClass = categoryColors[issue.maintenanceType] || categoryColors["Others"];

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
              (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=800&q=80"; // fallback texture
            }}
          />
          <Badge className={`absolute top-4 left-4 z-20 border shadow-sm ${badgeClass}`}>
            <Wrench className="w-3 h-3 mr-1" />
            {issue.maintenanceType}
          </Badge>
        </div>
      ) : (
        <div className="h-20 bg-muted/50 border-b relative">
          <Badge className={`absolute top-4 left-4 border shadow-sm ${badgeClass}`}>
            <Wrench className="w-3 h-3 mr-1" />
            {issue.maintenanceType}
          </Badge>
        </div>
      )}

      {/* Content */}
      <div className="p-6 flex-1 flex flex-col">
        <div className="flex items-start justify-between gap-4 mb-2">
          <h3 className="font-display font-bold text-xl leading-tight line-clamp-2">
            {issue.title}
          </h3>
        </div>
        
        <p className="text-muted-foreground text-sm line-clamp-3 mb-4 flex-1">
          {issue.description}
        </p>

        {/* Meta Info */}
        <div className="space-y-2 mb-6">
          <div className="flex items-center text-sm text-slate-500 dark:text-slate-400">
            <MapPin className="w-4 h-4 mr-2 shrink-0 text-primary" />
            <span className="truncate">{issue.location}</span>
          </div>
          <div className="flex items-center text-sm text-slate-500 dark:text-slate-400">
            <User className="w-4 h-4 mr-2 shrink-0" />
            <span className="truncate">{issue.authorName || "Anonymous Citizen"}</span>
            <span className="mx-2">•</span>
            <span>{formatDistanceToNow(new Date(issue.createdAt), { addSuffix: true })}</span>
          </div>
        </div>

        {/* Action Footer */}
        <div className="pt-4 border-t border-border/50 flex items-center justify-between mt-auto">
          <Button 
            variant={issue.hasUpvoted ? "secondary" : "outline"} 
            onClick={handleUpvote}
            disabled={toggleUpvote.isPending}
            className={`rounded-xl px-5 shadow-sm transition-all ${
              issue.hasUpvoted 
                ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-primary/20 border-transparent" 
                : "hover:bg-primary/5 hover:text-primary hover:border-primary/30"
            }`}
          >
            <Heart className={`w-4 h-4 mr-2 ${issue.hasUpvoted ? "fill-current" : ""}`} />
            {issue.upvotesCount} {issue.upvotesCount === 1 ? "Upvote" : "Upvotes"}
          </Button>
        </div>
      </div>
    </div>
  );
}
