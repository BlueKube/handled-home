import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
}

export function useCustomerSubscription() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["subscription", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("customer_id", user!.id)
        .in("status", ["active", "trialing", "past_due", "canceling"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as Subscription | null;
    },
  });
}

export function useCancelSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (subscriptionId: string) => {
      const { error } = await supabase
        .from("subscriptions")
        .update({ cancel_at_period_end: true, status: "canceling" } as any)
        .eq("id", subscriptionId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["subscription"] }),
  });
}

export function useChangePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ subscriptionId, newPlanId }: { subscriptionId: string; newPlanId: string }) => {
      const { error } = await supabase
        .from("subscriptions")
        .update({
          pending_plan_id: newPlanId,
          pending_effective_at: null, // will be set by next billing cycle
        } as any)
        .eq("id", subscriptionId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["subscription"] }),
  });
}
