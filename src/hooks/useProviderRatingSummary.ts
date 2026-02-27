import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ProviderRatingSummary {
  provider_org_id: string;
  total_reviews: number;
  avg_rating: number;
  positive_count: number;
  negative_count: number;
}

export function useProviderRatingSummary(providerOrgId: string | undefined) {
  return useQuery<ProviderRatingSummary | null>({
    queryKey: ["provider_rating_summary", providerOrgId],
    enabled: !!providerOrgId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("provider_rating_summary" as any)
        .select("*")
        .eq("provider_org_id", providerOrgId!)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as ProviderRatingSummary | null;
    },
  });
}
