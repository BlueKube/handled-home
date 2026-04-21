import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LowCreditsBannerProps {
  balance: number;
  annualCap: number;
  onTopUp?: () => void;
  onDismiss?: () => void;
}

export function LowCreditsBanner({ balance, annualCap, onTopUp, onDismiss }: LowCreditsBannerProps) {
  if (annualCap <= 0) return null;
  if (balance >= 0.2 * annualCap) return null;

  return (
    <div
      role="status"
      className="rounded-xl border border-warning/30 bg-warning/10 p-4 flex items-start gap-3"
    >
      <AlertCircle className="h-5 w-5 text-warning shrink-0 mt-0.5" aria-hidden="true" />
      <div className="flex-1 space-y-2">
        <div>
          <p className="text-sm font-semibold text-foreground">Running low</p>
          <p className="text-sm text-muted-foreground">
            Top up to avoid pausing work on your home.
          </p>
        </div>
        {(onTopUp || onDismiss) && (
          <div className="flex gap-2 pt-1">
            {onTopUp && (
              <Button size="sm" onClick={onTopUp}>
                Top up credits
              </Button>
            )}
            {onDismiss && (
              <Button size="sm" variant="ghost" onClick={onDismiss}>
                Later
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
