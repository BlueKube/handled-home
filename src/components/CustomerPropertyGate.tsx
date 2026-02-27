import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCustomerSubscription } from "@/hooks/useSubscription";
import { Skeleton } from "@/components/ui/skeleton";

interface CustomerPropertyGateProps {
  children: ReactNode;
}

export function CustomerPropertyGate({ children }: CustomerPropertyGateProps) {
  const { user } = useAuth();
  const location = useLocation();

  const { data: hasProperty, isLoading: propLoading } = useQuery({
    queryKey: ["hasProperty", user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { count, error } = await supabase
        .from("properties")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id);
      if (error) throw error;
      return (count ?? 0) > 0;
    },
    enabled: !!user,
  });

  const { data: subscription, isLoading: subLoading } = useCustomerSubscription();

  if (propLoading || subLoading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  // D1-F3 FIX: Only redirect truly new users (no property AND no subscription history).
  // Churned/expired customers who have a subscription record can still access their account.
  const hasAnySub = subscription != null;

  if (!hasProperty && !hasAnySub) {
    return <Navigate to="/customer/onboarding" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}
