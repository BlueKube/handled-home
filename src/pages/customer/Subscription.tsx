import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCustomerSubscription, useCancelSubscription, useChangePlan } from "@/hooks/useSubscription";
import { usePlanDetail, usePlans } from "@/hooks/usePlans";
import { SubscriptionStatusPanel } from "@/components/plans/SubscriptionStatusPanel";
import { FixPaymentPanel } from "@/components/plans/FixPaymentPanel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export default function CustomerSubscription() {
  const navigate = useNavigate();
  const { data: subscription, isLoading } = useCustomerSubscription();
  const { data: plan } = usePlanDetail(subscription?.plan_id ?? null);
  const { data: allPlans } = usePlans("active");
  const cancelSub = useCancelSubscription();
  const changePlan = useChangePlan();
  const [changePlanId, setChangePlanId] = useState("");

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

  const handleCancel = async () => {
    try {
      await cancelSub.mutateAsync(subscription.id);
      toast.success("Subscription will cancel at the end of the billing period.");
    } catch {
      toast.error("Could not cancel subscription.");
    }
  };

  return (
    <div className="p-4 pb-24 space-y-6 animate-fade-in max-w-lg mx-auto">
      <h1 className="text-h2">Subscription</h1>

      {subscription.status === "past_due" && (
        <FixPaymentPanel subscriptionId={subscription.id} />
      )}

      <SubscriptionStatusPanel subscription={subscription} plan={plan} />

      {/* Change Plan */}
      {!subscription.cancel_at_period_end && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Change Plan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">Changes take effect at the start of your next billing cycle (every 4 weeks).</p>
            <Select value={changePlanId} onValueChange={setChangePlanId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a new plan" />
              </SelectTrigger>
              <SelectContent>
                {allPlans?.filter((p) => p.id !== subscription.plan_id).map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name} — {p.display_price_text ?? ""}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {changePlanId && (
              <Button size="sm" disabled={changePlan.isPending} onClick={async () => {
                try {
                  await changePlan.mutateAsync({ subscriptionId: subscription.id, newPlanId: changePlanId, billingCycleEndAt: subscription.billing_cycle_end_at });
                  toast.success("Plan change scheduled for next billing cycle.");
                  setChangePlanId("");
                } catch {
                  toast.error("Could not schedule plan change.");
                }
              }}>
                {changePlan.isPending ? "Saving…" : "Confirm Change"}
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Cancel */}
      {!subscription.cancel_at_period_end && subscription.status !== "canceled" && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" className="w-full text-destructive border-destructive/30 hover:bg-destructive/5">
              Cancel Subscription
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Cancel your subscription?</AlertDialogTitle>
              <AlertDialogDescription>
                Your subscription will remain active until the end of your current billing period. You can resubscribe anytime.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
              <AlertDialogAction onClick={handleCancel} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Yes, Cancel
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
