import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ZoneServiceWeekConfig {
  id: string;
  zone_id: string;
  anchor_day: number;
  anchor_time_local: string;
  cutoff_day_offset: number;
  cutoff_time_local: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useZoneServiceWeekConfig(zoneId: string | null) {
  return useQuery({
    queryKey: ["zone_service_week_config", zoneId],
    enabled: !!zoneId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("zone_service_week_config")
        .select("*")
        .eq("zone_id", zoneId!)
        .maybeSingle();
      if (error) throw error;
      return data as ZoneServiceWeekConfig | null;
    },
  });
}

export function useUpsertZoneServiceWeekConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (config: {
      zone_id: string;
      anchor_day: number;
      anchor_time_local?: string;
      is_active?: boolean;
    }) => {
      const client = supabase as any;
      const { data: existing } = await client
        .from("zone_service_week_config")
        .select("id")
        .eq("zone_id", config.zone_id)
        .maybeSingle();

      if (existing) {
        const { error } = await client
          .from("zone_service_week_config")
          .update({
            anchor_day: config.anchor_day,
            anchor_time_local: config.anchor_time_local ?? "00:00",
            is_active: config.is_active ?? true,
          })
          .eq("zone_id", config.zone_id);
        if (error) throw error;
      } else {
        const { error } = await client
          .from("zone_service_week_config")
          .insert({
            zone_id: config.zone_id,
            anchor_day: config.anchor_day,
            anchor_time_local: config.anchor_time_local ?? "00:00",
            is_active: config.is_active ?? true,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["zone_service_week_config"] }),
  });
}
