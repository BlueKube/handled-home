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
import { Shield, AlertTriangle } from "lucide-react";
import { CustomerEmptyState } from "@/components/customer/CustomerEmptyState";
import { HelpTip } from "@/components/ui/help-tip";

export default function CustomerSubscription() {
  const navigate = useNavigate();
  const { data: subscription, isLoading, isError } = useCustomerSubscription();
  const { data: plan } = usePlanDetail(subscription?.plan_id ?? null);

  if (isLoading) {
    return <div className="p-4 space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-48 w-full" /></div>;
  }

  if (isError) {
    return (
      <div className="p-4 space-y-3 animate-fade-in">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          <h1 className="text-h2">Subscription</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          We couldn't load your subscription. Check your connection and try again.
        </p>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="p-4 pb-24 space-y-6 animate-fade-in">
        <h1 className="text-h2">Subscription <HelpTip text="Your subscription controls your plan tier, billing cycle, and service schedule. Changes take effect at the start of your next cycle." /></h1>
        <CustomerEmptyState
          icon={Shield}
          title="No active membership"
          body="Pick a plan to start your recurring home maintenance. One simple membership — we handle the rest."
          ctaLabel="Browse plans"
          ctaAction={() => navigate("/customer/plans")}
        />
      </div>
    );
  }

  const isPaused = subscription.paused_at != null;

  return (
    <div className="p-4 pb-24 space-y-6 animate-fade-in">
      <h1 className="text-h2">Subscription <HelpTip text="Your subscription controls your plan tier, billing cycle, and service schedule. Changes take effect at the start of your next cycle." /></h1>

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
