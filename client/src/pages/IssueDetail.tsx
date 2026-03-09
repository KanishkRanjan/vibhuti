import { useLocation } from "wouter";
import { ChevronLeft, ThumbsUp, MapPin, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIssues } from "@/hooks/use-issues";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";

const ROADMAP_STEPS = [
  { status: "pending", label: "Pending", description: "Issue awaiting review" },
  { status: "assigned", label: "Assigned", description: "Assigned to department" },
  { status: "progress", label: "In Progress", description: "Work in progress" },
  { status: "resolved", label: "Resolved", description: "Issue resolved" }
];

export default function IssueDetail() {
  const [_, navigate] = useLocation();
  const { data: issues } = useIssues();
  const queryClient = useQueryClient();
  
  // Get issue ID from URL
  const params = new URLSearchParams(window.location.search);
  const issueId = params.get("id");
  const issue = issues?.find(i => i.id === Number(issueId));

  const upvoteMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(api.issues.toggleUpvote.path.replace(':id', String(issueId)), {
        method: 'POST',
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to toggle upvote');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/issues'] });
    }
  });

  if (!issue) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Button onClick={() => navigate("/")} variant="outline" className="mb-6">
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back to Issues
        </Button>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Issue not found</p>
        </div>
      </div>
    );
  }

  // Default to "pending" status for now (can be extended with a status field in DB)
  const currentStatus = "pending";
  const currentStepIndex = ROADMAP_STEPS.findIndex(s => s.status === currentStatus);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <Button onClick={() => navigate("/")} variant="outline" className="mb-6">
        <ChevronLeft className="w-4 h-4 mr-2" />
        Back to Issues
      </Button>

      <div className="bg-card rounded-3xl border border-border/50 p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-display font-bold mb-4">{issue.title}</h1>
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="w-4 h-4" />
              {issue.location || "Location not specified"}
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Wrench className="w-4 h-4" />
              {issue.maintenanceType}
            </div>
            <div className="text-muted-foreground">
              By {issue.authorName}
            </div>
          </div>
        </div>

        {/* Image */}
        {issue.imageUrl && (
          <div className="mb-8">
            <img 
              src={issue.imageUrl} 
              alt={issue.title}
              className="w-full rounded-2xl object-cover max-h-96"
            />
          </div>
        )}

        {/* Description */}
        {issue.description && (
          <div className="mb-8">
            <h2 className="text-xl font-display font-bold mb-3">Description</h2>
            <p className="text-muted-foreground leading-relaxed">{issue.description}</p>
          </div>
        )}

        {/* Roadmap Progress */}
        <div className="mb-8">
          <h2 className="text-xl font-display font-bold mb-6">Progress Tracking</h2>
          <div className="space-y-4">
            {ROADMAP_STEPS.map((step, index) => (
              <div key={step.status} className="relative">
                {/* Connector Line */}
                {index < ROADMAP_STEPS.length - 1 && (
                  <div className={`absolute left-5 top-10 bottom-0 w-1 ${
                    index < currentStepIndex ? 'bg-primary' : 'bg-border'
                  }`} />
                )}
                
                {/* Step */}
                <div className="flex gap-4">
                  <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm relative z-10 ${
                    index <= currentStepIndex 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted text-muted-foreground border border-border'
                  }`}>
                    {index + 1}
                  </div>
                  <div className="pt-1">
                    <p className="font-semibold text-foreground">{step.label}</p>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stats & Action */}
        <div className="flex flex-col sm:flex-row gap-4 pt-8 border-t border-border/50">
          <Button 
            onClick={() => upvoteMutation.mutate()}
            disabled={upvoteMutation.isPending}
            variant={issue.hasUpvoted ? "default" : "outline"}
            className="rounded-full"
          >
            <ThumbsUp className={`w-4 h-4 mr-2 ${issue.hasUpvoted ? 'fill-current' : ''}`} />
            {issue.upvotesCount} Upvote{issue.upvotesCount !== 1 ? 's' : ''}
          </Button>
          <div className="flex-1" />
          <p className="text-sm text-muted-foreground pt-2">
            Reported on {new Date(issue.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  );
}
