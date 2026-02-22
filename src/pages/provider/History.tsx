import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { useProviderJobs } from "@/hooks/useProviderJobs";
import { Clock, ChevronRight, AlertTriangle } from "lucide-react";
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
      <h1 className="text-h2">Job History</h1>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
        </div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Clock className="h-10 w-10 text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground font-medium">No completed jobs yet</p>
        </div>
      ) : (
        Object.entries(grouped)
          .sort(([a], [b]) => b.localeCompare(a))
          .map(([date, dateJobs]) => (
            <div key={date} className="space-y-2">
              <p className="text-caption uppercase tracking-wider">
                {date !== "unknown" ? format(new Date(date), "EEEE, MMM d") : "Unknown date"}
              </p>
              {dateJobs!.map((job) => (
                <Card
                  key={job.id}
                  className="p-3 press-feedback cursor-pointer"
                  onClick={() => navigate(`/provider/jobs/${job.id}`)}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <StatusBadge status={job.status.toLowerCase()} />
                      </div>
                      <p className="text-sm font-medium truncate">
                        {job.property ? `${job.property.street_address}` : "Property"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {job.job_skus?.map((s) => s.sku_name_snapshot).filter(Boolean).join(", ")}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </div>
                </Card>
              ))}
            </div>
          ))
      )}
    </div>
  );
}
