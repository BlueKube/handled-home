import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ZoneBuilderConfig {
  resolution: number;
  seed_strategy: "auto" | "demand_first" | "provider_first";
  target_workload_days: number;
  max_spread_minutes: number;
  min_density: number;
}

export interface ZoneResultMetrics {
  demand_min_week: number;
  supply_min_week: number;
  sd_ratio: number;
  density: number;
  compactness: number;
  max_spread_drive_min: number;
  max_spread_cells: number;
  cell_count: number;
  total_area_km2: number;
  customer_count: number;
  provider_count: number;
}

export interface ZoneBuilderResult {
  id: string;
  run_id: string;
  zone_label: string;
  cell_indices: string[];
  metrics: ZoneResultMetrics;
  warnings: string[];
  neighbor_zone_labels: string[];
}

export interface ZoneBuilderRun {
  id: string;
  region_id: string;
  config: ZoneBuilderConfig;
  status: string;
  created_by: string;
  created_at: string;
}

const DEFAULT_CONFIG: ZoneBuilderConfig = {
  resolution: 7,
  seed_strategy: "auto",
  target_workload_days: 4,
  max_spread_minutes: 15,
  min_density: 0.5,
};

export function useZoneBuilderRun(runId?: string | null) {
  const queryClient = useQueryClient();

  // Fetch run details
  const runQuery = useQuery({
    queryKey: ["zone-builder-run", runId],
    queryFn: async () => {
      if (!runId) return null;
      const { data, error } = await supabase
        .from("zone_builder_runs")
        .select("*")
        .eq("id", runId)
        .single();
      if (error) throw error;
      return data as unknown as ZoneBuilderRun;
    },
    enabled: !!runId,
  });

  // Fetch results for a run
  const resultsQuery = useQuery({
    queryKey: ["zone-builder-results", runId],
    queryFn: async () => {
      if (!runId) return [];
      const { data, error } = await supabase
        .from("zone_builder_results")
        .select("*")
        .eq("run_id", runId);
      if (error) throw error;
      return (data || []) as unknown as ZoneBuilderResult[];
    },
    enabled: !!runId,
  });

  // Generate zones mutation
  const generateMutation = useMutation({
    mutationFn: async ({
      regionId,
      config,
    }: {
      regionId: string;
      config?: Partial<ZoneBuilderConfig>;
    }) => {
      const mergedConfig = { ...DEFAULT_CONFIG, ...config };
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) throw new Error("Not authenticated");

      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/generate-zones`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ region_id: regionId, config: mergedConfig }),
        }
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Generation failed" }));
        throw new Error(err.error || "Generation failed");
      }

      return res.json();
    },
    onSuccess: (data) => {
      if (data.run_id) {
        queryClient.invalidateQueries({ queryKey: ["zone-builder-run", data.run_id] });
        queryClient.invalidateQueries({ queryKey: ["zone-builder-results", data.run_id] });
      }
      toast.success(`Generated ${data.summary?.zone_count || 0} zones`);
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  return {
    run: runQuery.data,
    runLoading: runQuery.isLoading,
    results: resultsQuery.data || [],
    resultsLoading: resultsQuery.isLoading,
    generate: generateMutation.mutateAsync,
    generating: generateMutation.isPending,
    defaultConfig: DEFAULT_CONFIG,
  };
}
