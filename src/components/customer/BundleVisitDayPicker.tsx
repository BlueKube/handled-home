import { useMemo } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarDays, ChevronRight } from "lucide-react";
import { useCustomerJobs } from "@/hooks/useCustomerJobs";
import { format } from "date-fns";

interface BundleVisitDayPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  estimatedExtraMinutes: number;
  onPick: (jobId: string) => void;
  isBooking?: boolean;
}

export function BundleVisitDayPicker({
  open,
  onOpenChange,
  estimatedExtraMinutes,
  onPick,
  isBooking,
}: BundleVisitDayPickerProps) {
  const { data: jobs, isLoading, isError } = useCustomerJobs("upcoming");

  const eligible = useMemo(() => {
    if (!jobs) return [];
    return jobs
      .filter((j) => j.status === "NOT_STARTED" && j.scheduled_date !== null)
      .sort(
        (a, b) =>
          new Date(a.scheduled_date as string).getTime() -
          new Date(b.scheduled_date as string).getTime(),
      )
      .slice(0, 3);
  }, [jobs]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[80vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Choose a visit day</SheetTitle>
        </SheetHeader>

        <div className="mt-2 space-y-3">
          <p className="text-xs text-muted-foreground">
            We'll add this bundle to one of your upcoming visits. Adds about{" "}
            {estimatedExtraMinutes} minutes to that day.
          </p>

          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-16 rounded-xl" />
              <Skeleton className="h-16 rounded-xl" />
              <Skeleton className="h-16 rounded-xl" />
            </div>
          ) : isError ? (
            <p className="text-sm text-destructive">
              Couldn't load your upcoming visits. Try again later.
            </p>
          ) : eligible.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No upcoming visits to attach this to. Activate a routine first, then
              come back.
            </p>
          ) : (
            <div className="space-y-2">
              {eligible.map((job) => {
                const dateStr = job.scheduled_date as string;
                const date = new Date(dateStr);
                const dayOfWeek = format(date, "EEEE");
                const dateLabel = format(date, "MMM d");
                const primarySku = job.skus[0]?.sku_name_snapshot ?? "Routine visit";
                return (
                  <button
                    key={job.id}
                    type="button"
                    onClick={() => onPick(job.id)}
                    disabled={isBooking}
                    className="w-full text-left flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:bg-secondary/30 active:bg-secondary/50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                      <CalendarDays className="h-5 w-5 text-accent" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">
                        {dayOfWeek} · {dateLabel}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {primarySku}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground/60 shrink-0" />
                  </button>
                );
              })}
            </div>
          )}

          <Button
            variant="ghost"
            className="w-full"
            onClick={() => onOpenChange(false)}
            disabled={isBooking}
          >
            Cancel
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
