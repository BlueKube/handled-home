import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useProperty } from "@/hooks/useProperty";
import { useCustomerSubscription } from "@/hooks/useSubscription";
import { useEntitlements } from "@/hooks/useEntitlements";
import { useRoutine } from "@/hooks/useRoutine";
import { useRoutinePreview, computeCycleDemand } from "@/hooks/useRoutinePreview";
import { ReviewServiceCard } from "@/components/routine/ReviewServiceCard";
import { SeasonalYearStrip } from "@/components/routine/SeasonalYearStrip";
import { ProofCoach } from "@/components/routine/ProofCoach";
import { WeekPreviewTimeline } from "@/components/routine/WeekPreviewTimeline";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, ArrowRight, CheckCircle2, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const MODEL_LABELS: Record<string, string> = {
  credits_per_cycle: "credits",
  count_per_cycle: "services",
  minutes_per_cycle: "minutes",
};

export default function RoutineReview() {
  const navigate = useNavigate();
  const { property } = useProperty();
  const { data: subscription } = useCustomerSubscription();
  const planId = subscription?.plan_id ?? null;
  const zoneId = subscription?.zone_id ?? null;
  const { data: entitlements } = useEntitlements(planId, zoneId);
  const { data: routineData, isLoading } = useRoutine(property?.id, planId);
  const [acknowledged, setAcknowledged] = useState(false);

  const items = routineData?.items ?? [];
  const weeks = useRoutinePreview(items);

  // L11: Fetch inclusions/exclusions for all SKUs in the routine
  const skuIds = items.map((i) => i.sku_id);
  const { data: skuDetails } = useQuery({
    queryKey: ["sku-scope", skuIds],
    enabled: skuIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_skus")
        .select("id, inclusions, exclusions")
        .in("id", skuIds);
      if (error) throw error;
      const map = new Map<string, { inclusions: string[]; exclusions: string[] }>();
      for (const s of data ?? []) {
        map.set(s.id, { inclusions: s.inclusions ?? [], exclusions: s.exclusions ?? [] });
      }
      return map;
    },
  });

  const modelType = entitlements?.plan.model_type ?? "credits_per_cycle";
  const modelLabel = MODEL_LABELS[modelType] ?? "credits";
  const included = modelType === "credits_per_cycle"
    ? entitlements?.plan.included.credits ?? 0
    : modelType === "count_per_cycle"
    ? entitlements?.plan.included.count ?? 0
    : entitlements?.plan.included.minutes ?? 0;
  const maxExtras = entitlements?.plan.extras.allowed
    ? (modelType === "credits_per_cycle"
      ? entitlements?.plan.extras.max_credits ?? 0
      : modelType === "count_per_cycle"
      ? entitlements?.plan.extras.max_count ?? 0
      : entitlements?.plan.extras.max_minutes ?? 0)
    : 0;

  const cycleDemand = computeCycleDemand(items);
  const fits = cycleDemand <= included + maxExtras;

  // Redirect if no items
  if (!isLoading && items.length === 0) {
    navigate("/customer/routine", { replace: true });
    return null;
  }

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  // Build SKU status map from entitlements
  const skuStatusMap = new Map<string, string>();
  entitlements?.skus.forEach((s) => skuStatusMap.set(s.sku_id, s.status));

  return (
    <div className="pb-32 animate-fade-in max-w-lg mx-auto">
      <div className="p-4 space-y-5">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        <div>
          <h1 className="text-h2 mb-1">Review Your Routine</h1>
          <p className="text-caption">Check each service before confirming.</p>
        </div>

        {/* Fit indicator */}
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${fits ? "bg-success/10" : "bg-destructive/10"}`}>
          {fits ? (
            <>
              <CheckCircle2 className="h-4 w-4 text-success" />
              <span className="text-sm text-success">Fits your plan — {Math.ceil(cycleDemand)}/{included + maxExtras} {modelLabel}/cycle</span>
            </>
          ) : (
            <>
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <span className="text-sm text-destructive">Over limit — {Math.ceil(cycleDemand)}/{included + maxExtras} {modelLabel}/cycle</span>
            </>
          )}
        </div>

        {/* Service cards */}
        <div className="space-y-3">
          {items.map((item) => {
            const scope = skuDetails?.get(item.sku_id);
            return (
              <ReviewServiceCard
                key={item.id}
                item={item}
                entitlementStatus={skuStatusMap.get(item.sku_id)}
                inclusions={scope?.inclusions}
                exclusions={scope?.exclusions}
              />
            );
          })}
        </div>

        {/* 4-week preview */}
        <WeekPreviewTimeline weeks={weeks} />

        {/* Seasonal 12-month strip */}
        <SeasonalYearStrip propertyId={property?.id} zoneId={zoneId} />

        {/* Proof coach */}
        <ProofCoach />

        {/* L14: Acknowledgement checkbox */}
        <div className="flex items-start gap-3 pt-2">
          <Checkbox
            id="review-ack"
            checked={acknowledged}
            onCheckedChange={(checked) => setAcknowledged(checked === true)}
          />
          <label htmlFor="review-ack" className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
            I've reviewed the services and proof expectations above.
          </label>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="fixed bottom-16 left-0 right-0 z-40 p-4 bg-card/95 backdrop-blur border-t border-border max-w-lg mx-auto">
        <Button
          className="w-full gap-2"
          size="lg"
          disabled={!fits || !acknowledged}
          onClick={() => navigate("/customer/routine/confirm")}
        >
          Confirm Routine
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
