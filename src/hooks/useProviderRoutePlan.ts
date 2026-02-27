import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProviderOrg } from "@/hooks/useProviderOrg";
import { useProviderJobs } from "@/hooks/useProviderJobs";

interface RoutePlan {
  id: string;
  provider_org_id: string;
  plan_date: string;
  total_stops: number;
  est_drive_minutes: number;
  est_work_minutes: number;
  projected_earnings_cents: number;
  locked_at: string | null;
  created_at: string;
  updated_at: string;
}

export function useProviderRoutePlan() {
  const { org } = useProviderOrg();
  const queryClient = useQueryClient();
  const today = new Date().toISOString().split("T")[0];

  const { data: todayJobs } = useProviderJobs("today");

  const planQuery = useQuery({
    queryKey: ["provider_route_plan", org?.id, today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("provider_route_plans")
        .select("*")
        .eq("provider_org_id", org!.id)
        .eq("plan_date", today)
        .maybeSingle();
      if (error) throw error;
      return data as RoutePlan | null;
    },
    enabled: !!org?.id,
  });

  // Compute live projections from jobs when no locked plan exists
  const liveStats = {
    totalStops: todayJobs?.length ?? 0,
    estWorkMinutes: todayJobs?.reduce(
      (sum, job) =>
        sum + (job.job_skus?.reduce((s, sku) => s + (sku.duration_minutes_snapshot ?? 0), 0) ?? 0),
      0
    ) ?? 0,
    estDriveMinutes: Math.max(0, ((todayJobs?.length ?? 0) - 1)) * 8,
  };

  const plan = planQuery.data;
  const isLocked = !!plan?.locked_at;

  const lockMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc("lock_provider_route", {
        p_provider_org_id: org!.id,
        p_date: today,
      });
      if (error) throw error;
      return data as { locked: boolean; total_stops: number; est_drive_minutes: number; est_work_minutes: number; projected_earnings_cents: number };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["provider_route_plan"] });
    },
  });

  return {
    plan,
    isLocked,
    isLoading: planQuery.isLoading,
    totalStops: isLocked ? (plan?.total_stops ?? 0) : liveStats.totalStops,
    estWorkMinutes: isLocked ? (plan?.est_work_minutes ?? 0) : liveStats.estWorkMinutes,
    estDriveMinutes: isLocked ? (plan?.est_drive_minutes ?? 0) : liveStats.estDriveMinutes,
    projectedEarningsCents: plan?.projected_earnings_cents ?? 0,
    lockRoute: lockMutation.mutate,
    isLocking: lockMutation.isPending,
    lockError: lockMutation.error,
  };
}
