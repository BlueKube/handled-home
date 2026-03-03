import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProperty } from "@/hooks/useProperty";
import { useCustomerSubscription } from "@/hooks/useSubscription";
import { useRoutine } from "@/hooks/useRoutine";
import { useConfirmRoutine } from "@/hooks/useRoutineActions";
import { useZoneCategoryGating } from "@/hooks/useZoneCategoryGating";
import { CategoryWaitlistSheet } from "@/components/customer/CategoryWaitlistSheet";
import { RoutineSuccessScreen } from "@/components/routine/RoutineSuccessScreen";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Lock, CalendarDays, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { getCategoryLabel } from "@/lib/serviceCategories";
import { emitStateAnalyticsEvent } from "@/lib/analyticsEvents";
import { useAuth } from "@/contexts/AuthContext";

/** Resolve sku_id → category for a set of sku IDs */
function useSkuCategories(skuIds: string[]) {
  return useQuery({
    queryKey: ["sku_categories", skuIds],
    enabled: skuIds.length > 0,
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_skus")
        .select("id, category")
        .in("id", skuIds);
      if (error) throw error;
      return new Map((data ?? []).map((r) => [r.id, r.category as string | null]));
    },
  });
}

export default function RoutineConfirm() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { property } = useProperty();
  const { data: subscription, isLoading: subLoading } = useCustomerSubscription();
  const { data: routineData, isLoading: routineLoading } = useRoutine(property?.id, subscription?.plan_id);
  const confirmRoutine = useConfirmRoutine();
  const { isPurchasable, getRawState, hasGatingData, isLoading: gatingLoading } = useZoneCategoryGating();
  const [confirmed, setConfirmed] = useState(false);
  const [effectiveAt, setEffectiveAt] = useState<string | null>(null);
  const [waitlistCategory, setWaitlistCategory] = useState<{ category: string; rawState: string } | null>(null);
  const emittedBlockRef = useRef(false);

  const skuIds = routineData?.items.map((i) => i.sku_id) ?? [];
  const { data: skuCategoryMap } = useSkuCategories(skuIds);

  const isLoading = subLoading || routineLoading || gatingLoading;

  // Eligibility check: find categories that are NOT purchasable
  const blockedCategories = !isLoading && hasGatingData && routineData && skuCategoryMap
    ? [...new Set(routineData.items.map((i) => skuCategoryMap.get(i.sku_id) ?? null).filter((c): c is string => !!c && !isPurchasable(c)))]
    : [];
  const hasBlockedCategories = blockedCategories.length > 0;

  // Emit analytics once when blocked categories detected
  useEffect(() => {
    if (hasBlockedCategories && user && !emittedBlockRef.current) {
      emittedBlockRef.current = true;
      blockedCategories.forEach((cat) => {
        emitStateAnalyticsEvent({ eventType: "subscribe_blocked_by_state", actorId: user.id, actorRole: "customer", category: cat, sourceSurface: "routine_confirm" });
      });
    }
  }, [hasBlockedCategories, user, blockedCategories]);

  // Gate: need active subscription
  if (!isLoading && !subscription) {
    navigate("/customer/plans?gated=1", { replace: true });
    return null;
  }

  // Gate: need routine with items
  if (!isLoading && (!routineData || routineData.items.length === 0)) {
    navigate("/customer/routine", { replace: true });
    return null;
  }

  if (confirmed) {
    return <RoutineSuccessScreen effectiveAt={effectiveAt} />;
  }

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }
  // Compute effective date = T0+7 (first DRAFT day)
  const effectiveDateObj = new Date();
  effectiveDateObj.setDate(effectiveDateObj.getDate() + 7);
  const effectiveDateFormatted = effectiveDateObj.toLocaleDateString("en-US", { month: "long", day: "numeric" });



  const handleConfirm = async () => {
    if (!routineData?.routine.id) return;
    try {
      const result = await confirmRoutine.mutateAsync(routineData.routine.id);
      setEffectiveAt(result.effective_at);
      setConfirmed(true);
      toast.success("Routine confirmed!");
    } catch (err: any) {
      toast.error(err.message ?? "Couldn't confirm routine");
    }
  };

  return (
    <div className="pb-24 animate-fade-in max-w-lg mx-auto">
      <div className="p-4 space-y-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        <div className="text-center space-y-2">
          <Lock className="h-8 w-8 mx-auto text-accent" />
          <h1 className="text-h2">Lock in Your Routine</h1>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
            Changes take effect on <span className="font-semibold text-foreground">{effectiveDateFormatted}</span>.
            Your next 7 days are already scheduled and won't change.
          </p>
        </div>

        {/* Effective date badge */}
        <div className="flex items-center justify-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-accent/10 px-4 py-2 text-sm font-medium text-accent">
            <CalendarDays className="h-4 w-4" />
            Effective {effectiveDateFormatted}
          </div>
        </div>

        {/* Summary */}
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Services</span>
            <span className="text-sm font-medium">{routineData?.items.length ?? 0}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Effective</span>
            <span className="text-sm font-medium flex items-center gap-1">
              <CalendarDays className="h-3.5 w-3.5" />
              {effectiveDateFormatted}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Version</span>
            <span className="text-sm font-medium">v{routineData?.version.version_number ?? 1}</span>
          </div>
        </div>

        {/* Blocked categories warning */}
        {hasBlockedCategories && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <p className="font-medium mb-1">Some services aren't available yet</p>
              <p className="text-sm">
                {blockedCategories.map((c) => getCategoryLabel(c)).join(", ")}{" "}
                {blockedCategories.length === 1 ? "isn't" : "aren't"} available in your area yet.
                Remove {blockedCategories.length === 1 ? "it" : "them"} from your routine or join the waitlist.
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                {blockedCategories.map((cat) => (
                  <Button
                    key={cat}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => setWaitlistCategory({ category: cat, rawState: getRawState(cat) ?? "WAITLIST_ONLY" })}
                  >
                    Join {getCategoryLabel(cat)} Waitlist
                  </Button>
                ))}
              </div>
            </AlertDescription>
          </Alert>
        )}

        <Button
          className="w-full gap-2"
          size="lg"
          onClick={handleConfirm}
          disabled={confirmRoutine.isPending || hasBlockedCategories}
        >
          {confirmRoutine.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Lock className="h-4 w-4" />
          )}
          Confirm & Lock Routine
        </Button>
      </div>

      {/* Waitlist sheet */}
      {waitlistCategory && (
        <CategoryWaitlistSheet
          open={!!waitlistCategory}
          onOpenChange={(v) => { if (!v) setWaitlistCategory(null); }}
          category={waitlistCategory.category}
          rawState={waitlistCategory.rawState}
        />
      )}
    </div>
  );
}
