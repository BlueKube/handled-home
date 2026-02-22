import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/StatusBadge";
import { format } from "date-fns";
import type { Subscription } from "@/hooks/useSubscription";
import type { Plan } from "@/hooks/usePlans";

interface SubscriptionStatusPanelProps {
  subscription: Subscription;
  plan?: Plan | null;
}

export function SubscriptionStatusPanel({ subscription, plan }: SubscriptionStatusPanelProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Current Plan</CardTitle>
          <StatusBadge status={subscription.status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-xl font-bold">{plan?.name ?? "—"}</p>
        {plan?.tagline && <p className="text-sm text-muted-foreground">{plan.tagline}</p>}
        {subscription.current_period_end && (
          <p className="text-sm text-muted-foreground">
            {subscription.cancel_at_period_end ? "Ends" : "Renews"}{" "}
            {format(new Date(subscription.current_period_end), "MMM d, yyyy")}
          </p>
        )}
        {subscription.cancel_at_period_end && (
          <Badge variant="destructive" className="text-xs">Canceling at period end</Badge>
        )}
        {subscription.pending_plan_id && (
          <Badge variant="secondary" className="text-xs">Plan change pending</Badge>
        )}
      </CardContent>
    </Card>
  );
}
