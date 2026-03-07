import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ZoneHealthRollingRow {
  zone_id: string;
  zone_name: string;
  jobs_today: number;
  total_jobs_7d: number;
  completed_jobs_7d: number;
  unassigned_locked: number;
  issue_count_7d: number;
  redo_count_7d: number;
  proof_missing_rate: number;
  exception_count_7d: number;
  open_exceptions: number;
  reschedule_count_7d: number;
  reschedule_rate: number;
  avg_stop_minutes: number;
}

export function useZoneHealthRolling(daysBack: number = 7) {
  return useQuery<ZoneHealthRollingRow[]>({
    queryKey: ["zone-health-rolling", daysBack],
    queryFn: async () => {
      const { data, error } = await supabase.rpc(
        "get_zone_health_rolling" as any,
        { p_days: daysBack } as any
      );
      if (error) throw error;
      return (data as unknown as ZoneHealthRollingRow[]) ?? [];
    },
    staleTime: 60_000,
    refetchInterval: 60_000,
  });
}
