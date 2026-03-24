import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const DUNNING_STEPS = [
  "retry_1",
  "retry_2",
  "retry_3",
  "grace_start",
  "grace_end",
  "suspended",
  "canceled",
] as const;

export type DunningStep = typeof DUNNING_STEPS[number];

export const DUNNING_TIMELINE: Record<DunningStep, { dayOffset: number; label: string }> = {
  retry_1: { dayOffset: 3, label: "First retry" },
  retry_2: { dayOffset: 7, label: "Second retry" },
  retry_3: { dayOffset: 10, label: "Third retry" },
  grace_start: { dayOffset: 0, label: "Grace period starts" },
  grace_end: { dayOffset: 14, label: "Grace period ends" },
  suspended: { dayOffset: 14, label: "Service suspended" },
  canceled: { dayOffset: 30, label: "Auto-canceled" },
};

export interface DunningTimelineEntry {
  step: DunningStep;
  date: Date;
  label: string;
  isPast: boolean;
}

export function computeDunningTimeline(failureDate: Date): DunningTimelineEntry[] {
  const now = new Date();
  return DUNNING_STEPS.map((step) => {
    const { dayOffset, label } = DUNNING_TIMELINE[step];
    const date = new Date(failureDate.getTime() + dayOffset * 24 * 60 * 60 * 1000);
    return { step, date, label, isPast: date <= now };
  });
}

export interface DunningEvent {
  id: string;
  subscription_id: string;
  customer_id: string;
  step: number;
  action: string;
  result: string;
  explain_customer: string | null;
  explain_admin: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

/** Admin: fetch dunning events, optionally filtered */
export function useDunningEventsAdmin(filters: { subscriptionId?: string; limit?: number } = {}) {
  return useQuery({
    queryKey: ["dunning-events-admin", filters.subscriptionId],
    queryFn: async () => {
      let query = supabase
        .from("dunning_events")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(filters.limit ?? 100);

      if (filters.subscriptionId) query = query.eq("subscription_id", filters.subscriptionId);

      const { data, error } = await query;
      if (error) throw error;
      return data as DunningEvent[];
    },
  });
}

/** Customer: fetch own dunning events */
export function useDunningEventsCustomer() {
  return useQuery({
    queryKey: ["dunning-events-customer"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dunning_events")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      return data as DunningEvent[];
    },
  });
}
