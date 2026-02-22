import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface SeasonalSelection {
  id: string;
  customer_id: string;
  property_id: string;
  zone_id: string;
  seasonal_template_id: string;
  selection_state: "off" | "included" | "upsell";
  window_preference: "early" | "mid" | "late";
  year: number;
  source: string;
}

export function useSeasonalSelections(propertyId: string | null | undefined, year: number) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["seasonal-selections", propertyId, year],
    enabled: !!propertyId && !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customer_seasonal_selections")
        .select("*")
        .eq("property_id", propertyId!)
        .eq("year", year)
        .eq("customer_id", user!.id);
      if (error) throw error;
      return (data ?? []) as SeasonalSelection[];
    },
  });
}

export function useUpsertSeasonalSelection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (selection: {
      customer_id: string;
      property_id: string;
      zone_id: string;
      seasonal_template_id: string;
      selection_state: "off" | "included" | "upsell";
      window_preference: "early" | "mid" | "late";
      year: number;
      source?: string;
    }) => {
      const { data, error } = await supabase
        .from("customer_seasonal_selections")
        .upsert(
          {
            customer_id: selection.customer_id,
            property_id: selection.property_id,
            zone_id: selection.zone_id,
            seasonal_template_id: selection.seasonal_template_id,
            selection_state: selection.selection_state,
            window_preference: selection.window_preference,
            year: selection.year,
            source: selection.source ?? "bundle_builder",
          },
          { onConflict: "customer_id,property_id,seasonal_template_id,year" }
        )
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["seasonal-selections"] });
      qc.invalidateQueries({ queryKey: ["seasonal-orders"] });
    },
  });
}
