import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
