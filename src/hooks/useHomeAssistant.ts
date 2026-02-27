import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Tables } from "@/integrations/supabase/types";

export type HomeAssistantSku = Tables<"service_skus">;

export interface BookingWindow {
  id: string;
  zone_id: string;
  window_date: string;
  window_slot: string;
  capacity: number;
  booked: number;
}

/** Fetch Home Assistant SKUs (active, provider_category = home_assistant) */
export function useHomeAssistantSkus() {
  return useQuery({
    queryKey: ["home_assistant_skus"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_skus")
        .select("*")
        .eq("provider_category", "home_assistant")
        .eq("status", "active")
        .order("display_order");
      if (error) throw error;
      return data as HomeAssistantSku[];
    },
  });
}

/** Fetch available booking windows for zone (next 3 days with capacity) */
export function useHomeAssistantWindows(zoneId: string | null | undefined) {
  return useQuery({
    queryKey: ["home_assistant_windows", zoneId],
    enabled: !!zoneId,
    queryFn: async () => {
      const today = new Date().toISOString().slice(0, 10);
      const { data, error } = await supabase
        .from("home_assistant_windows")
        .select("*")
        .eq("zone_id", zoneId!)
        .gte("window_date", today)
        .order("window_date")
        .order("window_slot")
        .limit(6); // Next 3 days × 2 slots
      if (error) throw error;
      // Filter to only windows with remaining capacity
      return ((data ?? []) as BookingWindow[]).filter((w) => w.booked < w.capacity);
    },
  });
}

/** Book a Home Assistant session */
export function useBookHomeAssistant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      subscriptionId: string;
      skuId: string;
      propertyId: string;
      zoneId: string;
      windowId: string;
      paymentMethod: "handles" | "cash";
    }) => {
      const { data, error } = await supabase.rpc("book_home_assistant", {
        p_subscription_id: params.subscriptionId,
        p_sku_id: params.skuId,
        p_property_id: params.propertyId,
        p_zone_id: params.zoneId,
        p_window_id: params.windowId,
        p_payment_method: params.paymentMethod,
      });
      if (error) throw error;
      return data as { success: boolean; order_id: string; window_date: string; window_slot: string };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["home_assistant_windows"] });
      qc.invalidateQueries({ queryKey: ["handle_balance"] });
      qc.invalidateQueries({ queryKey: ["addon_orders"] });
    },
  });
}
