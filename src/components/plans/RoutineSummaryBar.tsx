import { Progress } from "@/components/ui/progress";

interface RoutineSummaryBarProps {
  used: number;
  included: number;
  extras: number;
  label: string;
  serviceWeeksIncluded?: number;
  serviceWeeksRemaining?: number;
}

export function RoutineSummaryBar({ used, included, extras, label, serviceWeeksIncluded, serviceWeeksRemaining }: RoutineSummaryBarProps) {
  const total = included + extras;
  const pct = total > 0 ? Math.min((used / total) * 100, 100) : 0;
  const overIncluded = used > included;

  return (
    <div className="sticky top-0 z-10 bg-card border-b border-border p-4 space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">
          {used} / {included} {label} used
          {overIncluded && extras > 0 && (
            <span className="text-warning ml-1">
              (+{used - included} extra)
            </span>
          )}
        </span>
        {extras > 0 && (
          <span className="text-muted-foreground text-xs">
            Up to {extras} extra available
          </span>
        )}
      </div>
      <Progress value={pct} className="h-2" />
      {serviceWeeksIncluded != null && (
        <p className="text-xs text-muted-foreground">
          {serviceWeeksIncluded} service week{serviceWeeksIncluded !== 1 ? "s" : ""} per billing cycle
          {serviceWeeksRemaining != null && ` · ${serviceWeeksRemaining} remaining`}
        </p>
      )}
    </div>
  );
}
