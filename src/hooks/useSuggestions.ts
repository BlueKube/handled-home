import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ServiceSuggestion {
  sku_id: string;
  sku_name: string;
  category: string | null;
  handle_cost: number;
  score: number;
  suggestion_type: "best_next" | "seasonal" | "adjacent" | "predicted";
  reason: string;
  default_level: {
    id: string;
    label: string;
    handles_cost: number;
  } | null;
}

export function useSuggestions(propertyId: string | undefined, surface: "home" | "drawer" | "routine" | "receipt" = "home") {
  return useQuery({
    queryKey: ["service-suggestions", propertyId, surface],
    enabled: !!propertyId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_service_suggestions", {
        p_property_id: propertyId!,
        p_surface: surface,
      });
      if (error) throw error;
      return (data as unknown as ServiceSuggestion[]) ?? [];
    },
  });
}
