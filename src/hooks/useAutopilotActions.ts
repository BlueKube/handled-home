import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AutopilotAction {
  id: string;
  zone_id: string;
  category: string;
  action_type: string;
  previous_state: string | null;
  new_state: string | null;
  trigger_source: string;
  reason: string | null;
  metadata: Record<string, any>;
  actor_user_id: string | null;
  created_at: string;
}

export function useAutopilotActions(zoneId?: string, limit = 50) {
  return useQuery({
    queryKey: ["growth_autopilot_actions", zoneId, limit],
    queryFn: async () => {
      let q = supabase
        .from("growth_autopilot_actions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (zoneId) q = q.eq("zone_id", zoneId);
      const { data, error } = await q;
      if (error) throw error;
      return data as AutopilotAction[];
    },
  });
}
