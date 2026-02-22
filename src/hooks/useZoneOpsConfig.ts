import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ZoneOpsConfig {
  zone_id: string;
  provider_home_label: string | null;
  provider_home_lat: number | null;
  provider_home_lng: number | null;
  target_stops_per_week: number;
  max_stops_per_week: number | null;
  created_at: string;
  updated_at: string;
}

export function useZoneOpsConfig(zoneId: string | null) {
  return useQuery({
    queryKey: ["zone_ops_config", zoneId],
    enabled: !!zoneId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("zone_ops_config")
        .select("*")
        .eq("zone_id", zoneId!)
        .maybeSingle();
      if (error) throw error;
      return data as ZoneOpsConfig | null;
    },
  });
}

export function useUpsertZoneOpsConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (config: Partial<ZoneOpsConfig> & { zone_id: string }) => {
      const { data, error } = await supabase
        .from("zone_ops_config")
        .upsert(config, { onConflict: "zone_id" })
        .select()
        .single();
      if (error) throw error;
      return data as ZoneOpsConfig;
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ["zone_ops_config", vars.zone_id] }),
  });
}
