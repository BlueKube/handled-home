import { useMutation, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface RecordEventParams {
  eventType: string;
  actorRole: string;
  sourceSurface: string;
  idempotencyKey: string;
  zoneId?: string;
  category?: string;
  context?: Record<string, any>;
}

export function useGrowthEvents() {
  const recordEvent = useMutation({
    mutationFn: async (params: RecordEventParams) => {
      const { data, error } = await supabase.rpc("record_growth_event" as any, {
        p_event_type: params.eventType,
        p_actor_role: params.actorRole,
        p_source_surface: params.sourceSurface,
        p_idempotency_key: params.idempotencyKey,
        p_zone_id: params.zoneId ?? null,
        p_category: params.category ?? null,
        p_context: params.context ?? {},
      });
      if (error) throw error;
      return data;
    },
  });

  return { recordEvent };
}

export function useGrowthEventStats(zoneId?: string) {
  return useQuery({
    queryKey: ["growth-event-stats", zoneId],
    queryFn: async () => {
      let query = (supabase as any)
        .from("growth_events")
        .select("event_type, source_surface, created_at")
        .order("created_at", { ascending: false })
        .limit(500);

      if (zoneId) query = query.eq("zone_id", zoneId);

      const { data, error } = await query;
      if (error) throw error;

      // Aggregate counts by type and surface
      const byType: Record<string, number> = {};
      const bySurface: Record<string, number> = {};
      (data ?? []).forEach((e: any) => {
        byType[e.event_type] = (byType[e.event_type] || 0) + 1;
        bySurface[e.source_surface] = (bySurface[e.source_surface] || 0) + 1;
      });

      return { byType, bySurface, total: data?.length ?? 0 };
    },
  });
}
