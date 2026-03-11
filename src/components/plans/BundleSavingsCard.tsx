import { Card } from "@/components/ui/card";
import { PiggyBank, Check } from "lucide-react";

/**
 * Estimated monthly cost if a homeowner hires separate vendors for each service.
 * These are conservative averages for suburban US markets.
 */
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
}

/** Services included by tier for the savings comparison */
const TIER_SERVICES: Record<string, string[]> = {
  essential: ["lawn"],
  plus: ["lawn", "pest"],
  premium: ["lawn", "pest", "pool"],
};

export function BundleSavingsCard({ planPriceCents, planDisplayPrice, tierKey }: BundleSavingsCardProps) {
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

  if (savings <= 0 || planMonthly === 0) return null;

  const savingsPercent = Math.round((savings / separateTotal) * 100);

  return (
    <Card className="p-4 bg-accent/5 border-accent/20">
      <div className="flex items-start gap-3">
        <div className="h-9 w-9 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
          <PiggyBank className="h-5 w-5 text-accent" />
        </div>
        <div className="flex-1">
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
        </div>
      </div>
    </Card>
  );
}
