import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { usePlans } from "@/hooks/usePlans";
import { PlanCard } from "@/components/plans/PlanCard";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, Loader2 } from "lucide-react";
import { TIER_HIGHLIGHTS, getTierKey } from "./shared";

export function PlanActivateStep({
  providerName,
  categoryLabel,
  cadence,
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
  const { data: plans, isLoading: plansLoading } = usePlans("active");
  const [activating, setActivating] = useState(false);

  const { data: allHandles } = useQuery({
    queryKey: ["plan_handles_all"],
    queryFn: async () => {
      const { data, error } = await supabase.from("plan_handles").select("plan_id, handles_per_cycle");
      if (error) throw error;
      return new Map((data ?? []).map((r: any) => [r.plan_id, r]));
    },
  });

  // Auto-select recommended plan
  useEffect(() => {
    if (!selectedPlanId && plans?.length) {
      const recommended = plans.reduce((best, p) => p.recommended_rank > best.recommended_rank ? p : best, plans[0]);
      onSelectPlan(recommended.id);
    }
  }, [plans, selectedPlanId, onSelectPlan]);

  const handleActivate = async () => {
    setActivating(true);
    try {
      await onActivate();
    } finally {
      setActivating(false);
    }
  };

  if (plansLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-h2">Choose Your Plan</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Your provider's service is included in all plans.
        </p>
      </div>

      {/* Plan Cards */}
      <div className="space-y-4">
        {plans?.map((plan) => {
          const tierKey = getTierKey(plan.name);
          const isRecommended = plans.length > 0 &&
            plan.recommended_rank === Math.max(...plans.map((p) => p.recommended_rank));
          const dbHandles = allHandles?.get(plan.id);

          return (
            <PlanCard
              key={plan.id}
              plan={plan}
              isRecommended={isRecommended}
              zoneEnabled
              handlesPerCycle={dbHandles?.handles_per_cycle}
              tierHighlights={TIER_HIGHLIGHTS[tierKey]}
              onBuildRoutine={() => onSelectPlan(plan.id)}
            />
          );
        })}
      </div>

      {/* CTA */}
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
