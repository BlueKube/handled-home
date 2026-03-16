import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePlans } from "@/hooks/usePlans";
import { useProperty } from "@/hooks/useProperty";
import { PlanCard } from "@/components/plans/PlanCard";
import { HandlesExplainer } from "@/components/plans/HandlesExplainer";
import { BundleSavingsCard } from "@/components/plans/BundleSavingsCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

/**
 * Fallback tier highlights (used when plan_handles has no DB rows yet).
 */
const TIER_HIGHLIGHTS: Record<string, string[]> = {
  essential: [
    "Weekly mow + edge trim",
    "Swap services each cycle",
    "Roll over unused handles",
  ],
  plus: [
    "Everything in Essential",
    "Seasonal services included",
    "Priority scheduling",
  ],
  premium: [
    "Everything in Plus",
    "Home Assistant access",
    "Dedicated provider team",
    "Same-day add-on booking",
  ],
};

function getTierKey(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes("premium")) return "premium";
  if (lower.includes("plus")) return "plus";
  return "essential";
}

/** Fetch all plan_handles rows in one query */
function useAllPlanHandles() {
  return useQuery({
    queryKey: ["plan_handles_all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("plan_handles")
        .select("plan_id, handles_per_cycle, rollover_cap, rollover_expiry_days");
      if (error) throw error;
      return new Map((data ?? []).map((r) => [r.plan_id, r]));
    },
  });
}

function useAllPlanZoneAvailability() {
  return useQuery({
    queryKey: ["plan_zone_availability_all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("plan_zone_availability")
        .select("plan_id, zone_id, is_enabled");
      if (error) throw error;
      return data ?? [];
    },
  });
}

function useZoneByZip(zipCode: string) {
  return useQuery({
    queryKey: ["zone_by_zip", zipCode],
    enabled: /^\d{5}$/.test(zipCode),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("zones")
        .select("id")
        .contains("zip_codes", [zipCode])
        .eq("status", "active")
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data?.id ?? null;
    },
  });
}

export default function CustomerPlans() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isGated = searchParams.get("gated") === "1";
  const { data: plans, isLoading } = usePlans("active");
  const { property } = useProperty();
  const { data: customerZoneId } = useZoneByZip(property?.zip_code ?? "");
  const { data: allAvail } = useAllPlanZoneAvailability();
  const { data: allHandles } = useAllPlanHandles();

  const isPlanZoneEnabled = (planId: string): boolean => {
    if (!customerZoneId || !allAvail) return true;
    const row = allAvail.find((a) => a.plan_id === planId && a.zone_id === customerZoneId);
    return row?.is_enabled ?? false;
  };

  return (
    <div className="p-4 pb-24 space-y-6 animate-fade-in max-w-lg mx-auto">
      <div>
        <h1 className="text-h2">Pick your membership</h1>
        <p className="text-muted-foreground mt-1">
          One simple plan — we handle the rest.
        </p>
      </div>

      {isGated && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            You need an active membership to access that feature. Pick a plan to get started.
          </AlertDescription>
        </Alert>
      )}

      {/* Handles explainer — the "10-second" education */}
      <HandlesExplainer />

      {/* Bundle savings comparison */}
      {plans && plans.length > 0 && (() => {
        const recommended = plans.find((p) => p.recommended_rank != null && plans.every(
          (q) => (q.recommended_rank ?? 0) <= (p.recommended_rank ?? 0)
        )) ?? plans[0];
        const tierKey = getTierKey(recommended.name);
        return (
          <BundleSavingsCard
            planPriceCents={undefined}
            planDisplayPrice={recommended.display_price_text ?? undefined}
            tierKey={tierKey}
          />
        );
      })()}

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-56 w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {plans?.map((plan) => {
            const tierKey = getTierKey(plan.name);
            const dbHandles = allHandles?.get(plan.id);
            const handlesPerCycle = dbHandles?.handles_per_cycle;
            // Use recommended_rank: highest rank = recommended
            const isRecommended = plan.recommended_rank != null && plans.every(
              (p) => (p.recommended_rank ?? 0) <= (plan.recommended_rank ?? 0)
            );
            return (
              <PlanCard
                key={plan.id}
                plan={plan}
                isRecommended={isRecommended}
                zoneEnabled={isPlanZoneEnabled(plan.id)}
                handlesPerCycle={handlesPerCycle}
                tierHighlights={TIER_HIGHLIGHTS[tierKey]}
                onPreview={() => navigate(`/customer/plans/${plan.id}`)}
                onBuildRoutine={() => navigate(`/customer/routine?plan=${plan.id}`)}
              />
            );
          })}
          {(!plans || plans.length === 0) && (
            <p className="text-center text-muted-foreground py-8">
              No plans available at the moment.
            </p>
          )}
        </div>
      )}

      <p className="text-xs text-center text-muted-foreground">
        All plans bill every 4 weeks. Change or cancel anytime — changes take effect next cycle.
      </p>
    </div>
  );
}
