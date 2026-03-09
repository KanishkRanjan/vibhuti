import { useState } from "react";
import { useLocation } from "wouter";
import { Plus, Filter, Loader2, AlertCircle } from "lucide-react";
import { useIssues } from "@/hooks/use-issues";
import { IssueCard } from "@/components/IssueCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const CATEGORIES = ["All", "Roads", "Water", "Electricity", "Sanitation", "Others"];

export default function Dashboard() {
  const [_, navigate] = useLocation();
  const { data: issues, isLoading, isError } = useIssues();
  const [filter, setFilter] = useState("All");

  const filteredIssues = issues?.filter(
    (issue) => filter === "All" || issue.maintenanceType === filter
  ) || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative pb-32">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-6">
        <div>
          <h1 className="text-4xl font-display font-bold mb-2">Community Issues</h1>
          <p className="text-muted-foreground text-lg">Browse and support civic improvements in your area.</p>
        </div>
        
        <Button onClick={() => navigate("/issues/new")} className="rounded-xl h-12 px-6 shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:-translate-y-0.5 transition-all w-full md:w-auto">
          <Plus className="w-5 h-5 mr-2" />
          Report New Issue
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
        <div className="flex items-center gap-2 p-1 bg-muted/50 rounded-2xl border border-border/50">
          <div className="px-3 flex items-center text-muted-foreground">
            <Filter className="w-4 h-4" />
          </div>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                filter === cat 
                  ? "bg-card text-foreground shadow-sm ring-1 ring-border" 
                  : "text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Issues Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-40 w-full rounded-2xl" />
              <Skeleton className="h-4 w-3/4 rounded" />
              <Skeleton className="h-4 w-1/2 rounded" />
            </div>
          ))
        ) : isError ? (
          <div className="col-span-full py-12 text-center">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">Failed to load issues</h3>
            <p className="text-muted-foreground">Please try refreshing the page.</p>
          </div>
        ) : filteredIssues.length === 0 ? (
          <div className="col-span-full py-12 text-center">
            <p className="text-muted-foreground mb-4">No issues found in this category</p>
            <Button onClick={() => setFilter("All")} variant="outline">
              View all issues
            </Button>
          </div>
        ) : (
          filteredIssues.map((issue) => (
            <div key={issue.id} onClick={() => navigate(`/issues/detail?id=${issue.id}`)} className="cursor-pointer">
              <IssueCard issue={issue} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
