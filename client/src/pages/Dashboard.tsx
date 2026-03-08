import { useState } from "react";
import { Link } from "wouter";
import { Plus, Filter, Loader2, AlertCircle } from "lucide-react";
import { useIssues } from "@/hooks/use-issues";
import { IssueCard } from "@/components/IssueCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const CATEGORIES = ["All", "Roads", "Water", "Electricity", "Sanitation", "Others"];

export default function Dashboard() {
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
        
        <Link href="/issues/new">
          <Button className="rounded-xl h-12 px-6 shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:-translate-y-0.5 transition-all w-full md:w-auto">
            <Plus className="w-5 h-5 mr-2" />
            Report New Issue
          </Button>
        </Link>
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

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="rounded-2xl border bg-card p-6 flex flex-col gap-4">
              <Skeleton className="h-48 w-full rounded-xl" />
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="text-center py-20 bg-destructive/5 rounded-3xl border border-destructive/20">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h3 className="text-xl font-bold text-destructive mb-2">Failed to load issues</h3>
          <p className="text-muted-foreground">Please try refreshing the page.</p>
        </div>
      ) : filteredIssues.length === 0 ? (
        <div className="text-center py-24 bg-card rounded-3xl border border-dashed border-border">
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
            <Filter className="w-10 h-10 text-muted-foreground" />
          </div>
          <h3 className="text-2xl font-display font-bold mb-3">No issues found</h3>
          <p className="text-muted-foreground max-w-md mx-auto mb-8">
            There are currently no reported issues in this category. Be the first to report a problem in your neighborhood.
          </p>
          <Link href="/issues/new">
            <Button variant="outline" className="rounded-xl h-12 px-6">
              Report an Issue
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredIssues.map((issue) => (
            <IssueCard key={issue.id} issue={issue} />
          ))}
        </div>
      )}
    </div>
  );
}
