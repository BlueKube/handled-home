import { useProviderMarketHeat } from "@/hooks/useProviderMarketHeat";
import { getCategoryLabel } from "@/lib/serviceCategories";
import { Card } from "@/components/ui/card";
import { Flame, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

/**
 * Shows opportunity badges when PROVIDER_RECRUITING zones exist
 * in the provider's coverage area. Encourages expanding capabilities.
 */
export function MarketHeatBanner() {
  const { signals, hasOpportunities, isLoading } = useProviderMarketHeat();
  const navigate = useNavigate();

  if (isLoading || !hasOpportunities) return null;

  // Group by category for cleaner display
  const byCategory = new Map<string, string[]>();
  for (const s of signals) {
    const zones = byCategory.get(s.category) ?? [];
    zones.push(s.zoneName);
    byCategory.set(s.category, zones);
  }

  const entries = [...byCategory.entries()].slice(0, 3); // Max 3

  return (
    <Card className="p-4 bg-warning/5 border-warning/20">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-warning/10 shrink-0">
          <Flame className="h-5 w-5 text-warning" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">Opportunities in Your Area</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            We're actively recruiting providers for these services
          </p>
          <div className="mt-2 space-y-1">
            {entries.map(([category, zones]) => (
              <div key={category} className="flex items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-warning/10 px-2 py-0.5 text-xs font-medium text-warning">
                  {getCategoryLabel(category)}
                </span>
                <span className="text-xs text-muted-foreground truncate">
                  {zones.length === 1 ? zones[0] : `${zones.length} zones`}
                </span>
              </div>
            ))}
          </div>
        </div>
        <button
          onClick={() => navigate("/provider/coverage")}
          className="shrink-0 mt-1"
        >
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>
    </Card>
  );
}
