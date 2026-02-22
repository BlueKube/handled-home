import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useProviderCapabilities(orgId?: string) {
  const queryClient = useQueryClient();

  const capabilitiesQuery = useQuery({
    queryKey: ["provider_capabilities", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from("provider_capabilities")
        .select("*, service_skus(name, category, duration_minutes, required_photos, checklist)")
        .eq("provider_org_id", orgId);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!orgId,
  });

  const toggleCapability = useMutation({
    mutationFn: async (params: { orgId: string; skuId: string; skuName: string; category: string; enabled: boolean }) => {
      // Upsert: if exists toggle, else insert
      const existing = capabilitiesQuery.data?.find(c => c.sku_id === params.skuId);
      if (existing) {
        const { error } = await supabase
          .from("provider_capabilities")
          .update({ is_enabled: params.enabled })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("provider_capabilities")
          .insert({
            provider_org_id: params.orgId,
            capability_type: "SKU",
            capability_key: params.category,
            sku_id: params.skuId,
            is_enabled: params.enabled,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["provider_capabilities"] }),
  });

  return { capabilities: capabilitiesQuery.data ?? [], loading: capabilitiesQuery.isLoading, toggleCapability };
}
