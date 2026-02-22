import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarDays, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import type { CustomerJob } from "@/hooks/useCustomerJobs";

interface NextVisitCardProps {
  job: CustomerJob | null;
  isLoading?: boolean;
}

export function NextVisitCard({ job, isLoading }: NextVisitCardProps) {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <Card className="p-5 flex items-center gap-3">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Loading your next visit…</p>
      </Card>
    );
  }

  if (!job) {
    return (
      <Card className="p-5">
        <div className="flex items-center gap-3">
          <CalendarDays className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">No upcoming visits</p>
            <p className="text-xs text-muted-foreground">Your next visit will appear here once scheduled.</p>
          </div>
        </div>
      </Card>
    );
  }

  const skuSummary = job.skus.map((s) => s.sku_name_snapshot ?? "Service").join(", ") || "Routine Visit";
  const statusInfo = getStatusInfo(job);

  return (
    <Card className="p-5 space-y-3">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Next Visit</p>
          <p className="text-base font-semibold">{skuSummary}</p>
        </div>
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusInfo.pillClass}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${statusInfo.dotClass}`} />
          {statusInfo.label}
        </span>
      </div>

      {/* En route ETA band */}
      {job.status === "IN_PROGRESS" && job.started_at && !job.arrived_at && (
        <div className="bg-accent/10 rounded-lg p-3 text-sm text-accent">
          <p className="font-medium">Your pro is on the way</p>
          <p className="text-xs mt-0.5 text-accent/80">ETA unavailable — sharing ends when they arrive.</p>
        </div>
      )}

      <Button
        variant="ghost"
        size="sm"
        className="w-full justify-between text-accent hover:text-accent"
        onClick={() => {
          if (job.status === "COMPLETED" || job.status === "PARTIAL_COMPLETE") {
            navigate(`/customer/visits/${job.id}`);
          }
        }}
      >
        {statusInfo.cta}
        <ArrowRight className="h-4 w-4" />
      </Button>
    </Card>
  );
}

function getStatusInfo(job: CustomerJob) {
  if (job.status === "COMPLETED" || job.status === "PARTIAL_COMPLETE") {
    return {
      label: "Completed",
      pillClass: "bg-success/10 text-success",
      dotClass: "bg-success",
      cta: "View receipt",
    };
  }
  if (job.status === "IN_PROGRESS") {
    if (job.arrived_at) {
      return {
        label: "In progress",
        pillClass: "bg-warning/10 text-warning",
        dotClass: "bg-warning",
        cta: "View details",
      };
    }
    return {
      label: "En route",
      pillClass: "bg-accent/10 text-accent",
      dotClass: "bg-accent",
      cta: "View details",
    };
  }
  if (job.status === "ISSUE_REPORTED") {
    return {
      label: "Issue",
      pillClass: "bg-destructive/10 text-destructive",
      dotClass: "bg-destructive",
      cta: "View details",
    };
  }
  return {
    label: "Planned",
    pillClass: "bg-secondary text-secondary-foreground",
    dotClass: "bg-muted-foreground",
    cta: "View plan",
  };
}
