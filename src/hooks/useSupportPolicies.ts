import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type SupportPolicy = {
  id: string;
  version: number;
  name: string;
  description: string | null;
  dials: Record<string, unknown>;
  change_reason: string | null;
  created_by_user_id: string | null;
  status: string;
  published_at: string | null;
  created_at: string;
};

export type SupportPolicyScope = {
  id: string;
  scope_type: string;
  scope_ref_id: string | null;
  scope_ref_key: string | null;
  active_policy_id: string;
  created_at: string;
  updated_at: string;
};

export function useSupportPolicies() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const policiesQuery = useQuery({
    queryKey: ["support-policies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("support_policies")
        .select("*")
        .order("version", { ascending: false });
      if (error) throw error;
      return (data ?? []) as SupportPolicy[];
    },
  });

  const scopesQuery = useQuery({
    queryKey: ["support-policy-scopes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("support_policy_scopes")
        .select("*")
        .order("scope_type", { ascending: true });
      if (error) throw error;
      return (data ?? []) as SupportPolicyScope[];
    },
  });

  const createPolicy = useMutation({
    mutationFn: async (input: {
      name: string;
      description?: string;
      dials: Record<string, unknown>;
      change_reason: string;
    }) => {
      const maxVersion = policiesQuery.data?.[0]?.version ?? 0;

      const { data, error } = await supabase
        .from("support_policies")
        .insert([{
          version: maxVersion + 1,
          name: input.name,
          description: input.description,
          dials: input.dials as any,
          change_reason: input.change_reason,
          created_by_user_id: user?.id,
          status: "draft",
        }])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["support-policies"] });
    },
  });

  const publishPolicy = useMutation({
    mutationFn: async (policyId: string) => {
      const { error } = await supabase
        .from("support_policies")
        .update({ status: "published", published_at: new Date().toISOString() })
        .eq("id", policyId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["support-policies"] });
    },
  });

  const rollbackPolicy = useMutation({
    mutationFn: async (policyId: string) => {
      const { error } = await supabase
        .from("support_policies")
        .update({ status: "rolled_back" })
        .eq("id", policyId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["support-policies"] });
    },
  });

  const deleteScope = useMutation({
    mutationFn: async (scopeId: string) => {
      const { error } = await supabase
        .from("support_policy_scopes")
        .delete()
        .eq("id", scopeId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["support-policy-scopes"] });
    },
  });

  const createScope = useMutation({
    mutationFn: async (input: { scope_type: string; scope_ref_id: string; active_policy_id: string }) => {
      const { data, error } = await supabase
        .from("support_policy_scopes")
        .upsert(
          { scope_type: input.scope_type, scope_ref_id: input.scope_ref_id, active_policy_id: input.active_policy_id },
          { onConflict: "scope_type,scope_ref_id" }
        )
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["support-policy-scopes"] });
    },
  });

  return {
    policies: policiesQuery.data ?? [],
    scopes: scopesQuery.data ?? [],
    isLoading: policiesQuery.isLoading,
    isError: policiesQuery.isError,
    createPolicy,
    publishPolicy,
    rollbackPolicy,
    createScope,
    deleteScope,
  };
}
