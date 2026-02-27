import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, ShieldCheck, TrendingUp, Zap } from "lucide-react";
import type { ServiceDayAssignment, ServiceDayOffer as OfferType } from "@/hooks/useServiceDayAssignment";

interface ServiceDayOfferProps {
  assignment: ServiceDayAssignment;
  offers: OfferType[];
  onConfirm: () => void;
  onReject: () => void;
  isConfirming: boolean;
  isRejecting: boolean;
  capacityUtilization?: number;
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// Reason code templates with efficiency framing
const REASON_TEMPLATES: Record<string, (day: string) => string> = {
  default_day_available: (day) =>
    `${capitalize(day)} is the most efficient route day for your neighborhood — your provider serves nearby homes on this day too.`,
  default_day_full: () =>
    "Your zone's most efficient day is full. We've matched you to the next best route day for reliable, on-time service.",
  no_capacity: () =>
    "All days are currently at capacity. We'll confirm your spot as soon as one opens up.",
};

function getReasonText(reasonCode: string | null, day: string): string {
  if (reasonCode && REASON_TEMPLATES[reasonCode]) {
    return REASON_TEMPLATES[reasonCode](day);
  }
  return "We've matched you to the most efficient route day in your area.";
}

// Confidence badge
function ConfidenceBadge({ utilization }: { utilization?: number }) {
  if (utilization == null) return null;
  if (utilization < 70) {
    return (
      <Badge variant="secondary" className="gap-1">
        <ShieldCheck className="h-3 w-3" /> Stable day
      </Badge>
    );
  }
  if (utilization < 90) {
    return (
      <Badge variant="outline" className="gap-1">
        <TrendingUp className="h-3 w-3" /> Popular day
      </Badge>
    );
  }
  return null;
}

export function ServiceDayOfferCard({
  assignment,
  offers,
  onConfirm,
  onReject,
  isConfirming,
  isRejecting,
  capacityUtilization,
}: ServiceDayOfferProps) {
  const primaryOffer = offers.find((o) => o.offer_type === "primary");

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center">
          <CalendarDays className="h-5 w-5 text-accent" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Your Service Day</h2>
          <div className="flex items-center gap-1.5 mt-0.5">
            <Zap className="h-3 w-3 text-accent" />
            <span className="text-xs font-medium text-accent">System Recommended</span>
          </div>
        </div>
      </div>

      <p className="text-sm text-muted-foreground leading-relaxed">
        {getReasonText(assignment.reason_code, primaryOffer?.offered_day_of_week ?? assignment.day_of_week)}
      </p>

      <div className="text-center py-4 space-y-2">
        <p className="text-3xl font-bold text-accent">
          {capitalize(primaryOffer?.offered_day_of_week ?? assignment.day_of_week)}
        </p>
        <ConfidenceBadge utilization={capacityUtilization} />
      </div>

      {/* Alignment explanation if present */}
      {assignment.alignment_explanation && (
        <div className="p-3 rounded-lg bg-muted/50 border border-border/40">
          <p className="text-xs text-muted-foreground leading-relaxed">
            {assignment.alignment_explanation}
          </p>
        </div>
      )}

      <Button onClick={onConfirm} disabled={isConfirming} className="w-full">
        {isConfirming ? "Confirming…" : "Confirm Service Day"}
      </Button>

      {!assignment.rejection_used && (
        <Button
          variant="outline"
          onClick={onReject}
          disabled={isRejecting}
          className="w-full"
        >
          {isRejecting ? "Finding alternatives…" : "This day won't work"}
        </Button>
      )}
    </Card>
  );
}
