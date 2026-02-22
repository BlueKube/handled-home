import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useProviderMembers(orgId?: string) {
  const queryClient = useQueryClient();

  const membersQuery = useQuery({
    queryKey: ["provider_members", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from("provider_members")
        .select("*")
        .eq("provider_org_id", orgId);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!orgId,
  });

  const upsertOwnerMember = useMutation({
    mutationFn: async (params: { orgId: string; userId: string; displayName: string; phone?: string }) => {
      const { data, error } = await supabase
        .from("provider_members")
        .upsert({
          provider_org_id: params.orgId,
          user_id: params.userId,
          role_in_org: "OWNER",
          display_name: params.displayName,
          phone: params.phone || null,
        }, { onConflict: "provider_org_id,user_id" })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["provider_members"] }),
  });

  return { members: membersQuery.data ?? [], loading: membersQuery.isLoading, upsertOwnerMember };
}
