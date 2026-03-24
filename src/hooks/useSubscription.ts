import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Subscription {
  id: string;
  customer_id: string;
  property_id: string | null;
  zone_id: string | null;
  plan_id: string;
  entitlement_version_id: string | null;
  status: string;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  pending_plan_id: string | null;
  pending_effective_at: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  created_at: string;
  updated_at: string;
  // 28-day billing cycle fields
  access_activated_at: string | null;
  billing_cycle_start_at: string | null;
  billing_cycle_end_at: string | null;
  next_billing_at: string | null;
  billing_cycle_length_days: number;
  // Weekly service week fields
  current_service_week_start_at: string | null;
  current_service_week_end_at: string | null;
  next_service_week_start_at: string | null;
  next_service_week_end_at: string | null;
  // Handles balance (cache — source of truth is handle_transactions ledger)
  handles_balance: number;
  // D4 columns
  paused_at: string | null;
  resume_at: string | null;
  pause_weeks: number | null;
  cancel_reason: string | null;
  cancel_feedback: string | null;
  retention_offer_accepted: boolean;
}

export function useCustomerSubscription(refetchInterval?: number) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["subscription", user?.id],
    enabled: !!user,
    refetchInterval,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("customer_id", user!.id)
        .in("status", ["active", "trialing", "past_due", "canceling", "paused"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as Subscription | null;
    },
  });
}

