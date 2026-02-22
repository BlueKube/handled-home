import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, ShieldCheck, TrendingUp } from "lucide-react";
import type { ServiceDayAssignment, ServiceDayOffer as OfferType } from "@/hooks/useServiceDayAssignment";

interface ServiceDayOfferProps {
  assignment: ServiceDayAssignment;
  offers: OfferType[];
  onConfirm: () => void;
  onReject: () => void;
  isConfirming: boolean;
  isRejecting: boolean;
  capacityUtilization?: number; // L10: 0-100 percentage
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// L9: Reason code templates
const REASON_TEMPLATES: Record<string, (day: string) => string> = {
  default_day_available: (day) =>
    `We chose ${capitalize(day)} because it matches your neighborhood route and keeps service reliable.`,
  default_day_full: () =>
    "Your zone's default day is at capacity. We've matched you to the next best route day.",
  no_capacity: () =>
    "All days are currently at capacity. We'll confirm your spot as soon as one opens up.",
};

function getReasonText(reasonCode: string | null, day: string): string {
  if (reasonCode && REASON_TEMPLATES[reasonCode]) {
    return REASON_TEMPLATES[reasonCode](day);
  }
  return "We've matched you to the best available route.";
}

// L10: Confidence badge
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
          <p className="text-caption text-sm">
            {getReasonText(assignment.reason_code, primaryOffer?.offered_day_of_week ?? assignment.day_of_week)}
          </p>
        </div>
      </div>

      <div className="text-center py-4 space-y-2">
        <p className="text-3xl font-bold text-accent">
          {capitalize(primaryOffer?.offered_day_of_week ?? assignment.day_of_week)}
        </p>
        <ConfidenceBadge utilization={capacityUtilization} />
      </div>

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
