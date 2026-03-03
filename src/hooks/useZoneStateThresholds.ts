import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ZoneStateThresholdConfig {
  id: string;
  config_key: string;
  config_value: { value: number };
  description: string | null;
  updated_by_admin_user_id: string | null;
  created_at: string;
  updated_at: string;
}

export function useZoneStateThresholds() {
  const queryClient = useQueryClient();

  const thresholds = useQuery({
    queryKey: ["zone_state_threshold_configs"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("zone_state_threshold_configs")
        .select("*")
        .order("config_key");
      if (error) throw error;
      return data as ZoneStateThresholdConfig[];
    },
  });

  const updateThreshold = useMutation({
    mutationFn: async (params: { id: string; value: number }) => {
      const { error } = await (supabase as any)
        .from("zone_state_threshold_configs")
        .update({
          config_value: { value: params.value },
          updated_at: new Date().toISOString(),
        })
        .eq("id", params.id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["zone_state_threshold_configs"] }),
  });

  /** Get a threshold value by key, with a fallback default */
  const getThresholdValue = (key: string, fallback: number): number => {
    const config = thresholds.data?.find((t) => t.config_key === key);
    return config?.config_value?.value ?? fallback;
  };

  return { thresholds, updateThreshold, getThresholdValue };
}
