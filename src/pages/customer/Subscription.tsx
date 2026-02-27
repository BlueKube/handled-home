import { useNavigate } from "react-router-dom";
import { useCustomerSubscription } from "@/hooks/useSubscription";
import { usePlanDetail } from "@/hooks/usePlans";
import { SubscriptionStatusPanel } from "@/components/plans/SubscriptionStatusPanel";
import { FixPaymentPanel } from "@/components/plans/FixPaymentPanel";
import { PlanChangePanel } from "@/components/plans/PlanChangePanel";
import { PausePanel } from "@/components/plans/PausePanel";
import { CancellationFlow } from "@/components/plans/CancellationFlow";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function CustomerSubscription() {
  const navigate = useNavigate();
  const { data: subscription, isLoading } = useCustomerSubscription();
  const { data: plan } = usePlanDetail(subscription?.plan_id ?? null);

  if (isLoading) {
    return <div className="p-4 space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-48 w-full" /></div>;
  }

  if (!subscription) {
    return (
      <div className="p-4 pb-24 space-y-6 animate-fade-in max-w-lg mx-auto text-center">
        <h1 className="text-h2">No Active Subscription</h1>
        <p className="text-muted-foreground">You don't have a subscription yet.</p>
        <Button onClick={() => navigate("/customer/plans")}>Browse Plans</Button>
      </div>
    );
  }

  const isPaused = (subscription as any).paused_at != null;

  return (
    <div className="p-4 pb-24 space-y-6 animate-fade-in max-w-lg mx-auto">
      <h1 className="text-h2">Subscription</h1>

      {subscription.status === "past_due" && (
        <FixPaymentPanel subscriptionId={subscription.id} />
      )}

      <SubscriptionStatusPanel subscription={subscription} plan={plan} />

      {/* Pause state */}
      <PausePanel subscription={subscription} />

      {/* Plan change — hide if paused or canceling */}
      {!isPaused && !subscription.cancel_at_period_end && (
        <PlanChangePanel subscription={subscription} />
      )}

      {/* Cancel */}
      {!isPaused && (
        <CancellationFlow subscription={subscription} />
      )}
    </div>
  );
}
