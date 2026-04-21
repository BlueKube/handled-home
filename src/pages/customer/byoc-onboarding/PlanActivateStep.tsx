import { useEffect, useMemo, useState } from "react";
import { usePlanVariants, ACTIVE_FAMILIES, type ActiveFamily } from "@/hooks/usePlanVariants";
import { PlanFamilyCard } from "@/components/plans/PlanFamilyCard";
import { FAMILY_HIGHLIGHTS } from "@/components/plans/planTierStyles";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, Loader2 } from "lucide-react";
import { QueryErrorCard } from "@/components/QueryErrorCard";

const FAMILY_DISPLAY: Record<ActiveFamily, { name: string; tagline: string }> = {
  basic: { name: "Basic", tagline: "The basics, handled." },
  full: { name: "Full", tagline: "Your full outdoor routine." },
  premier: { name: "Premier", tagline: "Total home care." },
};

export function PlanActivateStep({
  selectedPlanId,
  onSelectPlan,
  onActivate,
  onSkip,
}: {
  providerName: string;
  categoryLabel: string;
  cadence: string;
  selectedPlanId: string | null;
  onSelectPlan: (planId: string) => void;
  onActivate: () => Promise<void>;
  onSkip: () => void;
}) {
  const { data: families, isLoading, isError } = usePlanVariants();
  const [activating, setActivating] = useState(false);

  const recommendedFamily = useMemo<ActiveFamily | null>(() => {
    if (!families) return null;
    let best: ActiveFamily | null = null;
    let bestRank = -Infinity;
    for (const family of ACTIVE_FAMILIES) {
      const variants = families[family];
      if (!variants.length) continue;
      const rank = Math.max(...variants.map((v) => v.recommended_rank ?? 0));
      if (rank > bestRank) {
        bestRank = rank;
        best = family;
      }
    }
    return best;
  }, [families]);

  // Auto-select recommended family's smallest variant on load.
  useEffect(() => {
    if (!selectedPlanId && families && recommendedFamily) {
      const smallest = families[recommendedFamily][0];
      if (smallest) onSelectPlan(smallest.id);
    }
  }, [families, recommendedFamily, selectedPlanId, onSelectPlan]);

  const handleActivate = async () => {
    setActivating(true);
    try {
      await onActivate();
    } finally {
      setActivating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  if (isError) {
    return <QueryErrorCard message="Could not load plans." />;
  }

  const anyVariants =
    !!families && (families.basic.length > 0 || families.full.length > 0 || families.premier.length > 0);

  if (!anyVariants) {
    return (
      <div className="space-y-6 text-center py-8">
        <h1 className="text-h2">No Plans Available</h1>
        <p className="text-muted-foreground text-sm">
          Plans aren't available in your area yet. You can still connect with your provider.
        </p>
        <Button onClick={onSkip} className="w-full">
          Continue Without a Plan
        </Button>
      </div>
    );
  }

  const isSelectedInFamily = (family: ActiveFamily): boolean => {
    if (!selectedPlanId || !families) return false;
    return families[family].some((v) => v.id === selectedPlanId);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-h2">Choose Your Plan</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Your provider's service is included in all plans.
        </p>
      </div>

      <div className="space-y-4">
        {ACTIVE_FAMILIES.map((family) => {
          if (!families) return null;
          const variants = families[family];
          if (!variants.length) return null;
          const smallest = variants[0];
          const display = FAMILY_DISPLAY[family];
          return (
            <PlanFamilyCard
              key={family}
              family={family}
              familyName={display.name}
              tagline={display.tagline}
              startsAtPriceText={smallest.display_price_text ?? "—"}
              variantCount={variants.length}
              highlights={FAMILY_HIGHLIGHTS[family]}
              isRecommended={isSelectedInFamily(family) || recommendedFamily === family}
              zoneEnabled
              onSelect={() => onSelectPlan(smallest.id)}
            />
          );
        })}
      </div>

      <Button
        onClick={handleActivate}
        disabled={activating || !selectedPlanId}
        className="w-full h-12 text-base font-semibold rounded-xl"
      >
        {activating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
        Activate Service
        <ArrowRight className="h-4 w-4 ml-2" />
      </Button>

      <Button variant="ghost" className="w-full text-sm min-h-[44px]" onClick={onSkip}>
        Skip for now
      </Button>
    </div>
  );
}
