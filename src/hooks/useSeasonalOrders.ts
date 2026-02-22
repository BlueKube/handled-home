import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { computeWindowDates, getEffectiveWindows, type SeasonalWindow, type WindowPreference } from "@/lib/seasonal";

export interface SeasonalOrder {
  id: string;
  customer_id: string;
  property_id: string;
  zone_id: string;
  seasonal_template_id: string;
  year: number;
  pricing_type: "included" | "upsell";
  price_cents: number;
  status: "planned" | "scheduled" | "completed" | "canceled";
  planned_window_start: string | null;
  planned_window_end: string | null;
  scheduled_service_day_id: string | null;
}

export function useSeasonalOrders(propertyId: string | null | undefined, year: number) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["seasonal-orders", propertyId, year],
    enabled: !!propertyId && !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("seasonal_orders")
        .select("*")
        .eq("property_id", propertyId!)
        .eq("year", year)
        .eq("customer_id", user!.id);
      if (error) throw error;
      return (data ?? []) as SeasonalOrder[];
    },
  });
}

export function useUpsertSeasonalOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      customer_id: string;
      property_id: string;
      zone_id: string;
      seasonal_template_id: string;
      year: number;
      pricing_type: "included" | "upsell";
      price_cents: number;
      template_windows: SeasonalWindow[];
      zone_windows_override?: SeasonalWindow[] | null;
      window_preference: WindowPreference;
    }) => {
      const effectiveWindows = getEffectiveWindows(params.template_windows, params.zone_windows_override);
      const dates = computeWindowDates(effectiveWindows, params.window_preference, params.year);

      const { data, error } = await supabase
        .from("seasonal_orders")
        .upsert(
          {
            customer_id: params.customer_id,
            property_id: params.property_id,
            zone_id: params.zone_id,
            seasonal_template_id: params.seasonal_template_id,
            year: params.year,
            pricing_type: params.pricing_type,
            price_cents: params.price_cents,
            status: "planned" as const,
            planned_window_start: dates ? dates.start.toISOString().split("T")[0] : null,
            planned_window_end: dates ? dates.end.toISOString().split("T")[0] : null,
          },
          { onConflict: "customer_id,property_id,seasonal_template_id,year" }
        )
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["seasonal-orders"] }),
  });
}

export function useCancelSeasonalOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (orderId: string) => {
      const { error } = await supabase
        .from("seasonal_orders")
        .update({ status: "canceled" })
        .eq("id", orderId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["seasonal-orders"] }),
  });
}
