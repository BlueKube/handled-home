import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type AdminRole = "superuser" | "ops" | "dispatcher" | "growth_manager";

export interface AdminMembership {
  user_id: string;
  admin_role: AdminRole;
  is_active: boolean;
}

export function useAdminMembership() {
  const { user, activeRole } = useAuth();
  const isAdmin = activeRole === "admin";

  const query = useQuery<AdminMembership | null>({
    queryKey: ["admin-membership", user?.id],
    enabled: !!user && isAdmin,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_memberships")
        .select("user_id, admin_role, is_active")
        .eq("user_id", user!.id)
        .eq("is_active", true)
        .maybeSingle();
      if (error) throw error;
      return data as AdminMembership | null;
    },
  });

  const membership = query.data ?? null;
  const adminRole = membership?.admin_role ?? null;

  return {
    membership,
    adminRole,
    isSuperuser: adminRole === "superuser",
    isOps: adminRole === "ops" || adminRole === "superuser",
    isDispatcher: adminRole === "dispatcher",
    isGrowthManager: adminRole === "growth_manager",
    /** True if user has any active admin membership */
    hasMembership: !!membership,
    isLoading: query.isLoading,
    /** Check if user has at least one of the given roles */
    hasAnyRole: (...roles: AdminRole[]) => adminRole ? roles.includes(adminRole) : false,
  };
}
