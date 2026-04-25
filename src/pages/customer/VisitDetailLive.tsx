import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { VisitTypeChip } from "@/components/customer/VisitTypeChip";
import { LiveMiniMap } from "@/components/customer/LiveMiniMap";
import { getChipType } from "@/lib/visitChipType";
import {
  ChevronLeft,
  Camera,
  CheckCircle2,
  Circle,
  Clock,
} from "lucide-react";
import type { VisitDetail } from "@/hooks/useCustomerVisitDetail";

interface Props {
  jobId: string;
  data: VisitDetail;
}

/**
 * Computes a friendly ETA label from the scheduled date. Updates every 30s
 * via a useEffect-driven interval so the countdown stays roughly accurate
 * without a real-time provider feed.
 */
function useEtaLabel(scheduledDate: string | null): string {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  if (!scheduledDate) return "Arrival time pending";
  const scheduled = new Date(scheduledDate);
  if (Number.isNaN(scheduled.getTime())) return "Arrival time pending";

  const diffMin = Math.round((scheduled.getTime() - now.getTime()) / 60_000);
  if (diffMin > 60) return `Arrives ${format(scheduled, "h:mm a")}`;
  if (diffMin > 1) return `Arrives in ~${diffMin} min`;
  if (diffMin >= -10) return "Arriving any minute";
  if (diffMin >= -120) return "Service in progress";
  return "Wrapping up";
}

export function VisitDetailLive({ jobId, data }: Props) {
  const navigate = useNavigate();
  const { job, skus, checklistHighlights } = data;
  const etaLabel = useEtaLabel(job.scheduled_date);

  // Highlight first non-DONE checklist item as the "current" task. If every
  // item is DONE, no highlight (fall back to letting the receipt mode take
  // over after the provider closes the job).
  const currentChecklistId =
    checklistHighlights.find((item) => item.status !== "DONE")?.id ?? null;

  const handleAddSnap = () => navigate("/customer?snap=1");

  return (
    <div className="p-4 pb-24 space-y-4 animate-fade-in">
      <Button
        variant="ghost"
        size="sm"
        className="gap-1 -ml-2"
        onClick={() => navigate("/customer/visits")}
      >
        <ChevronLeft className="h-4 w-4" />
        Visits
      </Button>

      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <StatusBadge status={job.status === "IN_PROGRESS" ? "in_progress" : "scheduled"} />
        </div>
        <h1 className="text-h2">Visit in progress</h1>
        <p className="text-sm text-muted-foreground flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" />
          {etaLabel}
        </p>
      </div>

      <LiveMiniMap />

      {/* Tasks with type chips + current-task highlight */}
      <Card className="p-4 space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Today's services
        </h3>
        {skus.length === 0 ? (
          <p className="text-sm text-muted-foreground">No tasks loaded yet.</p>
        ) : (
          <ul className="space-y-2">
            {skus.map((s) => {
              const chipType = getChipType({ sku_id: s.sku_id });
              return (
                <li
                  key={s.sku_id}
                  className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {s.sku_name_snapshot ?? "Service"}
                    </p>
                    {s.scheduled_level_label && (
                      <p className="text-xs text-muted-foreground">
                        {s.scheduled_level_label}
                      </p>
                    )}
                  </div>
                  <VisitTypeChip type={chipType} />
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      {/* Checklist progress */}
      {checklistHighlights.length > 0 && (
        <Card className="p-4 space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Progress
          </h3>
          <ul className="space-y-2">
            {checklistHighlights.map((item) => {
              const isCurrent = item.id === currentChecklistId;
              const isDone = item.status === "DONE";
              return (
                <li
                  key={item.id}
                  className={
                    isCurrent
                      ? "flex items-start gap-2 rounded-md bg-primary/5 border border-primary/30 px-3 py-2"
                      : "flex items-start gap-2 px-3 py-2"
                  }
                >
                  {isDone ? (
                    <CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" />
                  ) : (
                    <Circle
                      className={
                        isCurrent
                          ? "h-4 w-4 text-primary shrink-0 mt-0.5"
                          : "h-4 w-4 text-muted-foreground shrink-0 mt-0.5"
                      }
                    />
                  )}
                  <p
                    className={
                      isDone
                        ? "text-sm text-muted-foreground line-through"
                        : isCurrent
                          ? "text-sm font-medium"
                          : "text-sm"
                    }
                  >
                    {item.label}
                    {isCurrent && (
                      <span className="ml-2 text-[10px] uppercase tracking-wide text-primary">
                        in progress
                      </span>
                    )}
                  </p>
                </li>
              );
            })}
          </ul>
        </Card>
      )}

      {/* Snap prompt — highest-intent upsell on a live page */}
      <Card className="p-4 border-warning/30 bg-warning/5">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-warning/15 p-2 shrink-0">
            <Camera className="h-5 w-5 text-warning" />
          </div>
          <div className="flex-1 min-w-0 space-y-2">
            <p className="text-sm font-medium">Notice something else?</p>
            <p className="text-xs text-muted-foreground">
              Snap a photo while your provider is here — they may be able to handle it during this visit.
            </p>
            <Button
              variant="default"
              className="gap-2 w-full"
              onClick={handleAddSnap}
            >
              <Camera className="h-4 w-4" />
              Add a Snap
            </Button>
          </div>
        </div>
      </Card>

      <p className="text-xs text-center text-muted-foreground px-4">
        We'll switch this view to your visit receipt as soon as the provider closes the visit.
      </p>

      {/* Acknowledge unused jobId so future hooks (mark-watched, refetch-on-focus, etc.) have a place. */}
      <div hidden data-job-id={jobId} />
    </div>
  );
}
