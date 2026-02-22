import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { usePlans, usePlanDetail } from "@/hooks/usePlans";
import { useEntitlements } from "@/hooks/useEntitlements";
import { useDraftRoutine, useSaveDraftRoutine, DraftRoutineItem } from "@/hooks/useDraftRoutine";
import { useProperty } from "@/hooks/useProperty";
import { RoutineSummaryBar } from "@/components/plans/RoutineSummaryBar";
import { EntitlementBadge } from "@/components/plans/EntitlementBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Minus, ArrowLeft, ShoppingCart } from "lucide-react";
import { toast } from "sonner";

export default function CustomerRoutine() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialPlanId = searchParams.get("plan");
  const { property } = useProperty();

  const { data: plans } = usePlans("active");
  const [selectedPlanId, setSelectedPlanId] = useState<string>(initialPlanId ?? "");
  const { data: plan } = usePlanDetail(selectedPlanId || null);
  const { data: entitlements, isLoading: entLoading } = useEntitlements(selectedPlanId || null, null);
  const { data: draftSelection } = useDraftRoutine(property?.id);
  const saveDraft = useSaveDraftRoutine();

  const [routine, setRoutine] = useState<DraftRoutineItem[]>([]);

  // Init from draft or empty
  useEffect(() => {
    if (draftSelection && draftSelection.selected_plan_id === selectedPlanId) {
      setRoutine(draftSelection.draft_routine ?? []);
    }
  }, [draftSelection, selectedPlanId]);

  // Set initial plan from URL or first available
  useEffect(() => {
    if (!selectedPlanId && plans && plans.length > 0) {
      setSelectedPlanId(plans[0].id);
    }
  }, [plans, selectedPlanId]);

  const modelType = entitlements?.plan.model_type ?? "credits_per_cycle";
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

  const used = routine.reduce((sum, r) => sum + r.quantity, 0);
  const label = modelType === "credits_per_cycle" ? "credits" : modelType === "count_per_cycle" ? "services" : "minutes";

  const addToRoutine = (skuId: string, skuName: string) => {
    if (used >= included + maxExtras) {
      toast.error("You've reached the maximum for this plan");
      return;
    }
    setRoutine((prev) => {
      const existing = prev.find((r) => r.sku_id === skuId);
      if (existing) {
        return prev.map((r) => r.sku_id === skuId ? { ...r, quantity: r.quantity + 1 } : r);
      }
      return [...prev, { sku_id: skuId, sku_name: skuName, quantity: 1 }];
    });
  };

  const removeFromRoutine = (skuId: string) => {
    setRoutine((prev) => {
      const existing = prev.find((r) => r.sku_id === skuId);
      if (existing && existing.quantity > 1) {
        return prev.map((r) => r.sku_id === skuId ? { ...r, quantity: r.quantity - 1 } : r);
      }
      return prev.filter((r) => r.sku_id !== skuId);
    });
  };

  const handleSave = async () => {
    if (!selectedPlanId) return;
    try {
      await saveDraft.mutateAsync({
        planId: selectedPlanId,
        propertyId: property?.id,
        entitlementVersionId: entitlements?.plan.entitlement_version_id,
        routine,
      });
      toast.success("Routine saved!");
    } catch {
      toast.error("Could not save routine");
    }
  };

  return (
    <div className="pb-24 animate-fade-in max-w-lg mx-auto">
      <div className="p-4 space-y-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <h1 className="text-h2">Build Your Routine</h1>

        {plans && plans.length > 1 && (
          <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a plan" />
            </SelectTrigger>
            <SelectContent>
              {plans.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <RoutineSummaryBar used={used} included={included} extras={maxExtras} label={label} />

      <div className="p-4 space-y-3">
        {entLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
          </div>
        ) : (
          entitlements?.skus
            .filter((s) => s.status !== "blocked")
            .map((sku) => {
              const inRoutine = routine.find((r) => r.sku_id === sku.sku_id);
              return (
                <Card key={sku.sku_id} className="press-feedback">
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{sku.sku_name}</p>
                      <EntitlementBadge status={sku.status as any} />
                    </div>
                    <div className="flex items-center gap-2">
                      {inRoutine && (
                        <>
                          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => removeFromRoutine(sku.sku_id)}>
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="text-sm font-medium w-6 text-center">{inRoutine.quantity}</span>
                        </>
                      )}
                      <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => addToRoutine(sku.sku_id, sku.sku_name)}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
        )}
      </div>

      {routine.length > 0 && (
        <div className="fixed bottom-16 left-0 right-0 z-40 p-4 bg-card/95 backdrop-blur border-t border-border max-w-lg mx-auto">
          <div className="flex items-center gap-2 mb-2">
            <ShoppingCart className="h-4 w-4" />
            <span className="text-sm font-medium">{routine.length} service{routine.length !== 1 ? "s" : ""} selected</span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={handleSave} disabled={saveDraft.isPending}>
              Save Draft
            </Button>
            <Button className="flex-1" onClick={() => navigate(`/customer/subscribe?plan=${selectedPlanId}`)}>
              Activate Plan
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
