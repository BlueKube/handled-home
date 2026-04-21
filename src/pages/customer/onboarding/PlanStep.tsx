import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProperty } from "@/hooks/useProperty";
import { usePlanVariants, type ActiveFamily, ACTIVE_FAMILIES } from "@/hooks/usePlanVariants";
import { useResolvePlanVariant } from "@/hooks/useResolvePlanVariant";
import { PlanFamilyCard } from "@/components/plans/PlanFamilyCard";
import { PlanVariantCard } from "@/components/plans/PlanVariantCard";
import { FAMILY_HIGHLIGHTS } from "@/components/plans/planTierStyles";
import { HandlesExplainer } from "@/components/plans/HandlesExplainer";
import { TrustBar } from "@/components/customer/TrustBar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, Loader2, ChevronLeft } from "lucide-react";
import { QueryErrorCard } from "@/components/QueryErrorCard";
import { buildRationale } from "@/lib/planRationale";
import type { Plan } from "@/hooks/usePlans";

const FAMILY_DISPLAY: Record<ActiveFamily, { name: string; tagline: string }> = {
  basic: { name: "Basic", tagline: "The basics, handled." },
  full: { name: "Full", tagline: "Your full outdoor routine." },
  premier: { name: "Premier", tagline: "Total home care." },
};

const OVERRIDE_REASONS: Array<{ value: string; label: string }> = [
  { value: "size_larger", label: "My home is larger than the default" },
  { value: "size_smaller", label: "My home is smaller than the default" },
  { value: "budget", label: "Budget preference" },
  { value: "other", label: "Other" },
];

const NO_REASON_SENTINEL = "__none__";

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

  // plan_handles lookup for credit allowance display
  const { data: allHandles } = useQuery({
    queryKey: ["plan_handles_all"],
    queryFn: async () => {
      const { data, error } = await supabase.from("plan_handles").select("plan_id, handles_per_cycle");
      if (error) throw error;
      return new Map((data ?? []).map((r) => [r.plan_id, r.handles_per_cycle]));
    },
  });

  // property_signals lookup for rationale sentence
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

  // Recommended family = one with the highest recommended_rank across all variants.
  const recommendedFamily = useMemo<ActiveFamily | null>(() => {
    if (!families) return null;
    let best: ActiveFamily | null = null;
    let bestRank = -Infinity;
    for (const family of ACTIVE_FAMILIES) {
      const first = families[family][0];
      if (first && (first.recommended_rank ?? 0) > bestRank) {
        bestRank = first.recommended_rank ?? 0;
        best = family;
      }
    }
    return best;
  }, [families]);

  const handleFamilySelect = async (family: ActiveFamily) => {
    if (!property?.id) return;
    try {
      const variantId = await resolveVariant.mutateAsync({ propertyId: property.id, family });
      setSelectedFamily(family);
      setRecommendedVariantId(variantId);
      setOverrideVariantId(null);
      setOverrideReason(null);
    } catch {
      // error surface handled via resolveVariant.isError below
    }
  };

  const handleBack = () => {
    setSelectedFamily(null);
    setRecommendedVariantId(null);
    setOverrideVariantId(null);
    setOverrideReason(null);
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

  // Family-view render ------------------------------------------------------
  if (!selectedFamily || !recommendedVariantId) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <Shield className="h-10 w-10 text-accent mx-auto mb-3" />
          <h1 className="text-h2">Pick your membership</h1>
          <p className="text-muted-foreground text-sm mt-1">
            We'll match the right size to your home.
          </p>
        </div>

        <HandlesExplainer />
        <TrustBar />

        {variantsError ? (
          <QueryErrorCard message="Could not load plans." />
        ) : variantsLoading || !families ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-56 w-full rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {ACTIVE_FAMILIES.map((family) => {
              const variants = families[family];
              if (!variants.length) return null;
              const smallest = variants[0]; // ordered by size_tier asc
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
                  onSelect={() => handleFamilySelect(family)}
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

  // Resolved-variant render -------------------------------------------------
  const familyVariants = families?.[selectedFamily] ?? [];
  const resolvedVariant: Plan | undefined = familyVariants.find((v) => v.id === recommendedVariantId);
  const displayVariant: Plan | undefined =
    familyVariants.find((v) => v.id === (overrideVariantId ?? recommendedVariantId)) ?? resolvedVariant;

  if (!resolvedVariant || !displayVariant) {
    return <QueryErrorCard message="Could not load your matched plan. Try again." />;
  }

  // Adjacent variants for override (one smaller + one larger size_tier).
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

  const handlesPerCycle = allHandles?.get(displayVariant.id);
  const overrideActive = overrideVariantId !== null;
  const canConfirm = !overrideActive || overrideReason !== null;

  return (
    <div className="space-y-6">
      <button
        onClick={handleBack}
        className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Back to all plans"
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="text-sm">Back to all plans</span>
      </button>

      <PlanVariantCard
        variant={displayVariant}
        family={selectedFamily}
        handlesPerCycle={handlesPerCycle}
        rationale={overrideActive ? undefined : rationale}
        highlights={FAMILY_HIGHLIGHTS[selectedFamily]}
        isRecommended={recommendedFamily === selectedFamily}
      />

      {adjacent.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <div>
            <p className="text-sm font-semibold text-foreground">Different size home?</p>
            <p className="text-xs text-muted-foreground mt-1">
              You can pick a size one step up or down. We'll flag it for review.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {adjacent.map((v) => {
              const isActive = overrideVariantId === v.id;
              return (
                <Button
                  key={v.id}
                  variant={isActive ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    if (isActive) {
                      setOverrideVariantId(null);
                      setOverrideReason(null);
                    } else {
                      setOverrideVariantId(v.id);
                    }
                  }}
                >
                  {v.name} {v.display_price_text ? `· ${v.display_price_text}` : ""}
                </Button>
              );
            })}
          </div>

          {overrideActive && (
            <div className="space-y-2">
              <label className="text-xs font-medium text-foreground" htmlFor="override-reason">
                Why this size?
              </label>
              <Select
                value={overrideReason ?? NO_REASON_SENTINEL}
                onValueChange={(v) => setOverrideReason(v === NO_REASON_SENTINEL ? null : v)}
              >
                <SelectTrigger id="override-reason">
                  <SelectValue placeholder="Choose a reason" />
                </SelectTrigger>
                <SelectContent>
                  {OVERRIDE_REASONS.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      )}

      <Button
        className="w-full h-12 text-base font-semibold rounded-xl"
        onClick={handleConfirm}
        disabled={!canConfirm || confirming}
      >
        {confirming ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
        Continue
      </Button>

      <Button
        variant="ghost"
        className="w-full text-sm min-h-[44px]"
        onClick={onSkip}
        disabled={confirming}
      >
        Skip for now — browse plans later from your dashboard
      </Button>
    </div>
  );
}
