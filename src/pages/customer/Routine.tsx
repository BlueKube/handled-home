import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProperty } from "@/hooks/useProperty";
import { useCustomerSubscription } from "@/hooks/useSubscription";
import { useEntitlements, MODEL_LABELS } from "@/hooks/useEntitlements";
import { useRoutine, useCreateRoutine } from "@/hooks/useRoutine";
import { useAddRoutineItem, useRemoveRoutineItem, useUpdateRoutineItemCadence, useUpdateRoutineItemLevel, computeAutoFit, useAutoFitRoutine } from "@/hooks/useRoutineActions";
import { useRoutinePreview, computeCycleDemand } from "@/hooks/useRoutinePreview";
import { useServiceDayAssignment } from "@/hooks/useServiceDayAssignment";
import { useBiweeklyOptimizer } from "@/hooks/useBiweeklyOptimizer";
import { useSkus } from "@/hooks/useSkus";
import { TruthBanner } from "@/components/routine/TruthBanner";
import { WeekPreviewTimeline } from "@/components/routine/WeekPreviewTimeline";
import { AddServicesSheet } from "@/components/routine/AddServicesSheet";
import { PopularServicesPreview } from "@/components/routine/PopularServicesPreview";
import { RoutineItemCard } from "@/components/routine/RoutineItemCard";
import { EntitlementGuardrails } from "@/components/routine/EntitlementGuardrails";
import { SeasonalBoostsSection } from "@/components/routine/SeasonalBoostsSection";
import { RoutineSuggestion } from "@/components/customer/RoutineSuggestion";
import { QueryErrorCard } from "@/components/QueryErrorCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { HelpTip } from "@/components/ui/help-tip";
import type { CadenceType } from "@/hooks/useRoutine";

