import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PlanRun {
  id: string;
  status: string;
  triggered_by: string;
  started_at: string | null;
  completed_at: string | null;
  run_date: string;
  summary: Record<string, any>;
  conflicts: Record<string, any>[];
  idempotency_key: string | null;
  created_at: string;
}

export function usePlanRuns(limit = 20) {
  return useQuery({
    queryKey: ["plan_runs", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("plan_runs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []) as unknown as PlanRun[];
    },
  });
}

export function usePlanRunDetail(runId?: string) {
  return useQuery({
    queryKey: ["plan_run_detail", runId],
    enabled: !!runId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("plan_runs")
        .select("*")
        .eq("id", runId!)
        .single();
      if (error) throw error;
      return data as unknown as PlanRun;
    },
  });
}

export function useTriggerPlanRun() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (mode: "full" | "draft_only" = "full") => {
      const { data, error } = await supabase.functions.invoke("run-nightly-planner", {
        body: { mode, triggered_by: mode === "draft_only" ? "admin_draft_only" : "admin_manual" },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plan_runs"] });
    },
  });
}
