import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProviderOrg } from "@/hooks/useProviderOrg";
import { startOfWeek, endOfWeek, addDays, format } from "date-fns";

export interface ProviderVisit {
  id: string;
  property_id: string;
  provider_org_id: string | null;
  scheduled_date: string;
  schedule_state: string;
  plan_window: string | null;
  route_order: number | null;
  stop_duration_minutes: number | null;
  time_window_start: string | null;
  time_window_end: string | null;
  eta_range_start: string | null;
  eta_range_end: string | null;
  scheduling_profile: string | null;
  service_week_start: string | null;
  service_week_end: string | null;
  due_status: string | null;
  piggybacked_onto_visit_id: string | null;
  equipment_required: string[];
  created_at: string;
  properties?: {
    street_address: string;
    city: string;
    zip_code: string;
    lat: number | null;
    lng: number | null;
  };
  visit_tasks?: {
    id: string;
    sku_id: string;
    duration_estimate_minutes: number;
    presence_required: boolean;
    status: string;
    service_skus?: { name: string; category: string | null } | null;
  }[];
}

const ACTIVE_STATES = ["scheduled", "dispatched", "in_progress"] as const;

export function useProviderVisits(filter: "today" | "upcoming" | "week") {
  const { org } = useProviderOrg();

  return useQuery({
    queryKey: ["provider_visits", org?.id, filter],
    queryFn: async () => {
      if (!org) return [];

      const today = new Date();
      const todayStr = format(today, "yyyy-MM-dd");

      let query = supabase
        .from("visits")
        .select(`
          id, property_id, provider_org_id, scheduled_date, schedule_state, plan_window,
          route_order, stop_duration_minutes, time_window_start, time_window_end,
          eta_range_start, eta_range_end, scheduling_profile, service_week_start,
          service_week_end, due_status, piggybacked_onto_visit_id, equipment_required, created_at,
          properties(street_address, city, zip_code, lat, lng),
          visit_tasks(id, sku_id, duration_estimate_minutes, presence_required, status,
            service_skus(name, category))
        `)
        .eq("provider_org_id", org.id)
        .in("schedule_state", ACTIVE_STATES);

      if (filter === "today") {
        query = query.eq("scheduled_date", todayStr);
      } else if (filter === "upcoming") {
        query = query.gt("scheduled_date", todayStr);
      } else if (filter === "week") {
        // Current week Mon–Sun
        const weekStart = format(startOfWeek(today, { weekStartsOn: 1 }), "yyyy-MM-dd");
        const weekEnd = format(endOfWeek(today, { weekStartsOn: 1 }), "yyyy-MM-dd");
        query = query.gte("scheduled_date", weekStart).lte("scheduled_date", weekEnd);
      }

      query = query
        .order("scheduled_date", { ascending: true })
        .order("route_order", { ascending: true, nullsFirst: false });

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as unknown as ProviderVisit[];
    },
    enabled: !!org?.id,
  });
}

/** Returns visits that are due_soon or overdue for the current service week.
 * Prefer passing pre-filtered data from useProviderVisits("week") to WeekDueQueue
 * to avoid redundant fetches. This hook is kept for standalone usage. */
export function useProviderDueQueue() {
  const { org } = useProviderOrg();

  return useQuery({
    queryKey: ["provider_due_queue", org?.id],
    queryFn: async () => {
      if (!org) return [];

      const { data, error } = await supabase
        .from("visits")
        .select(`
          id, property_id, provider_org_id, scheduled_date, schedule_state, plan_window,
          route_order, stop_duration_minutes, time_window_start, time_window_end,
          scheduling_profile, service_week_start, service_week_end, due_status,
          piggybacked_onto_visit_id, equipment_required, created_at,
          properties(street_address, city, zip_code, lat, lng),
          visit_tasks(id, sku_id, duration_estimate_minutes, presence_required, status,
            service_skus(name, category))
        `)
        .eq("provider_org_id", org.id)
        .in("schedule_state", ACTIVE_STATES)
        .in("due_status", ["due_soon", "overdue"])
        .order("due_status", { ascending: false })
        .order("service_week_end", { ascending: true });

      if (error) throw error;
      return (data ?? []) as unknown as ProviderVisit[];
    },
    enabled: !!org?.id,
  });
}
