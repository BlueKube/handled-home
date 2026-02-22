import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useProviderOrg() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const orgQuery = useQuery({
    queryKey: ["provider_org", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("provider_orgs")
        .select("*")
        .eq("accountable_owner_user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const createOrg = useMutation({
    mutationFn: async (params: { name: string; contact_phone?: string; home_base_zip?: string; website?: string; invite_id?: string }) => {
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("provider_orgs")
        .insert({
          name: params.name,
          contact_phone: params.contact_phone || null,
          home_base_zip: params.home_base_zip || null,
          website: params.website || null,
          invite_id: params.invite_id || null,
          accountable_owner_user_id: user.id,
          created_by_user_id: user.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["provider_org"] }),
  });

  const updateOrg = useMutation({
    mutationFn: async (params: { id: string; name?: string; contact_phone?: string; home_base_zip?: string; website?: string }) => {
      const { id, ...updates } = params;
      const { data, error } = await supabase
        .from("provider_orgs")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["provider_org"] }),
  });

  const submitOnboarding = useMutation({
    mutationFn: async (orgId: string) => {
      const { data, error } = await supabase.rpc("submit_provider_onboarding", { p_org_id: orgId });
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["provider_org"] }),
  });

  return {
    org: orgQuery.data,
    loading: orgQuery.isLoading,
    createOrg,
    updateOrg,
    submitOnboarding,
  };
}
