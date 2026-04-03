import { useNavigate } from "react-router-dom";
import { useCustomerJobs } from "@/hooks/useCustomerJobs";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { CustomerEmptyState } from "@/components/customer/CustomerEmptyState";
import { format } from "date-fns";
import { ImageIcon, AlertTriangle } from "lucide-react";

export default function CustomerHistory() {
  const { data: jobs, isLoading, isError } = useCustomerJobs("completed");
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="p-4 pb-24">
        <h1 className="text-h2 mb-4">Visits</h1>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-muted/50 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-4 pb-24 space-y-3 animate-fade-in">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          <h1 className="text-h2">Visits</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          We couldn't load your visits. Check your connection and try again.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 pb-24 animate-fade-in">
      <h1 className="text-h2 mb-4">Visits</h1>

      {(!jobs || jobs.length === 0) ? (
        <CustomerEmptyState
          icon={ImageIcon}
          title="No visits yet"
          body="Your visit receipts will appear here after your first handled visit."
        />
      ) : (
        <div className="space-y-2">
          {jobs.map((job) => {
            const skuSummary = job.skus.map((s) => s.sku_name_snapshot ?? "Service").join(", ") || "Visit";
            const dateStr = job.completed_at
              ? format(new Date(job.completed_at), "MMM d, yyyy")
              : job.scheduled_date
                ? format(new Date(job.scheduled_date), "MMM d, yyyy")
                : "—";

            return (
              <Card
                key={job.id}
                className="p-4 flex items-center gap-3 cursor-pointer hover:bg-secondary/50 transition-colors"
                onClick={() => navigate(`/customer/visits/${job.id}`)}
              >
                {/* Placeholder thumbnail */}
                <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <ImageIcon className="h-5 w-5 text-muted-foreground" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-accent/10 text-accent border-accent/20">
                      Routine
                    </Badge>
                    <span className="text-xs text-muted-foreground">{dateStr}</span>
                  </div>
                  <p className="text-sm font-medium truncate">{skuSummary}</p>
                </div>

                <StatusBadge
                  status={job.status === "COMPLETED" ? "completed" : job.status === "PARTIAL_COMPLETE" ? "partial_complete" : job.status.toLowerCase()}
                  className="text-[10px] h-5"
                />
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
