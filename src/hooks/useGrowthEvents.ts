import { useMutation, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

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

/**
 * Check if a frequency cap has been exceeded for the current user on a given surface.
 * Returns { suppressed: true } if the cap is hit.
 */
export function useFrequencyCapCheck(
  surface: string,
  capKey: string,
  zoneId?: string,
  category?: string
) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["frequency-cap-check", user?.id, surface, capKey, zoneId, category],
    enabled: !!user,
    staleTime: 30_000,
    queryFn: async () => {
      // Determine the time window based on capKey
      const isWeekly = capKey.includes("week");
      const since = new Date();
      if (isWeekly) {
        since.setDate(since.getDate() - 7);
      } else {
        // Default: today
        since.setHours(0, 0, 0, 0);
      }

      // Fetch config to get cap value
      let capValue = 1; // sensible default
      if (zoneId && category) {
        const { data: cfg } = await (supabase as any)
          .from("growth_surface_config")
          .select("prompt_frequency_caps")
          .eq("zone_id", zoneId)
          .eq("category", category)
          .maybeSingle();
        if (cfg?.prompt_frequency_caps?.[capKey] != null) {
          capValue = cfg.prompt_frequency_caps[capKey];
        }
      }

      // Count recent events for this user + surface
      const { count, error } = await (supabase as any)
        .from("growth_events")
        .select("id", { count: "exact", head: true })
        .eq("actor_id", user!.id)
        .eq("source_surface", surface)
        .gte("created_at", since.toISOString());

      if (error) throw error;
      return { suppressed: (count ?? 0) >= capValue, count: count ?? 0, cap: capValue };
    },
  });
}

export function useGrowthEventStats(zoneId?: string, dateRange?: { start: string; end: string }) {
  return useQuery({
    queryKey: ["growth-event-stats", zoneId, dateRange?.start, dateRange?.end],
    queryFn: async () => {
      let query = (supabase as any)
        .from("growth_events")
        .select("event_type, source_surface, created_at")
        .order("created_at", { ascending: false })
        .limit(1000);

      if (zoneId) query = query.eq("zone_id", zoneId);
      if (dateRange?.start) query = query.gte("created_at", dateRange.start);
      if (dateRange?.end) query = query.lte("created_at", dateRange.end);

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
