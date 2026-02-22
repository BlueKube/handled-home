import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useProviderAdmin() {
  const queryClient = useQueryClient();

  const orgsQuery = useQuery({
    queryKey: ["admin_provider_orgs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("provider_orgs")
        .select("*, provider_coverage(zone_id, request_status, zones(name)), provider_risk_flags(id, flag_type, severity, is_active)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const orgDetailQuery = (orgId?: string) => useQuery({
    queryKey: ["admin_provider_org_detail", orgId],
    queryFn: async () => {
      if (!orgId) return null;
      const { data, error } = await supabase
        .from("provider_orgs")
        .select(`
          *,
          provider_members(*),
          provider_coverage(*, zones(name, zip_codes)),
          provider_capabilities(*, service_skus(name, category)),
          provider_compliance(*),
          provider_risk_flags(*),
          provider_enforcement_actions(*)
        `)
        .eq("id", orgId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
  });

  const performAction = useMutation({
    mutationFn: async (params: { orgId: string; action: string; reason?: string; metadata?: any }) => {
      const { data, error } = await supabase.rpc("admin_provider_action", {
        p_org_id: params.orgId,
        p_action: params.action,
        p_reason: params.reason || null,
        p_metadata: params.metadata || null,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_provider_orgs"] });
      queryClient.invalidateQueries({ queryKey: ["admin_provider_org_detail"] });
    },
  });

  // A1: Use RPC for audit-logged coverage status updates
  const updateCoverageStatus = useMutation({
    mutationFn: async (params: { coverageId: string; status: string; reason?: string }) => {
      const { data, error } = await supabase.rpc("admin_update_coverage_status", {
        p_coverage_id: params.coverageId,
        p_new_status: params.status,
        p_reason: params.reason || null,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_provider_org_detail"] });
      queryClient.invalidateQueries({ queryKey: ["admin_provider_orgs"] });
    },
  });

  return { orgs: orgsQuery.data ?? [], loading: orgsQuery.isLoading, orgDetailQuery, performAction, updateCoverageStatus };
}

export function useAdminInvites() {
  const queryClient = useQueryClient();

  const invitesQuery = useQuery({
    queryKey: ["admin_provider_invites"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("provider_invites")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const createInvite = useMutation({
    mutationFn: async (params: { code: string; allowedZoneIds: string[]; maxUses?: number; expiresAt?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("provider_invites")
        .insert({
          code: params.code,
          allowed_zone_ids: params.allowedZoneIds,
          max_uses: params.maxUses || null,
          expires_at: params.expiresAt || null,
          created_by_admin_user_id: user.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin_provider_invites"] }),
  });

  const toggleInvite = useMutation({
    mutationFn: async (params: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from("provider_invites")
        .update({ is_active: params.isActive })
        .eq("id", params.id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin_provider_invites"] }),
  });

  return { invites: invitesQuery.data ?? [], loading: invitesQuery.isLoading, createInvite, toggleInvite };
}
