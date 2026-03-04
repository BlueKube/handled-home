import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProviderOrg } from "@/hooks/useProviderOrg";

export interface DayPlanStop {
  visitId: string;
  propertyId: string;
  routeOrder: number | null;
  stopDurationMinutes: number | null;
  plannedArrivalTime: string | null;
  etaRangeStart: string | null;
  etaRangeEnd: string | null;
  equipmentRequired: string[];
  scheduleState: string;
  property: {
    street_address: string;
    city: string;
    lat: number | null;
    lng: number | null;
  } | null;
  tasks: {
    id: string;
    skuId: string;
    skuName: string | null;
    durationMinutes: number | null;
    status: string;
  }[];
}

export interface DayPlan {
  date: string;
  stops: DayPlanStop[];
  allEquipment: string[];
  totalServiceMinutes: number;
  totalStops: number;
}

export function useProviderDayPlan(date?: string) {
  const { org } = useProviderOrg();
  const targetDate = date ?? new Date().toISOString().split("T")[0];

  return useQuery({
    queryKey: ["provider-day-plan", org?.id, targetDate],
    queryFn: async (): Promise<DayPlan> => {
      // Fetch visits for this provider on this date
      const { data: visits, error: vErr } = await supabase
        .from("visits")
        .select(`
          id,
          property_id,
          route_order,
          stop_duration_minutes,
          planned_arrival_time,
          eta_range_start,
          eta_range_end,
          equipment_required,
          schedule_state,
          property:properties!visits_property_id_fkey(street_address, city, lat, lng)
        `)
        .eq("provider_org_id", org!.id)
        .eq("scheduled_date", targetDate)
        .not("schedule_state", "eq", "canceled")
        .order("route_order", { ascending: true, nullsFirst: false });

      if (vErr) throw vErr;

      const visitIds = (visits ?? []).map((v: any) => v.id);
      let tasksMap = new Map<string, any[]>();

      if (visitIds.length > 0) {
        // Batch fetch visit_tasks
        for (let i = 0; i < visitIds.length; i += 500) {
          const chunk = visitIds.slice(i, i + 500);
          const { data: tasks, error: tErr } = await supabase
            .from("visit_tasks")
            .select(`
              id,
              visit_id,
              sku_id,
              duration_estimate_minutes,
              status,
              sku:service_skus!visit_tasks_sku_id_fkey(name)
            `)
            .in("visit_id", chunk)
            .not("status", "eq", "canceled");

          if (tErr) throw tErr;
          for (const t of tasks ?? []) {
            const list = tasksMap.get(t.visit_id) ?? [];
            list.push(t);
            tasksMap.set(t.visit_id, list);
          }
        }
      }

      const equipmentSet = new Set<string>();
      let totalServiceMinutes = 0;

      const stops: DayPlanStop[] = (visits ?? []).map((v: any) => {
        const tasks = tasksMap.get(v.id) ?? [];
        const eq = v.equipment_required ?? [];
        for (const e of eq) equipmentSet.add(e);

        const stopDur = v.stop_duration_minutes ?? 0;
        totalServiceMinutes += stopDur;

        return {
          visitId: v.id,
          propertyId: v.property_id,
          routeOrder: v.route_order,
          stopDurationMinutes: v.stop_duration_minutes,
          plannedArrivalTime: v.planned_arrival_time,
          etaRangeStart: v.eta_range_start,
          etaRangeEnd: v.eta_range_end,
          equipmentRequired: eq,
          scheduleState: v.schedule_state,
          property: v.property,
          tasks: tasks.map((t: any) => ({
            id: t.id,
            skuId: t.sku_id,
            skuName: (t.sku as any)?.name ?? null,
            durationMinutes: t.duration_estimate_minutes,
            status: t.status,
          })),
        };
      });

      return {
        date: targetDate,
        stops,
        allEquipment: [...equipmentSet].sort(),
        totalServiceMinutes,
        totalStops: stops.length,
      };
    },
    enabled: !!org?.id,
  });
}
