import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProperty } from "@/hooks/useProperty";

export interface PropertyProfileContext {
  property_id: string;
  coverage: Record<string, { status: string; switch_intent: string | null }>;
  sizing: {
    home_sqft_tier: string | null;
    yard_tier: string | null;
    windows_tier: string | null;
    stories_tier: string | null;
  };
  computed: {
    eligible_categories: string[];
    suppressed_categories: string[];
    high_confidence_upsells: string[];
    switch_candidates: string[];
  };
}

export function usePropertyProfileContext() {
  const { property } = useProperty();
  const propertyId = property?.id;

  return useQuery({
    queryKey: ["property_profile_context", propertyId],
    enabled: !!propertyId,
    staleTime: 5 * 60 * 1000, // 5 min
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_property_profile_context", {
        p_property_id: propertyId!,
      });
      if (error) throw error;
      return data as unknown as PropertyProfileContext;
    },
  });
}