export default function CustomerRoutine() {
  const navigate = useNavigate();
  const { property, isLoading: propLoading } = useProperty();
  const { data: subscription, isLoading: subLoading } = useCustomerSubscription();
  const { assignment } = useServiceDayAssignment(property?.id);

  const hasSub = !!subscription;
  const planId = subscription?.plan_id ?? null;
  const zoneId = subscription?.zone_id ?? null;
  const { data: entitlements, isLoading: entLoading } = useEntitlements(planId, zoneId);
  const { data: browsableSkus } = useSkus({ status: "active" });
  const { data: routineData, isLoading: routineLoading, isError: routineError, refetch: refetchRoutine } = useRoutine(property?.id, planId);
  const createRoutine = useCreateRoutine();
  const addItem = useAddRoutineItem();
  const removeItem = useRemoveRoutineItem();
  const updateCadence = useUpdateRoutineItemCadence();
  const autoFitMutation = useAutoFitRoutine();
  const updateLevel = useUpdateRoutineItemLevel();
  const { data: biweeklyRec } = useBiweeklyOptimizer(zoneId);

  const items = routineData?.items ?? [];
  const weeks = useRoutinePreview(items);
  const servicesPreviewRef = useRef<HTMLDivElement>(null);

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
  const isOverLimit = cycleDemand > included + maxExtras;

  // Auto-create routine if none exists (only when subscribed)
  const [autoCreating, setAutoCreating] = useState(false);
  useEffect(() => {
    if (property?.id && planId && !routineData && !routineLoading && !autoCreating) {
      setAutoCreating(true);
      createRoutine.mutateAsync({
        propertyId: property.id,
        planId,
        zoneId,
        entitlementVersionId: subscription?.entitlement_version_id,
      }).finally(() => setAutoCreating(false));
    }
  }, [property?.id, planId, routineData, routineLoading, autoCreating]);

  const handleAddItem = async (skuId: string, levelId?: string | null) => {
    if (!routineData?.version?.id) return;
    try {
      await addItem.mutateAsync({ versionId: routineData.version.id, skuId, levelId });
      toast.success("Service added");
    } catch {
      toast.error("Couldn't add service");
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    try {
      await removeItem.mutateAsync(itemId);
      toast.success("Service removed");
    } catch {
      toast.error("Couldn't remove service");
    }
  };

  const handleCadenceChange = async (itemId: string, cadence: CadenceType, detail?: Record<string, any>) => {
    try {
      await updateCadence.mutateAsync({ itemId, cadenceType: cadence, cadenceDetail: detail });
    } catch {
      toast.error("Couldn't update cadence");
    }
  };

  const handleLevelChange = async (itemId: string, levelId: string) => {
    try {
      await updateLevel.mutateAsync({ itemId, levelId });
    } catch {
      toast.error("Couldn't update level");
    }
  };

  // M4: Real auto-fit implementation
  const handleAutoFit = async () => {
    const limit = included + maxExtras;
    const result = computeAutoFit(items, limit);
    if (!result || result.changes.length === 0) {
      toast.info("Routine already fits your plan");
      return;
    }
    try {
      await autoFitMutation.mutateAsync(result.changes);
      const summary = result.changes.map((c) => `${c.skuName}: ${c.from} → ${c.to}`).join(", ");
      toast.success(`Auto-fit applied: ${summary}`);
    } catch {
      toast.error("Couldn't auto-fit routine");
    }
  };

  const isLoading = propLoading || subLoading || (hasSub && (entLoading || routineLoading)) || autoCreating;

  // H3: Service day gate only when subscribed
  if (!isLoading && hasSub && assignment?.status !== "confirmed") {
    return (
      <div className="p-4 pb-24 text-center space-y-4 animate-fade-in">
        <h2 className="text-h2">Confirm your Service Day</h2>
        <p className="text-caption">Lock in your weekly service day before building your routine.</p>
        <Button onClick={() => navigate("/customer/service-day")}>Set Service Day</Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-4 pb-24 space-y-4 animate-fade-in">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (routineError) {
    return (
      <div className="p-4 pb-24 animate-fade-in">
        <QueryErrorCard message="Couldn't load your routine" onRetry={refetchRoutine} />
      </div>
    );
  }

  const existingSkuIds = new Set(items.map((i) => i.sku_id));
  const planName = "Your Plan";

  return (
    <div className="pb-24 animate-fade-in">
      {hasSub && (
        <TruthBanner
          planName={planName}
          serviceWeeks={entitlements?.service_weeks.included_per_billing_cycle ?? 4}
          serviceDay={assignment?.day_of_week ?? null}
          billingCycleLabel="28 days"
          modelLabel={modelLabel}
          included={included}
        />
      )}

      <div className="p-4 space-y-5">
        <div>
          <h1 className="text-h2 mb-1">Build Your Routine <HelpTip text="How it works — add services, set frequency, and we'll build your schedule. Changes take effect next cycle." /></h1>
          <p className="text-caption">Choose services and how often they happen.</p>
        </div>

        {hasSub && (
          <EntitlementGuardrails
            cycleDemand={cycleDemand}
            included={included}
            maxExtras={maxExtras}
            modelLabel={modelLabel}
            onAutoFit={handleAutoFit}
            isAutoFitting={autoFitMutation.isPending}
          />
        )}

        {/* Routine Items */}
        {items.length > 0 ? (
          <div className="space-y-2">
            <h3 className="text-caption uppercase tracking-wider">Your Services</h3>
            {items.map((item) => (
              <RoutineItemCard
                key={item.id}
                item={item}
                onRemove={handleRemoveItem}
                onCadenceChange={handleCadenceChange}
                onLevelChange={handleLevelChange}
                allowIndependent={item.fulfillment_mode === "independent_cadence"}
                biweeklyRecommendation={biweeklyRec?.recommended}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center py-8 space-y-3">
            <Sparkles className="h-8 w-8 text-accent" />
            <p className="text-sm text-muted-foreground text-center">
              {hasSub ? "No services yet. Tap below to add your first." : "Browse available services — subscribe when you're ready."}
            </p>

            {/* Popular services preview for unsubscribed users */}
            {!hasSub && items.length === 0 && browsableSkus && browsableSkus.length > 0 && (
              <PopularServicesPreview ref={servicesPreviewRef} skus={browsableSkus} />
            )}
          </div>
        )}

        {/* Suggested Adjacent Service */}
        <RoutineSuggestion onAddToRoutine={handleAddItem} existingSkuIds={existingSkuIds} />

        {/* Seasonal Boosts */}
        <SeasonalBoostsSection propertyId={property?.id} zoneId={zoneId} />

        {/* 4-Week Preview */}
        {items.length > 0 && <WeekPreviewTimeline weeks={weeks} />}

        {/* Add Services Button */}
        <div className="flex justify-center">
          {entitlements && (
            <AddServicesSheet
              skus={entitlements.skus}
              existingSkuIds={existingSkuIds}
              onAdd={handleAddItem}
            />
          )}
          {/* Unsubscribed: scroll to service previews */}
          {!hasSub && !entitlements && (
            <Button className="gap-2" onClick={() => servicesPreviewRef.current?.scrollIntoView({ behavior: "smooth" })}>
              <Sparkles className="h-4 w-4" />
              Browse services
            </Button>
          )}
        </div>
      </div>

      {/* Bottom CTA */}
      {(items.length > 0 || !hasSub) && (
        <div className="fixed bottom-16 left-0 right-0 z-40 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] bg-card/95 backdrop-blur border-t border-border">
          {hasSub ? (
            <>
              <Button
                className="w-full gap-2"
                size="lg"
                disabled={isOverLimit}
                onClick={() => navigate("/customer/routine/review")}
              >
                Review Routine
                <ArrowRight className="h-4 w-4" />
              </Button>
              {isOverLimit && (
                <p className="text-xs text-destructive text-center mt-1">Reduce services to fit your plan first</p>
              )}
            </>
          ) : (
            <Button
              className="w-full gap-2"
              size="lg"
              onClick={() => servicesPreviewRef.current?.scrollIntoView({ behavior: "smooth" })}
            >
              <Sparkles className="h-4 w-4" />
              Browse services
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
