import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProperty } from "@/hooks/useProperty";
import { useCustomerSubscription } from "@/hooks/useSubscription";
import { useEntitlements } from "@/hooks/useEntitlements";
import { useRoutine, useCreateRoutine } from "@/hooks/useRoutine";
import { useAddRoutineItem, useRemoveRoutineItem, useUpdateRoutineItemCadence } from "@/hooks/useRoutineActions";
import { useRoutinePreview, computeCycleDemand } from "@/hooks/useRoutinePreview";
import { useServiceDayAssignment } from "@/hooks/useServiceDayAssignment";
import { TruthBanner } from "@/components/routine/TruthBanner";
import { WeekPreviewTimeline } from "@/components/routine/WeekPreviewTimeline";
import { AddServicesSheet } from "@/components/routine/AddServicesSheet";
import { RoutineItemCard } from "@/components/routine/RoutineItemCard";
import { EntitlementGuardrails } from "@/components/routine/EntitlementGuardrails";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { CadenceType } from "@/hooks/useRoutine";

const MODEL_LABELS: Record<string, string> = {
  credits_per_cycle: "credits",
  count_per_cycle: "services",
  minutes_per_cycle: "minutes",
};

export default function CustomerRoutine() {
  const navigate = useNavigate();
  const { property, isLoading: propLoading } = useProperty();
  const { data: subscription, isLoading: subLoading } = useCustomerSubscription();
  const { assignment } = useServiceDayAssignment(property?.id);

  const planId = subscription?.plan_id ?? null;
  const zoneId = subscription?.zone_id ?? null;
  const { data: entitlements, isLoading: entLoading } = useEntitlements(planId, zoneId);
  const { data: routineData, isLoading: routineLoading } = useRoutine(property?.id, planId);
  const createRoutine = useCreateRoutine();
  const addItem = useAddRoutineItem();
  const removeItem = useRemoveRoutineItem();
  const updateCadence = useUpdateRoutineItemCadence();

  const items = routineData?.items ?? [];
  const weeks = useRoutinePreview(items);

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

  // Auto-create routine if none exists
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

  const handleAddItem = async (skuId: string) => {
    if (!routineData?.version?.id) return;
    try {
      await addItem.mutateAsync({ versionId: routineData.version.id, skuId });
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

  const handleAutoFit = () => {
    // Auto-fit: reduce cadences starting from the least frequent items
    // Simple heuristic: change weekly → biweekly → four_week until under limit
    toast.info("Auto-fit coming soon — adjust cadences manually for now");
  };

  const isLoading = propLoading || subLoading || entLoading || routineLoading || autoCreating;

  // Gate: need property + subscription
  if (!isLoading && !subscription) {
    return (
      <div className="p-6 text-center space-y-4 animate-fade-in">
        <h2 className="text-h2">Choose a plan first</h2>
        <p className="text-sm text-muted-foreground">You need an active subscription to build your routine.</p>
        <Button onClick={() => navigate("/customer/plans")}>View Plans</Button>
      </div>
    );
  }

  // Gate: need confirmed service day
  if (!isLoading && assignment?.status !== "confirmed" && subscription) {
    return (
      <div className="p-6 text-center space-y-4 animate-fade-in">
        <h2 className="text-h2">Confirm your Service Day</h2>
        <p className="text-sm text-muted-foreground">Lock in your weekly service day before building your routine.</p>
        <Button onClick={() => navigate("/customer/service-day")}>Set Service Day</Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  const existingSkuIds = new Set(items.map((i) => i.sku_id));
  const planName = subscription?.plan_id ? "Your Plan" : "—";

  return (
    <div className="pb-32 animate-fade-in">
      <TruthBanner
        planName={planName}
        serviceWeeks={entitlements?.service_weeks.included_per_billing_cycle ?? 4}
        serviceDay={assignment?.day_of_week ?? null}
        billingCycleLabel="28 days"
        modelLabel={modelLabel}
        included={included}
      />

      <div className="p-4 space-y-5">
        <div>
          <h1 className="text-h2 mb-1">Build Your Routine</h1>
          <p className="text-caption">Choose services and how often they happen.</p>
        </div>

        <EntitlementGuardrails
          cycleDemand={cycleDemand}
          included={included}
          maxExtras={maxExtras}
          modelLabel={modelLabel}
          onAutoFit={handleAutoFit}
        />

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
                allowIndependent={item.fulfillment_mode === "independent_cadence"}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-10 space-y-3">
            <Sparkles className="h-8 w-8 mx-auto text-accent" />
            <p className="text-sm text-muted-foreground">No services yet. Tap below to add your first.</p>
          </div>
        )}

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
        </div>
      </div>

      {/* Bottom CTA */}
      {items.length > 0 && (
        <div className="fixed bottom-16 left-0 right-0 z-40 p-4 bg-card/95 backdrop-blur border-t border-border max-w-lg mx-auto">
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
        </div>
      )}
    </div>
  );
}
