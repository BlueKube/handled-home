import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useOptimizeRoute() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ providerOrgId, date }: { providerOrgId: string; date: string }) => {
      const { data: { session } } = await supabase.auth.getSession();
      const { data, error } = await supabase.functions.invoke("optimize-routes", {
        body: { provider_org_id: providerOrgId, date },
        headers: session?.access_token
          ? { Authorization: `Bearer ${session.access_token}` }
          : undefined,
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data as { status: string; optimized: number };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["provider_jobs"] });
    },
  });
}

export function useReorderRoute() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      providerOrgId,
      date,
      jobOrders,
    }: {
      providerOrgId: string;
      date: string;
      jobOrders: { job_id: string; route_order: number }[];
    }) => {
      const { data, error } = await supabase.rpc("reorder_provider_route", {
        p_provider_org_id: providerOrgId,
        p_date: date,
        p_job_orders: jobOrders as any,
      });
      if (error) throw error;
      return data as unknown as { status: string; updated_count: number };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["provider_jobs"] });
    },
  });
}
