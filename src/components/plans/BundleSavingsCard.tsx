import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PiggyBank, Check, X } from "lucide-react";

const SEPARATE_VENDOR_COSTS: Record<string, { label: string; monthlyCost: number }> = {
  lawn: { label: "Lawn care", monthlyCost: 160 },
  pool: { label: "Pool maintenance", monthlyCost: 120 },
  pest: { label: "Pest control", monthlyCost: 50 },
  cleaning: { label: "Home cleaning", monthlyCost: 200 },
  landscaping: { label: "Landscaping", monthlyCost: 180 },
};

interface BundleSavingsCardProps {
  planPriceCents?: number;
  planDisplayPrice?: string;
  tierKey: string;
  loading?: boolean;
}

const TIER_SERVICES: Record<string, string[]> = {
  essential: ["lawn"],
  plus: ["lawn", "pest"],
  premium: ["lawn", "pest", "pool"],
};

const DISMISS_KEY = "bundle-savings-dismissed";

export function BundleSavingsCard({ planPriceCents, planDisplayPrice, tierKey, loading }: BundleSavingsCardProps) {
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(DISMISS_KEY) === "true");

  if (dismissed) return null;

  if (loading) {
    return (
      <Card className="p-4 bg-accent/5 border-accent/20">
        <div className="flex items-start gap-3">
          <Skeleton className="h-9 w-9 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-full" />
          </div>
        </div>
      </Card>
    );
  }

  const services = TIER_SERVICES[tierKey] ?? TIER_SERVICES.essential;
  const separateTotal = services.reduce(
    (sum, key) => sum + (SEPARATE_VENDOR_COSTS[key]?.monthlyCost ?? 0),
    0
  );

  const planMonthly = planPriceCents
    ? Math.round(planPriceCents / 100)
    : planDisplayPrice
      ? parseInt(planDisplayPrice.replace(/[^0-9]/g, ""), 10)
      : 0;

  const savings = separateTotal - planMonthly;

  if (savings <= 0 || planMonthly === 0) {
    return (
      <Card className="p-4 bg-accent/5 border-accent/20">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
            <PiggyBank className="h-5 w-5 text-accent" />
          </div>
          <p className="text-sm text-muted-foreground">
            Your savings breakdown will appear based on your selected plan.
          </p>
        </div>
      </Card>
    );
  }

  const savingsPercent = Math.round((savings / separateTotal) * 100);

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, "true");
    setDismissed(true);
  };

  return (
    <Card className="p-4 bg-accent/5 border-accent/20 relative">
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 h-7 w-7 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
        aria-label="Dismiss savings card"
      >
        <X className="h-3.5 w-3.5 text-muted-foreground" />
      </button>
      <div className="flex items-start gap-3">
        <div className="h-9 w-9 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
          <PiggyBank className="h-5 w-5 text-accent" />
        </div>
        <div className="flex-1 pr-6">
          <p className="text-sm font-semibold text-foreground">
            Save ~${savings}/mo vs. separate vendors
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            That's {savingsPercent}% less than hiring individually
          </p>
          <div className="mt-2 space-y-1">
            {services.map((key) => {
              const svc = SEPARATE_VENDOR_COSTS[key];
              if (!svc) return null;
              return (
                <div key={key} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Check className="h-3 w-3 text-accent" />
                  <span>{svc.label}</span>
                  <span className="line-through ml-auto">${svc.monthlyCost}/mo</span>
                </div>
              );
            })}
            <div className="flex items-center gap-1.5 text-xs font-semibold text-accent pt-1 border-t border-accent/10">
              <PiggyBank className="h-3 w-3" />
              <span>Handled Home</span>
              <span className="ml-auto">${planMonthly}/mo</span>
            </div>
          </div>
          <Button
            variant="accent"
            size="sm"
            className="w-full mt-3"
            onClick={() => navigate("/customer/plans")}
          >
            View Your Plan
          </Button>
        </div>
      </div>
    </Card>
  );
}
