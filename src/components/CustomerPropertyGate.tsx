import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCustomerSubscription } from "@/hooks/useSubscription";
import { useHouseholdInvites } from "@/hooks/useHouseholdInvites";
import { Skeleton } from "@/components/ui/skeleton";

interface CustomerPropertyGateProps {
  children: ReactNode;
}

export function CustomerPropertyGate({ children }: CustomerPropertyGateProps) {
  const { user } = useAuth();
  const location = useLocation();

  // Auto-accept any pending household invites on load
  useHouseholdInvites();

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

  // Check if user is a household member of any property
  const { data: isHouseholdMember, isLoading: memberLoading, isError: memberError } = useQuery({
    queryKey: ["isHouseholdMember", user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { count, error } = await (supabase.from("household_members") as any)
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "active");
      if (error) throw error;
      return (count ?? 0) > 0;
    },
    enabled: !!user,
    retry: 1,
  });

  const { data: subscription, isLoading: subLoading } = useCustomerSubscription();

  if (propLoading || subLoading || memberLoading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  // If household membership check failed, allow access rather than wrongly redirecting to onboarding
  if (memberError) {
    return <>{children}</>;
  }

  // Only redirect truly new users — users with no property, no subscription, and no household membership.
  const hasAnySub = subscription != null;

  if (!hasProperty && !hasAnySub && !isHouseholdMember) {
    return <Navigate to="/customer/onboarding" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}
