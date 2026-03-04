import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarClock, AlertTriangle, Clock, Home } from "lucide-react";
import { format, parseISO, addDays } from "date-fns";

interface SchedulingException {
  id: string;
  scheduled_date: string;
  schedule_state: string;
  scheduling_profile: string | null;
  time_window_start: string | null;
  time_window_end: string | null;
  due_status: string | null;
  service_week_end: string | null;
  customer_window_preference: string | null;
  properties?: { street_address: string; city: string } | null;
}

import { formatTime12 } from "@/lib/formatTime12";

export default function SchedulingExceptions() {
  const today = new Date();
  const horizon = format(addDays(today, 7), "yyyy-MM-dd");
  const todayStr = format(today, "yyyy-MM-dd");

  // Unbooked home-required: appointment_window profile with no time_window_start
  const { data: unbooked, isLoading: loadingUnbooked } = useQuery({
    queryKey: ["sched_exceptions_unbooked", todayStr],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("visits")
        .select("id, scheduled_date, schedule_state, scheduling_profile, time_window_start, time_window_end, customer_window_preference, properties(street_address, city)")
        .eq("scheduling_profile", "appointment_window")
        .is("time_window_start", null)
        .in("schedule_state", ["planning", "scheduled", "dispatched"] as any)
        .gte("scheduled_date", todayStr)
        .lte("scheduled_date", horizon)
        .order("scheduled_date")
        .limit(50);
      if (error) throw error;
      return data as unknown as SchedulingException[];
    },
  });

  // Window infeasible: visits with time windows that have exception_pending state
  const { data: infeasible, isLoading: loadingInfeasible } = useQuery({
    queryKey: ["sched_exceptions_infeasible", todayStr],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("visits")
        .select("id, scheduled_date, schedule_state, scheduling_profile, time_window_start, time_window_end, due_status, service_week_end, properties(street_address, city)")
        .eq("schedule_state", "exception_pending")
        .not("time_window_start", "is", null)
        .gte("scheduled_date", todayStr)
        .lte("scheduled_date", horizon)
        .order("scheduled_date")
        .limit(50);
      if (error) throw error;
      return data as unknown as SchedulingException[];
    },
  });

  // Overdue service-week visits
  const { data: overdue, isLoading: loadingOverdue } = useQuery({
    queryKey: ["sched_exceptions_overdue", todayStr],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("visits")
        .select("id, scheduled_date, schedule_state, scheduling_profile, time_window_start, time_window_end, due_status, service_week_end, properties(street_address, city)")
        .eq("due_status", "overdue")
        .in("schedule_state", ["scheduled", "dispatched", "in_progress"] as any)
        .order("service_week_end")
        .limit(50);
      if (error) throw error;
      return data as unknown as SchedulingException[];
    },
  });

  const isLoading = loadingUnbooked || loadingInfeasible || loadingOverdue;

  return (
    <div className="p-4 md:p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-h2">Scheduling Exceptions</h1>
        <p className="text-sm text-muted-foreground">Unbooked demand, window conflicts, and overdue visits (next 7 days)</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
      ) : (
        <>
          {/* Unbooked home-required */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Home className="h-4 w-4 text-primary" />
                Unbooked Home-Required ({unbooked?.length ?? 0})
              </CardTitle>
              <p className="text-xs text-muted-foreground">Appointment-window visits without a confirmed time window</p>
            </CardHeader>
            <CardContent>
              {!unbooked?.length ? (
                <p className="text-xs text-muted-foreground py-4 text-center">None — all home-required visits have windows</p>
              ) : (
                <div className="space-y-2">
                  {unbooked.map((v) => (
                    <div key={v.id} className="flex items-center justify-between p-2 rounded-lg border bg-muted/30">
                      <div>
                        <p className="text-sm font-medium">
                          {v.properties?.street_address ?? "Unknown"}, {v.properties?.city ?? ""}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(parseISO(v.scheduled_date), "EEE, MMM d")}
                          {v.customer_window_preference && ` • Prefers: ${v.customer_window_preference}`}
                        </p>
                      </div>
                      <Badge variant="secondary" className="text-[10px]">No window</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Window infeasible */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                Window Infeasible ({infeasible?.length ?? 0})
              </CardTitle>
              <p className="text-xs text-muted-foreground">Visits with time windows that can't be honored</p>
            </CardHeader>
            <CardContent>
              {!infeasible?.length ? (
                <p className="text-xs text-muted-foreground py-4 text-center">None — all windows are feasible</p>
              ) : (
                <div className="space-y-2">
                  {infeasible.map((v) => (
                    <div key={v.id} className="flex items-center justify-between p-2 rounded-lg border bg-destructive/5">
                      <div>
                        <p className="text-sm font-medium">
                          {v.properties?.street_address ?? "Unknown"}, {v.properties?.city ?? ""}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(parseISO(v.scheduled_date), "EEE, MMM d")}
                          {v.time_window_start && v.time_window_end && (
                            <> • {formatTime12(v.time_window_start)}–{formatTime12(v.time_window_end)}</>
                          )}
                        </p>
                      </div>
                      <Badge variant="destructive" className="text-[10px]">Exception</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Overdue */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-500" />
                Overdue Service-Week ({overdue?.length ?? 0})
              </CardTitle>
              <p className="text-xs text-muted-foreground">Service-week visits past their due date</p>
            </CardHeader>
            <CardContent>
              {!overdue?.length ? (
                <p className="text-xs text-muted-foreground py-4 text-center">None — all service-week visits are on track</p>
              ) : (
                <div className="space-y-2">
                  {overdue.map((v) => (
                    <div key={v.id} className="flex items-center justify-between p-2 rounded-lg border bg-amber-50 dark:bg-amber-950/20">
                      <div>
                        <p className="text-sm font-medium">
                          {v.properties?.street_address ?? "Unknown"}, {v.properties?.city ?? ""}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Due by {v.service_week_end ? format(parseISO(v.service_week_end), "EEE, MMM d") : "N/A"}
                        </p>
                      </div>
                      <Badge variant="secondary" className="text-[10px] bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">Overdue</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
