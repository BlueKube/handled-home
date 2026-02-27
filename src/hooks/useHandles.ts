import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCustomerSubscription } from "@/hooks/useSubscription";

export interface HandleTransaction {
  id: string;
  txn_type: string;
  amount: number;
  balance_after: number;
  reference_type: string | null;
  reference_id: string | null;
  expires_at: string | null;
  created_at: string;
}

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

export function useHandleTransactions(limit = 20) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["handle_transactions", user?.id, limit],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("handle_transactions")
        .select("id, txn_type, amount, balance_after, reference_type, reference_id, expires_at, created_at")
        .eq("customer_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []) as HandleTransaction[];
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
