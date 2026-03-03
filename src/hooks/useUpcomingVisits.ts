import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProperty } from "@/hooks/useProperty";
import type { Database } from "@/integrations/supabase/types";

type VisitScheduleState = Database["public"]["Enums"]["visit_schedule_state"];

export interface VisitTask {
  id: string;
  sku_id: string;
  status: string;
  duration_estimate_minutes: number;
  presence_required: boolean;
  notes: string | null;
  sku_name?: string;
}

export interface UpcomingVisit {
  id: string;
  scheduled_date: string;
  schedule_state: VisitScheduleState;
  eta_range_start: string | null;
  eta_range_end: string | null;
  time_window_start: string | null;
  time_window_end: string | null;
  provider_org_id: string | null;
  created_at: string;
  tasks: VisitTask[];
}

/** Calm customer-facing labels for each schedule state */
export const SCHEDULE_STATE_LABELS: Record<VisitScheduleState, string> = {
  planning: "Planning",
  scheduled: "Scheduled",
  dispatched: "Today",
  in_progress: "In Progress",
  complete: "Complete",
  exception_pending: "Needs Attention",
  canceled: "Canceled",
  rescheduled: "Rescheduled",
};

/** Semantic pill styles per state */
export const SCHEDULE_STATE_STYLES: Record<VisitScheduleState, { pill: string; dot: string }> = {
  planning: { pill: "bg-muted text-muted-foreground", dot: "bg-muted-foreground" },
  scheduled: { pill: "bg-primary/10 text-primary", dot: "bg-primary" },
  dispatched: { pill: "bg-accent/10 text-accent", dot: "bg-accent" },
  in_progress: { pill: "bg-warning/10 text-warning", dot: "bg-warning" },
  complete: { pill: "bg-success/10 text-success", dot: "bg-success" },
  exception_pending: { pill: "bg-destructive/10 text-destructive", dot: "bg-destructive" },
  canceled: { pill: "bg-muted text-muted-foreground", dot: "bg-muted-foreground" },
  rescheduled: { pill: "bg-secondary text-secondary-foreground", dot: "bg-secondary-foreground" },
};

/** States that count as "upcoming" (not complete/canceled) */
const UPCOMING_STATES: VisitScheduleState[] = [
  "planning",
  "scheduled",
  "dispatched",
  "in_progress",
  "exception_pending",
  "rescheduled",
];

export function useUpcomingVisits() {
  const { property } = useProperty();

  return useQuery<UpcomingVisit[]>({
    queryKey: ["upcoming_visits", property?.id],
    enabled: !!property?.id,
    queryFn: async () => {
      if (!property?.id) return [];

      // Fetch visits for customer's property in upcoming states
      const { data: visits, error } = await supabase
        .from("visits")
        .select("id, scheduled_date, schedule_state, eta_range_start, eta_range_end, time_window_start, time_window_end, provider_org_id, created_at")
        .eq("property_id", property.id)
        .in("schedule_state", UPCOMING_STATES)
        .order("scheduled_date", { ascending: true })
        .limit(20);

      if (error) throw error;
      if (!visits || visits.length === 0) return [];

      // Batch fetch tasks for all visits
      const visitIds = visits.map((v) => v.id);
      const { data: tasks, error: taskErr } = await supabase
        .from("visit_tasks")
        .select("id, visit_id, sku_id, status, duration_estimate_minutes, presence_required, notes, service_skus(name)")
        .in("visit_id", visitIds);

      if (taskErr) throw taskErr;

      // Group tasks by visit
      const tasksByVisit = new Map<string, VisitTask[]>();
      for (const t of tasks ?? []) {
        const arr = tasksByVisit.get(t.visit_id) ?? [];
        arr.push({
          id: t.id,
          sku_id: t.sku_id,
          status: t.status,
          duration_estimate_minutes: t.duration_estimate_minutes,
          presence_required: t.presence_required,
          notes: t.notes,
          sku_name: (t.service_skus as any)?.name ?? undefined,
        });
        tasksByVisit.set(t.visit_id, arr);
      }

      return visits.map((v) => ({
        ...v,
        tasks: tasksByVisit.get(v.id) ?? [],
      }));
    },
  });
}
