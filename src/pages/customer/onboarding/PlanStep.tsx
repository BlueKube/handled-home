import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProperty } from "@/hooks/useProperty";
import { usePlanVariants, type ActiveFamily, ACTIVE_FAMILIES } from "@/hooks/usePlanVariants";
import { useResolvePlanVariant } from "@/hooks/useResolvePlanVariant";
import { PlanFamilyCard } from "@/components/plans/PlanFamilyCard";
import { FAMILY_HIGHLIGHTS } from "@/components/plans/planTierStyles";
import { CreditsExplainer } from "@/components/plans/CreditsExplainer";
import { TrustBar } from "@/components/customer/TrustBar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Shield, Loader2 } from "lucide-react";
import { QueryErrorCard } from "@/components/QueryErrorCard";
import { buildRationale } from "@/lib/planRationale";
import { PlanStepResolved } from "./PlanStepResolved";
import type { Plan } from "@/hooks/usePlans";

const FAMILY_DISPLAY: Record<ActiveFamily, { name: string; tagline: string }> = {
  basic: { name: "Basic", tagline: "The basics, handled." },
  full: { name: "Full", tagline: "Your full outdoor routine." },
  premier: { name: "Premier", tagline: "Total home care." },
};

export interface PlanSelectionPayload {
  planId: string;
  recommendedPlanId: string;
  overrideReason: string | null;
}

