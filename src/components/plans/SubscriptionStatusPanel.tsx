import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/StatusBadge";
import { format } from "date-fns";
import { formatDateRange } from "@/lib/billing";
import type { Subscription } from "@/hooks/useSubscription";
import type { Plan } from "@/hooks/usePlans";

interface SubscriptionStatusPanelProps {
  subscription: Subscription;
  plan?: Plan | null;
}

export function SubscriptionStatusPanel({ subscription, plan }: SubscriptionStatusPanelProps) {
  const billingStart = subscription.billing_cycle_start_at ? new Date(subscription.billing_cycle_start_at) : null;
  const billingEnd = subscription.billing_cycle_end_at ? new Date(subscription.billing_cycle_end_at) : null;
  const nextBilling = subscription.next_billing_at ? new Date(subscription.next_billing_at) : null;
  const swStart = subscription.current_service_week_start_at ? new Date(subscription.current_service_week_start_at) : null;
  const swEnd = subscription.current_service_week_end_at ? new Date(subscription.current_service_week_end_at) : null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Current Plan</CardTitle>
          <StatusBadge status={subscription.status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xl font-bold">{plan?.name ?? "—"}</p>
        {plan?.tagline && <p className="text-sm text-muted-foreground">{plan.tagline}</p>}

        {/* Billing cycle info */}
        {billingStart && billingEnd && (
          <div className="text-sm space-y-1">
            <p className="text-muted-foreground">
              Billing cycle: {formatDateRange(billingStart, billingEnd)}
            </p>
            {nextBilling && (
              <p className="text-muted-foreground">
                {subscription.cancel_at_period_end ? "Ends" : "Next billing"}: {format(nextBilling, "MMM d, yyyy")}
              </p>
            )}
            <p className="text-xs text-muted-foreground">Billed every 4 weeks</p>
          </div>
        )}

        {/* Fallback to old period_end if no billing cycle fields */}
        {!billingStart && subscription.current_period_end && (
          <p className="text-sm text-muted-foreground">
            {subscription.cancel_at_period_end ? "Ends" : "Renews"}{" "}
            {format(new Date(subscription.current_period_end), "MMM d, yyyy")}
          </p>
        )}

        {/* Service week info */}
        {swStart && swEnd && (
          <div className="text-sm">
            <p className="text-muted-foreground">
              Current service week: {formatDateRange(swStart, swEnd)}
            </p>
          </div>
        )}

        {subscription.cancel_at_period_end && (
          <Badge variant="destructive" className="text-xs">Canceling at period end</Badge>
        )}
        {subscription.pending_plan_id && (
          <Badge variant="secondary" className="text-xs">
            Plan change pending
            {subscription.pending_effective_at && (
              <> · effective {format(new Date(subscription.pending_effective_at), "MMM d")}</>
            )}
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}
