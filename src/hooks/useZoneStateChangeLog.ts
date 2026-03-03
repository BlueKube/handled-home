import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ZoneStateChangeLogEntry {
  id: string;
  zone_id: string;
  category: string;
  previous_state: string | null;
  new_state: string;
  change_source: "manual" | "approved_recommendation" | "system_emergency";
  reason: string | null;
  reason_codes: string[];
  actor_user_id: string | null;
  recommendation_id: string | null;
  metrics_snapshot: Record<string, any>;
  created_at: string;
}

export function useZoneStateChangeLog(zoneId?: string, category?: string, limit = 50) {
  return useQuery({
    queryKey: ["zone_state_change_log", zoneId, category, limit],
    queryFn: async () => {
      let q = (supabase as any)
        .from("zone_state_change_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (zoneId) q = q.eq("zone_id", zoneId);
      if (category) q = q.eq("category", category);
      const { data, error } = await q;
      if (error) throw error;
      return data as ZoneStateChangeLogEntry[];
    },
  });
}
