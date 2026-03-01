import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AdminPropertyProfile {
  coverage: Array<{
    category_key: string;
    coverage_status: string;
    switch_intent: string | null;
    updated_at: string;
  }>;
  signals: {
    home_sqft_tier: string | null;
    yard_tier: string | null;
    windows_tier: string | null;
    stories_tier: string | null;
    updated_at: string;
  } | null;
}

export function useAdminPropertyProfile(propertyId: string | undefined | null) {
  return useQuery({
    queryKey: ["admin_property_profile", propertyId],
    enabled: !!propertyId,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<AdminPropertyProfile> => {
      const [coverageRes, signalsRes] = await Promise.all([
        supabase
          .from("property_coverage")
          .select("category_key, coverage_status, switch_intent, updated_at")
          .eq("property_id", propertyId!)
          .order("category_key"),
        supabase
          .from("property_signals")
          .select("home_sqft_tier, yard_tier, windows_tier, stories_tier, updated_at")
          .eq("property_id", propertyId!)
          .maybeSingle(),
      ]);
      if (coverageRes.error) throw coverageRes.error;
      if (signalsRes.error) throw signalsRes.error;
      return {
        coverage: coverageRes.data ?? [],
        signals: signalsRes.data ?? null,
      };
    },
  });
}