export function PlanStep({
  onSelectPlan,
  onSkip,
}: {
  onSelectPlan: (payload: PlanSelectionPayload) => Promise<void>;
  onSkip: () => Promise<void>;
}) {
  const { property } = useProperty();
  const { data: families, isLoading: variantsLoading, isError: variantsError } = usePlanVariants();
  const resolveVariant = useResolvePlanVariant();

  const [selectedFamily, setSelectedFamily] = useState<ActiveFamily | null>(null);
  const [recommendedVariantId, setRecommendedVariantId] = useState<string | null>(null);
  const [overrideVariantId, setOverrideVariantId] = useState<string | null>(null);
  const [overrideReason, setOverrideReason] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  // Shared Map<plan_id, { plan_id, handles_per_cycle }> — same shape as Plans.tsx
  // and PlanActivateStep.tsx so the react-query cache is interoperable across
  // screens that navigate between each other.
  const { data: allHandles } = useQuery({
    queryKey: ["plan_handles_all"],
    queryFn: async () => {
      const { data, error } = await supabase.from("plan_handles").select("plan_id, handles_per_cycle");
      if (error) throw error;
      return new Map((data ?? []).map((r) => [r.plan_id, r]));
    },
  });

  const { data: signals } = useQuery({
    queryKey: ["property_signals", property?.id],
    enabled: !!property?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("property_signals")
        .select("home_sqft_tier, yard_tier")
        .eq("property_id", property!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

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

  const allFamiliesEmpty = !!families &&
    families.basic.length === 0 &&
    families.full.length === 0 &&
    families.premier.length === 0;

  const handleFamilySelect = async (family: ActiveFamily) => {
    if (!property?.id) return;
    if (resolveVariant.isPending) return;
    try {
      const variantId = await resolveVariant.mutateAsync({ propertyId: property.id, family });
      setSelectedFamily(family);
      setRecommendedVariantId(variantId);
      setOverrideVariantId(null);
      setOverrideReason(null);
    } catch {
      // resolveVariant.isError drives the visible error card below.
    }
  };

  const handleBack = () => {
    setSelectedFamily(null);
    setRecommendedVariantId(null);
    setOverrideVariantId(null);
    setOverrideReason(null);
    resolveVariant.reset();
  };

  const handleConfirm = async () => {
    if (!selectedFamily || !recommendedVariantId) return;
    const finalPlanId = overrideVariantId ?? recommendedVariantId;
    setConfirming(true);
    try {
      await onSelectPlan({
        planId: finalPlanId,
        recommendedPlanId: recommendedVariantId,
        overrideReason: overrideVariantId ? overrideReason : null,
      });
    } finally {
      setConfirming(false);
    }
  };

  // Resolved-variant render -------------------------------------------------
  if (selectedFamily && recommendedVariantId && families) {
    const familyVariants = families[selectedFamily];
    const resolvedVariant: Plan | undefined = familyVariants.find((v) => v.id === recommendedVariantId);
    const displayVariant: Plan | undefined =
      familyVariants.find((v) => v.id === (overrideVariantId ?? recommendedVariantId)) ?? resolvedVariant;

    if (!resolvedVariant || !displayVariant) {
      return (
        <div className="space-y-4">
          <QueryErrorCard message="Could not load your matched plan. Try again." />
          <Button variant="outline" className="w-full" onClick={handleBack}>
            Back to all plans
          </Button>
        </div>
      );
    }

    const resolvedIdx = familyVariants.findIndex((v) => v.id === resolvedVariant.id);
    const adjacent: Plan[] = [];
    if (resolvedIdx > 0) adjacent.push(familyVariants[resolvedIdx - 1]);
    if (resolvedIdx < familyVariants.length - 1) adjacent.push(familyVariants[resolvedIdx + 1]);

    const rationale = buildRationale({
      sqftTier: signals?.home_sqft_tier ?? null,
      yardTier: signals?.yard_tier ?? null,
      familyName: FAMILY_DISPLAY[selectedFamily].name,
      variantName: resolvedVariant.name,
    });

    const handlesPerCycle = allHandles?.get(displayVariant.id)?.handles_per_cycle ?? undefined;

    return (
      <PlanStepResolved
        family={selectedFamily}
        displayVariant={displayVariant}
        adjacentVariants={adjacent}
        handlesPerCycle={handlesPerCycle}
        rationale={rationale}
        isRecommended={recommendedFamily === selectedFamily}
        overrideVariantId={overrideVariantId}
        overrideReason={overrideReason}
        confirming={confirming}
        onOverrideVariantChange={setOverrideVariantId}
        onOverrideReasonChange={setOverrideReason}
        onBack={handleBack}
        onConfirm={handleConfirm}
        onSkip={onSkip}
      />
    );
  }

  // Family-picker render ----------------------------------------------------
  return (
    <div className="space-y-6">
      <div className="text-center">
        <Shield className="h-10 w-10 text-accent mx-auto mb-3" />
        <h1 className="text-h2">Pick your membership</h1>
        <p className="text-muted-foreground text-sm mt-1">
          We'll match the right size to your home.
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          You can change or cancel anytime.
        </p>
      </div>

      <CreditsExplainer />
      <TrustBar />

      {variantsError ? (
        <QueryErrorCard message="Could not load plans." />
      ) : variantsLoading || !families ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-56 w-full rounded-xl" />
          ))}
        </div>
      ) : allFamiliesEmpty ? (
        <p className="text-center text-muted-foreground py-8">
          No plans are available right now. Please check back shortly.
        </p>
      ) : (
        <div className="space-y-4">
          {ACTIVE_FAMILIES.map((family) => {
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
                isRecommended={recommendedFamily === family}
                zoneEnabled
                onSelect={resolveVariant.isPending ? undefined : () => handleFamilySelect(family)}
              />
            );
          })}
        </div>
      )}

      {resolveVariant.isPending && (
        <div className="flex items-center justify-center gap-2 py-4">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm text-muted-foreground">Matching your home…</span>
        </div>
      )}
      {resolveVariant.isError && (
        <QueryErrorCard message="Couldn't match a plan to your home. Try again." />
      )}

      <Button
        variant="ghost"
        className="w-full text-sm min-h-[44px]"
        onClick={onSkip}
        disabled={resolveVariant.isPending}
      >
        Skip for now — browse plans later from your dashboard
      </Button>
    </div>
  );
}
