import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProperty } from "@/hooks/useProperty";
import { useCustomerSubscription } from "@/hooks/useSubscription";
import { useRoutine } from "@/hooks/useRoutine";
import { useConfirmRoutine } from "@/hooks/useRoutineActions";
import { RoutineSuccessScreen } from "@/components/routine/RoutineSuccessScreen";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Lock, CalendarDays, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function RoutineConfirm() {
  const navigate = useNavigate();
  const { property } = useProperty();
  const { data: subscription, isLoading: subLoading } = useCustomerSubscription();
  const { data: routineData, isLoading: routineLoading } = useRoutine(property?.id, subscription?.plan_id);
  const confirmRoutine = useConfirmRoutine();
  const [confirmed, setConfirmed] = useState(false);
  const [effectiveAt, setEffectiveAt] = useState<string | null>(null);

  const isLoading = subLoading || routineLoading;

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

  const effectiveDateLabel = subscription?.billing_cycle_end_at
    ? new Date(subscription.billing_cycle_end_at).toLocaleDateString("en-US", { month: "long", day: "numeric" })
    : "your next billing cycle";

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
            Once confirmed, your routine takes effect {effectiveDateLabel}.
            You can update it before your next billing cycle.
          </p>
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
              {effectiveDateLabel}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Version</span>
            <span className="text-sm font-medium">v{routineData?.version.version_number ?? 1}</span>
          </div>
        </div>

        <Button
          className="w-full gap-2"
          size="lg"
          onClick={handleConfirm}
          disabled={confirmRoutine.isPending}
        >
          {confirmRoutine.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Lock className="h-4 w-4" />
          )}
          Confirm & Lock Routine
        </Button>
      </div>
    </div>
  );
}
