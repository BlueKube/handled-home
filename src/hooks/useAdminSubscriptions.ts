import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Subscription } from "./useSubscription";

export interface AdminSubscriptionRow extends Subscription {
  customer_name?: string;
  plan_name?: string;
}

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
      const subs = data as Subscription[];

      // Batch fetch profiles and plans for display
      const customerIds = [...new Set(subs.map((s) => s.customer_id))];
      const planIds = [...new Set(subs.map((s) => s.plan_id))];

      const [profilesRes, plansRes] = await Promise.all([
        customerIds.length > 0
          ? supabase.from("profiles").select("user_id, full_name").in("user_id", customerIds)
          : { data: [] },
        planIds.length > 0
          ? supabase.from("plans").select("id, name").in("id", planIds)
          : { data: [] },
      ]);

      const profileMap = new Map((profilesRes.data ?? []).map((p: any) => [p.user_id, p.full_name]));
      const planMap = new Map((plansRes.data ?? []).map((p: any) => [p.id, p.name]));

      const enriched: AdminSubscriptionRow[] = subs.map((s) => ({
        ...s,
        customer_name: profileMap.get(s.customer_id) ?? undefined,
        plan_name: planMap.get(s.plan_id) ?? undefined,
      }));

      // Client-side search filter
      if (filters?.search) {
        const q = filters.search.toLowerCase();
        return enriched.filter((s) =>
          (s.customer_name?.toLowerCase().includes(q)) ||
          (s.plan_name?.toLowerCase().includes(q)) ||
          s.customer_id.toLowerCase().includes(q)
        );
      }

      return enriched;
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

      // Fetch customer name
      const sub = subResult.data as Subscription;
      const { data: profile } = await supabase.from("profiles").select("full_name").eq("user_id", sub.customer_id).maybeSingle();

      return {
        subscription: sub,
        customer_name: (profile as any)?.full_name ?? null,
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
      const { error } = await supabase
        .from("subscriptions")
        .update({ status: "canceled", cancel_at_period_end: false } as any)
        .eq("id", subscriptionId);
      if (error) throw error;

      await supabase.from("admin_audit_log").insert({
        admin_user_id: adminUserId,
        action: "force_cancel",
        entity_type: "subscription",
        entity_id: subscriptionId,
        reason,
      } as any);

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
