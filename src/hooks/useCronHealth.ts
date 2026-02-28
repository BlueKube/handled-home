import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface CronRun {
  id: string;
  function_name: string;
  started_at: string;
  completed_at: string | null;
  status: string;
  result_summary: Record<string, unknown> | null;
  error_message: string | null;
  idempotency_key: string | null;
  created_at: string;
}

export function useCronHealth() {
  const qc = useQueryClient();

  const runs = useQuery({
    queryKey: ["cron-health"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cron_run_log")
        .select("*")
        .order("started_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data as CronRun[];
    },
    refetchInterval: 30_000,
  });

  const retryNow = useMutation({
    mutationFn: async (functionName: string) => {
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: { manual: true },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (_, fn) => {
      toast.success(`Triggered ${fn}`);
      qc.invalidateQueries({ queryKey: ["cron-health"] });
    },
    onError: (err) => toast.error(`Retry failed: ${err.message}`),
  });

  return { runs, retryNow };
}
