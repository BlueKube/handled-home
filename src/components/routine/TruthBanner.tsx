import { CalendarDays, Clock, CreditCard, Zap } from "lucide-react";

interface TruthBannerProps {
  planName: string;
  serviceWeeks: number;
  serviceDay: string | null;
  billingCycleLabel: string;
  modelLabel: string;
  included: number;
}

export function TruthBanner({ planName, serviceWeeks, serviceDay, billingCycleLabel, modelLabel, included }: TruthBannerProps) {
  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  return (
    <div className="sticky top-0 z-30 bg-primary text-primary-foreground px-4 py-3 shadow-md">
      <div className="flex items-center gap-2 mb-1.5">
        <Zap className="h-4 w-4" />
        <span className="text-sm font-semibold">{planName}</span>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs opacity-90">
        <span className="flex items-center gap-1">
          <CreditCard className="h-3 w-3" />
          {included} {modelLabel}/cycle
        </span>
        <span className="flex items-center gap-1">
          <CalendarDays className="h-3 w-3" />
          {serviceDay ? capitalize(serviceDay) : "Not set"}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {serviceWeeks} wk{serviceWeeks !== 1 ? "s" : ""}/cycle
        </span>
      </div>
    </div>
  );
}
