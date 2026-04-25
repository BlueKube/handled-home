import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { VisitTypeChip } from "@/components/customer/VisitTypeChip";
import { getChipType } from "@/lib/visitChipType";
import { ChevronLeft, Calendar, Clock, UserCircle2, Camera, CalendarClock } from "lucide-react";
import type { VisitDetail } from "@/hooks/useCustomerVisitDetail";

interface Props {
  jobId: string;
  data: VisitDetail;
}

export function VisitDetailPreview({ jobId, data }: Props) {
  const navigate = useNavigate();
  const { job, skus } = data;

  const scheduledFor = job.scheduled_date ? new Date(job.scheduled_date) : null;
  const dateLabel = scheduledFor
    ? format(scheduledFor, "EEEE, MMM d, yyyy")
    : "Date pending";
  const timeLabel = scheduledFor ? format(scheduledFor, "h:mm a") : "Time pending";

  const handleReschedule = () => {
    navigate(`/customer/appointment/${jobId}`);
  };

  const handleAddSnap = () => {
    // Snap is opened from the global FAB (BottomTabBar). Navigating to
    // /customer with the ?snap=1 query param triggers the SnapSheet to
    // auto-open per the Batch 5.1 nav contract.
    navigate("/customer?snap=1");
  };

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
          <StatusBadge status="scheduled" />
        </div>
        <h1 className="text-h2">Upcoming visit</h1>
        <p className="text-sm text-muted-foreground">
          We'll notify you the morning of your visit.
        </p>
      </div>

      {/* Hero — date / time / provider */}
      <Card className="p-4 space-y-3">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-primary/10 p-2 shrink-0">
            <Calendar className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Scheduled for
            </p>
            <p className="text-sm font-medium">{dateLabel}</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-primary/10 p-2 shrink-0">
            <Clock className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Arrival window
            </p>
            <p className="text-sm font-medium">{timeLabel}</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-muted p-2 shrink-0">
            <UserCircle2 className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Provider
            </p>
            <p className="text-sm font-medium">
              Assigned the day before
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              You'll see their name + photo as soon as routing locks in.
            </p>
          </div>
        </div>
      </Card>

      {/* Task list with type chips */}
      <Card className="p-4 space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          What's on the list
        </h3>
        {skus.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Tasks will be confirmed before your visit.
          </p>
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
                  {/* "Included" is the implicit default — hide the chip until
                      the classifier returns a differentiating type
                      (Snap/Bundle/Credits). Prevents the every-row-says-the-
                      same-thing UI noise during the stub period. */}
                  {chipType !== "included" && <VisitTypeChip type={chipType} />}
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      {/* CTAs */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="outline"
          className="gap-2"
          onClick={handleReschedule}
        >
          <CalendarClock className="h-4 w-4" />
          Reschedule
        </Button>
        <Button
          variant="default"
          className="gap-2"
          onClick={handleAddSnap}
        >
          <Camera className="h-4 w-4" />
          Add a Snap
        </Button>
      </div>

      <p className="text-xs text-center text-muted-foreground px-4">
        Need to add a one-off task? Snap a photo and we'll add it to this visit if your provider has time.
      </p>
    </div>
  );
}
