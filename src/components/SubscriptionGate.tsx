import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useCustomerSubscription } from "@/hooks/useSubscription";
import { Skeleton } from "@/components/ui/skeleton";

interface SubscriptionGateProps {
  children: ReactNode;
}

export function SubscriptionGate({ children }: SubscriptionGateProps) {
  const { data: subscription, isLoading } = useCustomerSubscription();

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  const activeStatuses = ["active", "trialing", "past_due"];
  if (!subscription || !activeStatuses.includes(subscription.status)) {
    return <Navigate to="/customer/plans?gated=1" replace />;
  }

  return <>{children}</>;
}
