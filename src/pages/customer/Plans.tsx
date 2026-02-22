import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePlans } from "@/hooks/usePlans";
import { useProperty } from "@/hooks/useProperty";
import { useZoneLookup } from "@/hooks/useZoneLookup";
import { PlanCard } from "@/components/plans/PlanCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

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
    if (!customerZoneId || !allAvail) return true; // no property or data yet — show all
    const row = allAvail.find((a) => a.plan_id === planId && a.zone_id === customerZoneId);
    return row?.is_enabled ?? false; // no row = not enabled for this zone
  };

  return (
    <div className="p-4 pb-24 space-y-6 animate-fade-in max-w-lg mx-auto">
      <div>
        <h1 className="text-h2">Choose a Plan</h1>
        <p className="text-muted-foreground mt-1">Pick the plan that fits your home.</p>
      </div>

      {isGated && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>You need an active subscription to access that feature. Pick a plan to get started.</AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-48 w-full" />)}
        </div>
      ) : (
        <div className="space-y-4">
          {plans?.map((plan, idx) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              isRecommended={idx === 0}
              zoneEnabled={isPlanZoneEnabled(plan.id)}
              onPreview={() => navigate(`/customer/plans/${plan.id}`)}
              onBuildRoutine={() => navigate(`/customer/routine?plan=${plan.id}`)}
            />
          ))}
          {(!plans || plans.length === 0) && (
            <p className="text-center text-muted-foreground py-8">No plans available at the moment.</p>
          )}
        </div>
      )}
    </div>
  );
}
