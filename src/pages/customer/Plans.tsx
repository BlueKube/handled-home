import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ChevronLeft, Info, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProperty } from "@/hooks/useProperty";
import { usePlanVariants, ACTIVE_FAMILIES, type ActiveFamily } from "@/hooks/usePlanVariants";
import { useResolvePlanVariant } from "@/hooks/useResolvePlanVariant";
import { PlanFamilyCard } from "@/components/plans/PlanFamilyCard";
import { FAMILY_HIGHLIGHTS } from "@/components/plans/planTierStyles";
import { CreditsExplainer } from "@/components/plans/CreditsExplainer";
import { BundleSavingsCard } from "@/components/plans/BundleSavingsCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { QueryErrorCard } from "@/components/QueryErrorCard";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { HelpTip } from "@/components/ui/help-tip";
import { buildRationale } from "@/lib/planRationale";
import { PlansResolvedView } from "./PlansResolvedView";
import { useAllPlanHandles, useAllPlanZoneAvailability, useZoneByZip } from "./plansQueries";
import type { Plan } from "@/hooks/usePlans";

const FAMILY_DISPLAY: Record<ActiveFamily, { name: string; tagline: string }> = {
  basic: { name: "Basic", tagline: "The basics, handled." },
  full: { name: "Full", tagline: "Your full outdoor routine." },
  premier: { name: "Premier", tagline: "Total home care." },
};

// Maps the new family keys to the legacy TIER_SERVICES keys inside
// BundleSavingsCard. When BundleSavingsCard is updated to know the new
// families, this translation can go away.
const BUNDLE_TIER_KEY: Record<ActiveFamily, string> = {
  basic: "essential",
  full: "plus",
  premier: "premium",
};

export default function CustomerPlans() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isGated = searchParams.get("gated") === "1";

  const { property } = useProperty();
  const { data: families, isLoading, isError, refetch } = usePlanVariants();
  const resolveVariant = useResolvePlanVariant();
  const { data: customerZoneId } = useZoneByZip(property?.zip_code ?? "");
  const { data: allAvail } = useAllPlanZoneAvailability();
  const { data: allHandles } = useAllPlanHandles();

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

  const [selectedFamily, setSelectedFamily] = useState<ActiveFamily | null>(null);
  const [resolvedVariantId, setResolvedVariantId] = useState<string | null>(null);
  const [showOtherSizes, setShowOtherSizes] = useState(false);

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

  const isFamilyZoneEnabled = (family: ActiveFamily): boolean => {
    if (!families || !customerZoneId || !allAvail) return true;
    const variants = families[family];
    if (!variants.length) return false;
    // Per-variant default is false: if a zone is known and there's no explicit
    // availability row for a (plan, zone) pair, treat that variant as disabled
    // (matches pre-Batch-2.3 Plans.tsx fail-closed semantics). A family is
    // enabled iff at least one variant is explicitly enabled in the zone.
    return variants.some((v) => {
      const row = allAvail.find((a) => a.plan_id === v.id && a.zone_id === customerZoneId);
      return row?.is_enabled ?? false;
    });
  };

  const handleFamilySelect = async (family: ActiveFamily) => {
    if (!property?.id || resolveVariant.isPending) return;
    try {
      const variantId = await resolveVariant.mutateAsync({ propertyId: property.id, family });
      setSelectedFamily(family);
      setResolvedVariantId(variantId);
      setShowOtherSizes(false);
    } catch {
      // error surface handled via resolveVariant.isError
    }
  };

  const handleBack = () => {
    setSelectedFamily(null);
    setResolvedVariantId(null);
    setShowOtherSizes(false);
    resolveVariant.reset();
  };

  const allFamiliesEmpty = !!families &&
    families.basic.length === 0 && families.full.length === 0 && families.premier.length === 0;

  if (isError) {
    return (
      <div className="animate-fade-in p-4 pb-24">
        <button
          onClick={() => navigate("/customer/more")}
          className="flex items-center gap-1 text-muted-foreground mb-2 hover:text-foreground transition-colors"
          aria-label="Back to More menu"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="text-sm">More</span>
        </button>
        <h1 className="text-h2 mb-4">Pick your membership</h1>
        <QueryErrorCard message="Failed to load plans." onRetry={() => refetch()} />
      </div>
    );
  }

  // Resolved-variant render ------------------------------------------------
  if (selectedFamily && resolvedVariantId && families) {
    const familyVariants = families[selectedFamily];
    const resolvedVariant: Plan | undefined = familyVariants.find((v) => v.id === resolvedVariantId);

    if (!resolvedVariant) {
      return (
        <div className="p-4 space-y-4">
          <QueryErrorCard message="Could not load your matched plan. Try again." />
          <Button variant="outline" className="w-full" onClick={handleBack}>
            Back to all plans
          </Button>
        </div>
      );
    }

    const handlesPerCycle = allHandles?.get(resolvedVariant.id)?.handles_per_cycle;
    const rationale = buildRationale({
      sqftTier: signals?.home_sqft_tier ?? null,
      yardTier: signals?.yard_tier ?? null,
      familyName: FAMILY_DISPLAY[selectedFamily].name,
      variantName: resolvedVariant.name,
    });
    const otherVariants = familyVariants.filter((v) => v.id !== resolvedVariant.id);

    return (
      <PlansResolvedView
        family={selectedFamily}
        resolvedVariant={resolvedVariant}
        otherVariants={otherVariants}
        handlesPerCycle={handlesPerCycle}
        rationale={rationale}
        isRecommended={recommendedFamily === selectedFamily}
        showOtherSizes={showOtherSizes}
        onToggleOtherSizes={() => setShowOtherSizes((s) => !s)}
        onBack={handleBack}
      />
    );
  }

  // Family-picker render ---------------------------------------------------
  return (
    <div className="p-4 pb-24 space-y-6 animate-fade-in">
      <div>
        <button
          onClick={() => navigate("/customer/more")}
          className="flex items-center gap-1 text-muted-foreground mb-2 hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
          aria-label="Back to More menu"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="text-sm">More</span>
        </button>
        <h1 className="text-h2">
          Pick your membership{" "}
          <HelpTip text="Plans set how many credits you get each cycle. We size the plan to your home after you pick a family." />
        </h1>
        <p className="text-muted-foreground mt-1">One simple plan — we handle the rest.</p>
      </div>

      {isGated && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            You need an active membership to access that feature. Pick a plan to get started.
          </AlertDescription>
        </Alert>
      )}

      {!property?.id && !isLoading && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Set up your home first so we can match the right plan size.
          </AlertDescription>
        </Alert>
      )}

      <CreditsExplainer />

      {families && !allFamiliesEmpty && (() => {
        const rec = recommendedFamily ? families[recommendedFamily][0] : undefined;
        if (!rec) return null;
        return (
          <BundleSavingsCard
            planPriceCents={undefined}
            planDisplayPrice={rec.display_price_text ?? undefined}
            tierKey={recommendedFamily ? BUNDLE_TIER_KEY[recommendedFamily] : "essential"}
          />
        );
      })()}

      {isLoading ? (
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
                isRecommended={recommendedFamily === family}
                zoneEnabled={isFamilyZoneEnabled(family)}
                onSelect={
                  resolveVariant.isPending || !property?.id
                    ? undefined
                    : () => handleFamilySelect(family)
                }
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

      <p className="text-xs text-center text-muted-foreground">
        All plans bill every 4 weeks. Change or cancel anytime — changes take effect next cycle.
      </p>
    </div>
  );
}
