import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface PropertyHealthScore {
  id: string;
  property_id: string;
  customer_id: string;
  overall_score: number;
  regularity_score: number;
  coverage_score: number;
  seasonal_score: number;
  issue_score: number;
  previous_overall_score: number | null;
  computed_at: string;
}

export function usePropertyHealth(propertyId: string | undefined) {
  const { user } = useAuth();

  const scoreQuery = useQuery<PropertyHealthScore | null>({
    queryKey: ["property_health", propertyId],
    enabled: !!propertyId && !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("property_health_scores")
        .select("*")
        .eq("property_id", propertyId!)
        .maybeSingle();
      if (error) throw error;
      return data as PropertyHealthScore | null;
    },
  });

  return scoreQuery;
}

export function useComputePropertyHealth() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ propertyId, customerId }: { propertyId: string; customerId: string }) => {
      const { data, error } = await supabase.rpc("compute_property_health_score", {
        p_property_id: propertyId,
        p_customer_id: customerId,
      });
      if (error) throw error;
      return data as { overall: number; regularity: number; coverage: number; seasonal: number; issue: number; previous_overall: number | null };
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["property_health", vars.propertyId] });
    },
  });
}
