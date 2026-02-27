import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCustomerSubscription } from "@/hooks/useSubscription";
import { useProperty } from "@/hooks/useProperty";
import type { Tables } from "@/integrations/supabase/types";

export type AddonSku = Tables<"service_skus">;

export interface AddonOrder {
  id: string;
  sku_id: string;
  payment_method: string;
  handle_cost: number;
  price_cents: number;
  status: string;
  created_at: string;
}

/**
 * Fetches add-on SKUs with contextual filtering:
 * - Only is_addon = true, status = active
 * - Gated: returns empty if customer has no completed visits
 */
export function useAddonSuggestions() {
  const { user } = useAuth();
  const { data: subscription } = useCustomerSubscription();

  return useQuery({
    queryKey: ["addon_suggestions", user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (!user) return { skus: [], gated: true };

      // Gate check: at least 1 completed visit
      const { count, error: countErr } = await supabase
        .from("jobs")
        .select("id", { count: "exact", head: true })
        .eq("customer_id", user.id)
        .in("status", ["COMPLETED", "PARTIAL_COMPLETE"]);
      if (countErr) throw countErr;
      if ((count ?? 0) < 1) return { skus: [], gated: true };

      // Fetch active add-on SKUs
      const { data, error } = await supabase
        .from("service_skus")
        .select("*")
        .eq("is_addon", true)
        .eq("status", "active")
        .order("display_order");
      if (error) throw error;

      // Contextual filtering by season
      const currentMonth = new Date().getMonth() + 1; // 1-12
      const scored = (data ?? []).map((sku) => {
        let relevance = 0;
        const triggers = (sku.addon_triggers as any[]) ?? [];
        for (const t of triggers) {
          if (t.type === "season" && Array.isArray(t.months) && t.months.includes(currentMonth)) {
            relevance += 2;
          }
          // Future: weather, days_since_last
        }
        return { ...sku, relevance };
      });

      // Sort by relevance desc, take top 6
      scored.sort((a, b) => b.relevance - a.relevance);
      return { skus: scored.slice(0, 6) as AddonSku[], gated: false };
    },
  });
}

export function useAddonOrders() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["addon_orders", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("addon_orders")
        .select("id, sku_id, payment_method, handle_cost, price_cents, status, created_at")
        .eq("customer_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data ?? []) as AddonOrder[];
    },
  });
}

export function usePurchaseAddon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      subscriptionId: string;
      skuId: string;
      propertyId: string;
      zoneId: string;
      paymentMethod: "handles" | "cash";
    }) => {
      const { data, error } = await supabase.rpc("purchase_addon", {
        p_subscription_id: params.subscriptionId,
        p_sku_id: params.skuId,
        p_property_id: params.propertyId,
        p_zone_id: params.zoneId,
        p_payment_method: params.paymentMethod,
      });
      if (error) throw error;
      return data as { success: boolean; order_id: string; sku_name: string };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["addon_orders"] });
      qc.invalidateQueries({ queryKey: ["addon_suggestions"] });
      qc.invalidateQueries({ queryKey: ["handle_balance"] });
      qc.invalidateQueries({ queryKey: ["handle_transactions"] });
    },
  });
}
