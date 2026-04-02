import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCustomerSubscription } from "@/hooks/useSubscription";

export interface PlanHandlesConfig {
  handles_per_cycle: number;
  rollover_cap: number;
  rollover_expiry_days: number;
}

export function useHandleBalance() {
  const { data: subscription } = useCustomerSubscription();
  return useQuery({
    queryKey: ["handle_balance", subscription?.id],
    enabled: !!subscription?.id,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_handle_balance", {
        p_subscription_id: subscription!.id,
      });
      if (error) throw error;
      return (data as number) ?? 0;
    },
  });
}

export function usePlanHandlesConfig(planId: string | null | undefined) {
  return useQuery({
    queryKey: ["plan_handles", planId],
    enabled: !!planId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("plan_handles")
        .select("handles_per_cycle, rollover_cap, rollover_expiry_days")
        .eq("plan_id", planId!)
        .maybeSingle();
      if (error) throw error;
      return data as PlanHandlesConfig | null;
    },
  });
}
