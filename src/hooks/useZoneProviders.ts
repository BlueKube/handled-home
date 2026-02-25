import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ZoneCategoryProvider {
  id: string;
  zone_id: string;
  category: string;
  provider_org_id: string;
  role: "PRIMARY" | "BACKUP";
  priority_rank: number;
  status: "ACTIVE" | "SUSPENDED";
  assigned_at: string;
  performance_score: number | null;
  formula_version: string | null;
  computed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProviderProfile {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  provider_org_id?: string;
  org_name?: string;
}

/** Fetch zone_category_providers for a given zone */
export function useZoneCategoryProviders(zoneId: string | null) {
  return useQuery({
    queryKey: ["zone-category-providers", zoneId],
    enabled: !!zoneId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("zone_category_providers")
        .select("*")
        .eq("zone_id", zoneId!)
        .order("category")
        .order("role")
        .order("priority_rank");
      if (error) throw error;
      return data as ZoneCategoryProvider[];
    },
  });
}

/** List all providers with their org info */
export function useProvidersList() {
  return useQuery({
    queryKey: ["providers-list"],
    queryFn: async () => {
      const { data: roles, error: rolesErr } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "provider");
      if (rolesErr) throw rolesErr;
      if (!roles?.length) return [];

      const userIds = roles.map((r) => r.user_id);
      const { data: profiles, error: profErr } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .in("user_id", userIds);
      if (profErr) throw profErr;

      // Get org membership for each provider
      const { data: members } = await supabase
        .from("provider_members")
        .select("user_id, provider_org_id")
        .in("user_id", userIds)
        .eq("status", "ACTIVE");

      const { data: orgs } = await supabase
        .from("provider_orgs")
        .select("id, name");

      const orgMap = new Map(orgs?.map((o) => [o.id, o.name]) ?? []);
      const memberMap = new Map(members?.map((m) => [m.user_id, m.provider_org_id]) ?? []);

      return (profiles ?? []).map((p) => ({
        ...p,
        provider_org_id: memberMap.get(p.user_id),
        org_name: memberMap.get(p.user_id) ? orgMap.get(memberMap.get(p.user_id)!) : undefined,
      })) as ProviderProfile[];
    },
  });
}

/** Assign a provider to a zone+category with a role */
export function useAssignZoneCategoryProvider() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      zoneId: string;
      category: string;
      providerOrgId: string;
      role: "PRIMARY" | "BACKUP";
      priorityRank?: number;
    }) => {
      const { error } = await supabase.from("zone_category_providers").insert({
        zone_id: params.zoneId,
        category: params.category,
        provider_org_id: params.providerOrgId,
        role: params.role,
        priority_rank: params.priorityRank ?? 1,
      } as any);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["zone-category-providers", vars.zoneId] });
    },
  });
}

/** Remove a provider assignment */
export function useRemoveZoneCategoryProvider() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { id: string; zoneId: string }) => {
      const { error } = await supabase
        .from("zone_category_providers")
        .delete()
        .eq("id", params.id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["zone-category-providers", vars.zoneId] });
    },
  });
}

// Legacy exports for backward compat
export { useZoneCategoryProviders as useZoneProviders };
