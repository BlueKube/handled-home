import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ServiceDayCapacity {
  id: string;
  zone_id: string;
  day_of_week: string;
  service_window: string;
  max_homes: number;
  buffer_percent: number;
  assigned_count: number;
  updated_at: string;
}

export function useServiceDayCapacity(zoneId: string | null) {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["service-day-capacity", zoneId],
    enabled: !!zoneId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("zone_service_day_capacity")
        .select("*")
        .eq("zone_id", zoneId!)
        .order("day_of_week");
      if (error) throw error;
      return (data ?? []) as ServiceDayCapacity[];
    },
  });

  const upsertCapacity = useMutation({
    mutationFn: async (cap: Omit<ServiceDayCapacity, "id" | "updated_at" | "assigned_count"> & { id?: string }) => {
      const { error } = await supabase
        .from("zone_service_day_capacity")
        .upsert(
          {
            zone_id: cap.zone_id,
            day_of_week: cap.day_of_week,
            service_window: cap.service_window,
            max_homes: cap.max_homes,
            buffer_percent: cap.buffer_percent,
          } as any,
          { onConflict: "zone_id,day_of_week,service_window" }
        );
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["service-day-capacity", zoneId] }),
  });

  const deleteCapacity = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("zone_service_day_capacity")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["service-day-capacity", zoneId] }),
  });

  return {
    capacities: query.data ?? [],
    isLoading: query.isLoading,
    upsertCapacity,
    deleteCapacity,
  };
}
