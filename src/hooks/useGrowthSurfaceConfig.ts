import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SurfaceConfig {
  id: string;
  zone_id: string;
  category: string;
  surface_weights: Record<string, number>;
  prompt_frequency_caps: Record<string, number>;
  incentive_visibility: boolean;
  share_brand_default: string;
  share_link_expiry_days: number;
  share_link_hard_cap_days: number;
  updated_at: string;
}

export function useGrowthSurfaceConfig(zoneId?: string) {
  const queryClient = useQueryClient();

  const configs = useQuery({
    queryKey: ["growth-surface-config", zoneId],
    queryFn: async () => {
      let query = (supabase as any)
        .from("growth_surface_config")
        .select("*")
        .order("category");

      if (zoneId) query = query.eq("zone_id", zoneId);

      const { data, error } = await query;
      if (error) throw error;
      return data as SurfaceConfig[];
    },
  });

  const upsertConfig = useMutation({
    mutationFn: async (config: Partial<SurfaceConfig> & { zone_id: string; category: string }) => {
      const { error } = await (supabase as any)
        .from("growth_surface_config")
        .upsert(
          { ...config, updated_at: new Date().toISOString() },
          { onConflict: "zone_id,category" }
        );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["growth-surface-config"] });
    },
  });

  return { configs, upsertConfig };
}

/**
 * Check if a specific surface is enabled (weight > 0) for a zone/category.
 * Returns true by default if no config exists (surfaces are on by default).
 */
export function useIsSurfaceEnabled(zoneId?: string, category?: string, surfaceKey?: string) {
  const { data, isLoading } = useQuery({
    queryKey: ["growth-surface-enabled", zoneId, category, surfaceKey],
    enabled: !!zoneId && !!category && !!surfaceKey,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("growth_surface_config")
        .select("surface_weights")
        .eq("zone_id", zoneId)
        .eq("category", category)
        .maybeSingle();

      if (error) throw error;
      if (!data) return true; // No config = enabled by default
      const weights = data.surface_weights as Record<string, number> | null;
      if (!weights || !(surfaceKey! in weights)) return true;
      return weights[surfaceKey!] > 0;
    },
    staleTime: 60_000,
  });

  return { enabled: isLoading ? true : (data ?? true), isLoading };
}
