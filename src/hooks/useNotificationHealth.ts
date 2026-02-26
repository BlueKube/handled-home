import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface NotificationHealthSummary {
  sent_24h: number;
  failed_24h: number;
  suppressed_24h: number;
  queued_24h: number;
  deadletter_total: number;
  pending_total: number;
  processing_total: number;
  avg_latency_minutes: number;
  last_run_at: string | null;
  last_run_status: string | null;
}

export interface DeliveryDaily {
  delivery_date: string;
  channel: string;
  status: string;
  count: number;
}

export interface Deadletter {
  id: string;
  event_type: string;
  audience_type: string;
  audience_user_id: string | null;
  audience_zone_id: string | null;
  priority: string;
  attempt_count: number;
  last_error: string | null;
  created_at: string;
  payload: Record<string, unknown>;
}

export function useNotificationHealth() {
  const summary = useQuery({
    queryKey: ["notification-health-summary"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notification_health_summary" as any)
        .select("*")
        .single();
      if (error) throw error;
      return data as unknown as NotificationHealthSummary;
    },
    refetchInterval: 30_000,
  });

  const dailyBreakdown = useQuery({
    queryKey: ["notification-delivery-daily"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notification_delivery_daily" as any)
        .select("*");
      if (error) throw error;
      return (data ?? []) as unknown as DeliveryDaily[];
    },
    refetchInterval: 60_000,
  });

  const deadletters = useQuery({
    queryKey: ["notification-deadletters"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notification_deadletters" as any)
        .select("*")
        .limit(50);
      if (error) throw error;
      return (data ?? []) as unknown as Deadletter[];
    },
    refetchInterval: 60_000,
  });

  return {
    summary: summary.data,
    isSummaryLoading: summary.isLoading,
    dailyBreakdown: dailyBreakdown.data ?? [],
    isDailyLoading: dailyBreakdown.isLoading,
    deadletters: deadletters.data ?? [],
    isDeadlettersLoading: deadletters.isLoading,
  };
}
