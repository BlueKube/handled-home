import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getCategoryLabel } from "@/lib/serviceCategories";
import { Flame } from "lucide-react";

interface Props {
  /** Zone IDs available to this provider (from invite or coverage) */
  zoneIds: string[];
}

/**
 * During onboarding, shows which categories are actively recruiting
 * in the provider's target zones. Reinforces early positioning value.
 */
export function OnboardingRecruitingSignals({ zoneIds }: Props) {
  const { data: signals } = useQuery({
    queryKey: ["onboarding_recruiting_signals", zoneIds],
    enabled: zoneIds.length > 0,
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("market_zone_category_state")
        .select("zone_id, category, status")
        .in("zone_id", zoneIds)
        .eq("status", "PROVIDER_RECRUITING");
      if (error) throw error;
      return data ?? [];
    },
  });

  if (!signals || signals.length === 0) return null;

  const categories = [...new Set(signals.map((s) => s.category))];

  return (
    <div className="rounded-lg bg-warning/5 border border-warning/20 p-3 mt-4">
      <div className="flex items-center gap-2 mb-2">
        <Flame className="h-4 w-4 text-warning" />
        <span className="text-sm font-semibold">High-Demand Categories</span>
      </div>
      <p className="text-xs text-muted-foreground mb-2">
        We're actively recruiting providers for these services in your area.
        Getting started now means earlier positioning.
      </p>
      <div className="flex flex-wrap gap-1.5">
        {categories.map((cat) => (
          <span
            key={cat}
            className="inline-flex items-center rounded-full bg-warning/10 px-2.5 py-0.5 text-xs font-medium text-warning"
          >
            {getCategoryLabel(cat)}
          </span>
        ))}
      </div>
    </div>
  );
}
