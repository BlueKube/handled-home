import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useProviderCoverage(orgId?: string) {
  const queryClient = useQueryClient();

  const coverageQuery = useQuery({
    queryKey: ["provider_coverage", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from("provider_coverage")
        .select("*, zones(name, zip_codes, status)")
        .eq("provider_org_id", orgId);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!orgId,
  });

  const addCoverage = useMutation({
    mutationFn: async (params: { orgId: string; zoneId: string; coverageType?: string; maxTravelMiles?: number }) => {
      const { data, error } = await supabase
        .from("provider_coverage")
        .insert({
          provider_org_id: params.orgId,
          zone_id: params.zoneId,
          coverage_type: params.coverageType || "PRIMARY",
          max_travel_miles: params.maxTravelMiles || null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["provider_coverage"] }),
  });

  const removeCoverage = useMutation({
    mutationFn: async (coverageId: string) => {
      const { error } = await supabase.from("provider_coverage").delete().eq("id", coverageId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["provider_coverage"] }),
  });

  return { coverage: coverageQuery.data ?? [], loading: coverageQuery.isLoading, isError: coverageQuery.isError, refetch: coverageQuery.refetch, addCoverage, removeCoverage };
}
