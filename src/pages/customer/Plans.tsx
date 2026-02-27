import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePlans } from "@/hooks/usePlans";
import { useProperty } from "@/hooks/useProperty";
import { PlanCard } from "@/components/plans/PlanCard";
import { HandlesExplainer } from "@/components/plans/HandlesExplainer";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

/**
 * D-Pre prototype: static tier metadata until handles schema (D0) lands.
 * Keys match plan name substring (case-insensitive).
 */
const TIER_META: Record<string, { handlesPerCycle: number; highlights: string[] }> = {
  essential: {
    handlesPerCycle: 10,
    highlights: [
      "Weekly mow + edge trim",
      "Swap services each cycle",
      "Roll over unused handles",
    ],
  },
  plus: {
    handlesPerCycle: 16,
    highlights: [
      "Everything in Essential",
      "Seasonal services included",
      "Priority scheduling",
    ],
  },
  premium: {
    handlesPerCycle: 24,
    highlights: [
      "Everything in Plus",
      "Home Assistant access",
      "Dedicated provider team",
      "Same-day add-on booking",
    ],
  },
};

function getTierMeta(planName: string) {
  const lower = planName.toLowerCase();
  if (lower.includes("premium")) return TIER_META.premium;
  if (lower.includes("plus")) return TIER_META.plus;
  return TIER_META.essential;
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

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-56 w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {plans?.map((plan, idx) => {
            const meta = getTierMeta(plan.name);
            return (
              <PlanCard
                key={plan.id}
                plan={plan}
                isRecommended={idx === 0}
                zoneEnabled={isPlanZoneEnabled(plan.id)}
                handlesPerCycle={meta.handlesPerCycle}
                tierHighlights={meta.highlights}
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
