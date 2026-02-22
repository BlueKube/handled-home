import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CalendarDays, CheckCircle2 } from "lucide-react";
import type { ServiceDayAssignment, ServiceDayOffer as OfferType } from "@/hooks/useServiceDayAssignment";

interface ServiceDayOfferProps {
  assignment: ServiceDayAssignment;
  offers: OfferType[];
  onConfirm: () => void;
  onReject: () => void;
  isConfirming: boolean;
  isRejecting: boolean;
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function ServiceDayOfferCard({
  assignment,
  offers,
  onConfirm,
  onReject,
  isConfirming,
  isRejecting,
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
          <p className="text-caption">We've matched you to the best route.</p>
        </div>
      </div>

      <div className="text-center py-4">
        <p className="text-3xl font-bold text-accent">
          {capitalize(primaryOffer?.offered_day_of_week ?? assignment.day_of_week)}
        </p>
        {assignment.reason_code === "default_day_full" && (
          <p className="text-caption mt-1">
            Your zone's default day is full — this is the best available match.
          </p>
        )}
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
