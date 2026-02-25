import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface WeatherEvent {
  id: string;
  zone_id: string;
  category: string;
  event_type: string;
  severity: string;
  strategy: string;
  status: string;
  title: string;
  description: string | null;
  affected_date_start: string;
  affected_date_end: string;
  source: string;
  auto_detection_data: Record<string, unknown>;
  approved_by_admin_user_id: string | null;
  approved_at: string | null;
  resolved_at: string | null;
  explain_customer: string | null;
  explain_provider: string | null;
  explain_admin: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

/** Admin: fetch all weather events */
export function useWeatherEventsAdmin(filters: { zoneId?: string; status?: string } = {}) {
  return useQuery({
    queryKey: ["weather-events-admin", filters],
    queryFn: async () => {
      let query = supabase
        .from("weather_events")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (filters.zoneId) query = query.eq("zone_id", filters.zoneId);
      if (filters.status) query = query.eq("status", filters.status);

      const { data, error } = await query;
      if (error) throw error;
      return data as WeatherEvent[];
    },
  });
}

/** Customer/Provider: fetch active weather events for a zone */
export function useActiveWeatherEvents(zoneId: string | undefined) {
  return useQuery({
    queryKey: ["weather-events-active", zoneId],
    enabled: !!zoneId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("weather_events")
        .select("*")
        .eq("zone_id", zoneId!)
        .in("status", ["active", "approved"])
        .gte("affected_date_end", new Date().toISOString().split("T")[0])
        .order("affected_date_start", { ascending: true });

      if (error) throw error;
      return data as WeatherEvent[];
    },
  });
}

/** Admin: approve a pending weather event */
export function useApproveWeatherEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (eventId: string) => {
      const { data, error } = await supabase.rpc("approve_weather_event", { p_event_id: eventId });
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["weather-events-admin"] }),
  });
}

/** Admin: resolve an active weather event */
export function useResolveWeatherEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (eventId: string) => {
      const { data, error } = await supabase.rpc("resolve_weather_event", { p_event_id: eventId });
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["weather-events-admin"] }),
  });
}
