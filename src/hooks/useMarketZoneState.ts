import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type MarketZoneCategoryStatus =
  | "CLOSED"
  | "WAITLIST_ONLY"
  | "PROVIDER_RECRUITING"
  | "SOFT_LAUNCH"
  | "OPEN"
  | "PROTECT_QUALITY";

export interface ZoneCategoryState {
  id: string;
  zone_id: string;
  category: string;
  status: MarketZoneCategoryStatus;
  locked_until: string | null;
  locked_by_admin_user_id: string | null;
  lock_reason: string | null;
  config: Record<string, any>;
  last_state_change_at: string | null;
  last_state_change_by: string | null;
  previous_status: string | null;
  founding_partner_slots_total: number | null;
  founding_partner_slots_filled: number | null;
  updated_at: string;
  created_at: string;
}

export function useMarketZoneState(zoneId?: string) {
  const queryClient = useQueryClient();

  const states = useQuery({
    queryKey: ["market_zone_category_state", zoneId],
    queryFn: async () => {
      let q = supabase.from("market_zone_category_state").select("*").order("category");
      if (zoneId) q = q.eq("zone_id", zoneId);
      const { data, error } = await q;
      if (error) throw error;
      return data as unknown as ZoneCategoryState[];
    },
  });

  const overrideState = useMutation({
    mutationFn: async (params: {
      zoneId: string;
      category: string;
      newState: MarketZoneCategoryStatus;
      reason: string;
      lockDays?: number;
    }) => {
      const { data, error } = await supabase.rpc("admin_override_zone_state", {
        p_zone_id: params.zoneId,
        p_category: params.category,
        p_new_state: params.newState,
        p_reason: params.reason,
        p_lock_days: params.lockDays ?? null,
      });
      if (error) throw error;
      return data as unknown as { success: boolean; previous_state: string; new_state: string; was_locked: boolean };
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["market_zone_category_state"] }),
  });

  return { states, overrideState };
}
