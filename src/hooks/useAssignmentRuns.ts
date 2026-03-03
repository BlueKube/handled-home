import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AssignmentRun {
  id: string;
  status: string;
  triggered_by: string | null;
  started_at: string | null;
  completed_at: string | null;
  run_date: string;
  idempotency_key: string | null;
  summary: Record<string, any> | null;
  created_at: string | null;
}

export function useAssignmentRuns(limit = 20) {
  return useQuery({
    queryKey: ["assignment_runs", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assignment_runs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []) as AssignmentRun[];
    },
  });
}

export function useTriggerAssignmentRun() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("assign-visits", {
        body: { triggered_by: "admin_manual" },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignment_runs"] });
    },
  });
}
