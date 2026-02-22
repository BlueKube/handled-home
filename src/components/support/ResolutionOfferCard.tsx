import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle2, Gift, RefreshCw, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

interface ResolutionOfferCardProps {
  offer: {
    id: string;
    offer_type: string;
    status: string;
    amount_cents: number | null;
    description: string | null;
  };
  onAccept?: (offerId: string) => void;
  isPending?: boolean;
}

const OFFER_ICONS: Record<string, React.ElementType> = {
  credit: DollarSign,
  redo: RefreshCw,
  addon: Gift,
  refund: DollarSign,
  review: CheckCircle2,
};

const OFFER_LABELS: Record<string, string> = {
  credit: "Account credit",
  redo: "Free redo",
  addon: "Complimentary add-on",
  refund: "Partial refund",
  review: "Manager review",
};

export function ResolutionOfferCard({ offer, onAccept, isPending }: ResolutionOfferCardProps) {
  const Icon = OFFER_ICONS[offer.offer_type] ?? CheckCircle2;
  const label = OFFER_LABELS[offer.offer_type] ?? offer.offer_type;
  const isAccepted = offer.status === "accepted";
  const isExpired = offer.status === "expired";
  const isPendingOffer = offer.status === "pending";

  return (
    <Card className={cn(
      "p-4 space-y-3 transition-all",
      isAccepted && "border-success/40 bg-success/5",
      isExpired && "opacity-50"
    )}>
      <div className="flex items-start gap-3">
        <div className={cn(
          "h-9 w-9 rounded-lg flex items-center justify-center shrink-0",
          isAccepted ? "bg-success/15 text-success" : "bg-accent/10 text-accent"
        )}>
          <Icon className="h-4.5 w-4.5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">{label}</p>
          {offer.amount_cents != null && offer.amount_cents > 0 && (
            <p className="text-lg font-bold text-accent mt-0.5">
              ${(offer.amount_cents / 100).toFixed(2)}
            </p>
          )}
          {offer.description && (
            <p className="text-xs text-muted-foreground mt-1">{offer.description}</p>
          )}
        </div>
        {isAccepted && (
          <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
        )}
      </div>

      {isPendingOffer && onAccept && (
        <Button
          className="w-full"
          onClick={() => onAccept(offer.id)}
          disabled={isPending}
        >
          {isPending ? "Accepting…" : "Accept this resolution"}
        </Button>
      )}

      {isAccepted && (
        <p className="text-xs text-success font-medium text-center">✓ Accepted</p>
      )}
      {isExpired && (
        <p className="text-xs text-muted-foreground text-center">Expired</p>
      )}
    </Card>
  );
}
