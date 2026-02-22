import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";

interface CustomerPropertyGateProps {
  children: ReactNode;
}

export function CustomerPropertyGate({ children }: CustomerPropertyGateProps) {
  const { user } = useAuth();
  const location = useLocation();

  const { data: hasProperty, isLoading } = useQuery({
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

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!hasProperty) {
    return <Navigate to={`/customer/property?gated=1`} replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}
