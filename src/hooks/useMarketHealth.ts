import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface HealthSnapshot {
  id: string;
  zone_id: string;
  category: string;
  supply_score: number;
  demand_score: number;
  quality_score: number;
  health_score: number;
  health_label: string;
  inputs: Record<string, any>;
  snapshot_at: string;
}

export function useMarketHealth(zoneId?: string) {
  const queryClient = useQueryClient();

  const snapshots = useQuery({
    queryKey: ["market_health_snapshots", zoneId],
    queryFn: async () => {
      let q = supabase
        .from("market_health_snapshots")
        .select("*")
        .order("snapshot_at", { ascending: false })
        .limit(50);
      if (zoneId) q = q.eq("zone_id", zoneId);
      const { data, error } = await q;
      if (error) throw error;
      return data as HealthSnapshot[];
    },
  });

  const computeHealth = useMutation({
    mutationFn: async (params: { zoneId: string; category: string }) => {
      const { data, error } = await supabase.rpc("compute_zone_health_score", {
        p_zone_id: params.zoneId,
        p_category: params.category,
      });
      if (error) throw error;
      return data as Record<string, any>;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["market_health_snapshots"] }),
  });

  return { snapshots, computeHealth };
}
