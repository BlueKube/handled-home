import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface SopRun {
  id: string;
  sop_id: string;
  started_by_user_id: string;
  total_steps: number;
  steps_completed: number[];
  step_notes: Record<string, string>;
  status: string;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export function useSopRuns(sopId?: string) {
  return useQuery({
    queryKey: ["sop-runs", sopId],
    queryFn: async () => {
      let query = (supabase
        .from("sop_runs" as any)
        .select("*") as any)
        .order("created_at", { ascending: false })
        .limit(20);

      if (sopId) {
        query = query.eq("sop_id", sopId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as SopRun[];
    },
  });
}

export function useActiveSopRun(sopId: string) {
  return useQuery({
    queryKey: ["sop-run-active", sopId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await (supabase
        .from("sop_runs" as any)
        .select("*") as any)
        .eq("sop_id", sopId)
        .eq("started_by_user_id", user.id)
        .eq("status", "in_progress")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as SopRun | null;
    },
  });
}

export function useStartSopRun() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { sopId: string; totalSteps: number }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await (supabase
        .from("sop_runs" as any) as any)
        .insert({
          sop_id: params.sopId,
          started_by_user_id: user.id,
          total_steps: params.totalSteps,
          steps_completed: [] as any,
          step_notes: {} as any,
        })
        .select()
        .single();

      if (error) throw error;
      return data as SopRun;
    },
    onSuccess: (_, params) => {
      qc.invalidateQueries({ queryKey: ["sop-runs"] });
      qc.invalidateQueries({ queryKey: ["sop-run-active", params.sopId] });
    },
  });
}

export function useUpdateSopRun() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      runId: string;
      sopId: string;
      stepsCompleted: number[];
      stepNotes: Record<string, string>;
      status?: "in_progress" | "completed" | "abandoned";
    }) => {
      const update: Record<string, unknown> = {
        steps_completed: params.stepsCompleted as any,
        step_notes: params.stepNotes as any,
        updated_at: new Date().toISOString(),
      };

      if (params.status) {
        update.status = params.status;
        if (params.status === "completed" || params.status === "abandoned") {
          update.completed_at = new Date().toISOString();
        }
      }

      const { error } = await (supabase
        .from("sop_runs" as any) as any)
        .update(update)
        .eq("id", params.runId);

      if (error) throw error;
    },
    onSuccess: (_, params) => {
      qc.invalidateQueries({ queryKey: ["sop-runs"] });
      qc.invalidateQueries({ queryKey: ["sop-run-active", params.sopId] });
    },
  });
}
