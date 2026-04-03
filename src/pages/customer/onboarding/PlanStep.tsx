import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProperty } from "@/hooks/useProperty";
import { usePlans } from "@/hooks/usePlans";
import { PlanCard } from "@/components/plans/PlanCard";
import { HandlesExplainer } from "@/components/plans/HandlesExplainer";
import { BundleSavingsCard } from "@/components/plans/BundleSavingsCard";
import { TrustBar } from "@/components/customer/TrustBar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Shield, Loader2 } from "lucide-react";
import { TIER_HIGHLIGHTS, getTierKey } from "./shared";
import { QueryErrorCard } from "@/components/QueryErrorCard";

export function PlanStep({ onSelectPlan, onSkip }: { onSelectPlan: (planId: string) => Promise<void>; onSkip: () => Promise<void> }) {
  const { data: plans, isLoading, isError: plansError } = usePlans("active");
  const { property } = useProperty();
  const [selecting, setSelecting] = useState<string | null>(null);

  const { data: allHandles, isError: handlesError } = useQuery({
    queryKey: ["plan_handles_all"],
    queryFn: async () => {
      const { data, error } = await supabase.from("plan_handles").select("plan_id, handles_per_cycle");
      if (error) throw error;
      return new Map((data ?? []).map((r) => [r.plan_id, r]));
    },
  });

  const { data: customerZoneId, isError: zoneError } = useQuery({
    queryKey: ["zone_by_zip", property?.zip_code],
    enabled: !!property?.zip_code && /^\d{5}$/.test(property.zip_code),
    queryFn: async () => {
      const { data, error } = await supabase.from("zones").select("id").contains("zip_codes", [property!.zip_code]).eq("status", "active").limit(1).maybeSingle();
      if (error) throw error;
      return data?.id ?? null;
    },
  });

  const { data: allAvail } = useQuery({
    queryKey: ["plan_zone_availability_all"],
    queryFn: async () => {
      const { data, error } = await supabase.from("plan_zone_availability").select("plan_id, zone_id, is_enabled");
      if (error) throw error;
      return data ?? [];
    },
  });

  const isPlanZoneEnabled = (planId: string): boolean => {
    if (!customerZoneId || !allAvail) return true;
    const row = allAvail.find((a) => a.plan_id === planId && a.zone_id === customerZoneId);
    return row?.is_enabled ?? true;
  };

  const handleSelect = async (planId: string) => {
    setSelecting(planId);
    try { await onSelectPlan(planId); } finally { setSelecting(null); }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Shield className="h-10 w-10 text-accent mx-auto mb-3" />
        <h1 className="text-h2">Pick your membership</h1>
        <p className="text-muted-foreground text-sm mt-1">One simple plan — we handle the rest.</p>
      </div>
      <HandlesExplainer />
      {plans && plans.length > 0 && (() => {
        const recommended = plans.find((p) => p.recommended_rank != null && plans.every((q) => (q.recommended_rank ?? 0) <= (p.recommended_rank ?? 0))) ?? plans[0];
        return <BundleSavingsCard planPriceCents={undefined} planDisplayPrice={recommended.display_price_text ?? undefined} tierKey={getTierKey(recommended.name)} />;
      })()}
      <TrustBar />
      {(plansError || handlesError || zoneError) ? (
        <QueryErrorCard message="Could not load plans." />
      ) : isLoading ? (
        <div className="space-y-4">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-56 w-full rounded-xl" />)}</div>
      ) : (
        <div className="space-y-4">
          {plans?.map((plan) => {
            const tierKey = getTierKey(plan.name);
            const dbHandles = allHandles?.get(plan.id);
            const isRecommended = plan.recommended_rank != null && plans.every((p) => (p.recommended_rank ?? 0) <= (plan.recommended_rank ?? 0));
            return (
              <PlanCard key={plan.id} plan={plan} isRecommended={isRecommended} zoneEnabled={isPlanZoneEnabled(plan.id)}
                handlesPerCycle={dbHandles?.handles_per_cycle} tierHighlights={TIER_HIGHLIGHTS[tierKey]}
                onBuildRoutine={isPlanZoneEnabled(plan.id) ? () => handleSelect(plan.id) : undefined} />
            );
          })}
        </div>
      )}
      {selecting && (
        <div className="flex items-center justify-center gap-2 py-4">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm text-muted-foreground">Saving selection…</span>
        </div>
      )}
      <Button variant="ghost" className="w-full text-sm min-h-[44px]" onClick={onSkip} disabled={!!selecting}>
        Skip for now — browse plans later from your dashboard
      </Button>
    </div>
  );
}
