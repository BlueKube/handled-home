import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Subscription } from "./useSubscription";

export function useAdminSubscriptions(filters?: { status?: string; search?: string }) {
  return useQuery({
    queryKey: ["admin_subscriptions", filters],
    queryFn: async () => {
      let query = supabase
        .from("subscriptions")
        .select("*")
        .order("created_at", { ascending: false });

      if (filters?.status && filters.status !== "all") {
        query = query.eq("status", filters.status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Subscription[];
    },
  });
}

export function useAdminSubscriptionDetail(subscriptionId: string | null) {
  return useQuery({
    queryKey: ["admin_subscription_detail", subscriptionId],
    enabled: !!subscriptionId,
    queryFn: async () => {
      const [subResult, eventsResult] = await Promise.all([
        supabase.from("subscriptions").select("*").eq("id", subscriptionId!).single(),
        supabase.from("subscription_events").select("*").eq("subscription_id", subscriptionId!).order("created_at", { ascending: false }),
      ]);
      if (subResult.error) throw subResult.error;
      return {
        subscription: subResult.data as Subscription,
        events: (eventsResult.data ?? []) as Array<{
          id: string;
          subscription_id: string;
          source: string;
          event_type: string;
          payload: any;
          created_at: string;
        }>,
      };
    },
  });
}

export function useAdminForceCancel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ subscriptionId, reason, adminUserId }: { subscriptionId: string; reason: string; adminUserId: string }) => {
      // Update subscription
      const { error } = await supabase
        .from("subscriptions")
        .update({ status: "canceled", cancel_at_period_end: false } as any)
        .eq("id", subscriptionId);
      if (error) throw error;

      // Write audit log
      await supabase.from("admin_audit_log").insert({
        admin_user_id: adminUserId,
        action: "force_cancel",
        entity_type: "subscription",
        entity_id: subscriptionId,
        reason,
      } as any);

      // Write subscription event
      await supabase.from("subscription_events").insert({
        subscription_id: subscriptionId,
        source: "admin",
        event_type: "force_canceled",
        payload: { reason },
      } as any);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin_subscriptions"] });
      qc.invalidateQueries({ queryKey: ["admin_subscription_detail"] });
    },
  });
}

export function useAdminMarkComped() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ subscriptionId, reason, adminUserId }: { subscriptionId: string; reason: string; adminUserId: string }) => {
      const { error } = await supabase
        .from("subscriptions")
        .update({ status: "active" } as any)
        .eq("id", subscriptionId);
      if (error) throw error;

      await supabase.from("admin_audit_log").insert({
        admin_user_id: adminUserId,
        action: "mark_comped",
        entity_type: "subscription",
        entity_id: subscriptionId,
        reason,
      } as any);

      await supabase.from("subscription_events").insert({
        subscription_id: subscriptionId,
        source: "admin",
        event_type: "comped",
        payload: { reason },
      } as any);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin_subscriptions"] });
      qc.invalidateQueries({ queryKey: ["admin_subscription_detail"] });
    },
  });
}
