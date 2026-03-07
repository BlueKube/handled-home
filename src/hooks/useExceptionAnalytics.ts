import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ExceptionAnalyticsData {
  period_days: number;
  total_exceptions: number;
  resolved_exceptions: number;
  open_exceptions: number;
  resolution_rate: number;
  avg_resolve_hours: number;
  break_freeze_count: number;
  by_type: Array<{
    exception_type: string;
    count: number;
    resolved_count: number;
    avg_resolve_hours: number;
  }>;
  by_zone: Array<{
    zone_id: string | null;
    zone_name: string | null;
    count: number;
    resolved_count: number;
  }>;
  by_severity: Array<{
    severity: string;
    count: number;
  }>;
  resolution_types: Array<{
    resolution_type: string;
    count: number;
  }>;
}

export function useExceptionAnalytics(daysBack: number = 30, zoneId?: string) {
  return useQuery<ExceptionAnalyticsData>({
    queryKey: ["exception-analytics", daysBack, zoneId],
    queryFn: async () => {
      const params: Record<string, unknown> = { p_days_back: daysBack };
      if (zoneId) params.p_zone_id = zoneId;

      const { data, error } = await supabase.rpc(
        "get_exception_analytics" as any,
        params as any
      );
      if (error) throw error;
      return data as unknown as ExceptionAnalyticsData;
    },
    staleTime: 60_000,
  });
}
