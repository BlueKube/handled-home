import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { useProviderJobs } from "@/hooks/useProviderJobs";
import { EmptyState } from "@/components/ui/empty-state";
import { Clock, ChevronRight, ChevronLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

export default function ProviderHistory() {
  const navigate = useNavigate();
  const { data: jobs, isLoading } = useProviderJobs("history");

  // Group by date
  const grouped = (jobs ?? []).reduce<Record<string, typeof jobs>>((acc, job) => {
    const key = job.completed_at
      ? format(new Date(job.completed_at), "yyyy-MM-dd")
      : job.scheduled_date ?? "unknown";
    if (!acc[key]) acc[key] = [];
    acc[key]!.push(job);
    return acc;
  }, {});

  return (
    <div className="animate-fade-in p-4 pb-24 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/provider/jobs")}
          aria-label="Back to jobs"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-h2">Job History</h1>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-4 w-32" />
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-2xl" />
          ))}
        </div>
      ) : Object.keys(grouped).length === 0 ? (
        <EmptyState
          compact
          icon={Clock}
          title="No completed jobs yet"
          body="Jobs you complete will appear here with their details and status. Check your upcoming jobs to see what's next."
          ctaLabel="View Jobs"
          ctaAction={() => navigate("/provider/jobs")}
          ctaVariant="outline"
        />
      ) : (
        Object.entries(grouped)
          .sort(([a], [b]) => b.localeCompare(a))
          .map(([date, dateJobs]) => (
            <div key={date} className="space-y-2">
              <p className="text-caption uppercase tracking-wider px-1">
                {date !== "unknown" ? format(new Date(date), "EEEE, MMM d") : "Unknown date"}
              </p>
              {dateJobs!.map((job) => (
                <Card
                  key={job.id}
                  variant="interactive"
                  className="p-4 cursor-pointer"
                  onClick={() => navigate(`/provider/jobs/${job.id}`)}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0 space-y-1">
                      <p className="text-sm font-medium truncate">
                        {job.property ? job.property.street_address : "Property"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {job.job_skus?.map((s) => s.sku_name_snapshot).filter(Boolean).join(", ") || "Service"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <StatusBadge status={job.status.toLowerCase()} />
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ))
      )}
    </div>
  );
}
