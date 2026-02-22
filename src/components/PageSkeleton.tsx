import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface PageSkeletonProps {
  variant?: "stats" | "list" | "page";
  className?: string;
}

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3">
      {[0, 1].map((i) => (
        <div key={i} className="rounded-2xl border border-border p-4 space-y-3">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-6 w-16" />
        </div>
      ))}
    </div>
  );
}

function ListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-2xl border border-border">
          <Skeleton className="h-10 w-10 rounded-xl shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function PageSkeleton({ variant = "page", className }: PageSkeletonProps) {
  if (variant === "stats") {
    return <StatsSkeleton />;
  }

  if (variant === "list") {
    return <ListSkeleton />;
  }

  return (
    <div className={cn("p-4 space-y-6 animate-fade-in", className)}>
      {/* Header skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-32" />
      </div>
      {/* Stats row */}
      <StatsSkeleton />
      {/* List */}
      <ListSkeleton count={3} />
    </div>
  );
}
