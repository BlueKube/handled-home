import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProviderOrg } from "@/hooks/useProviderOrg";

export interface HealthSnapshot {
  id: string;
  snapshot_date: string;
  completed_jobs: number | null;
  issue_rate: number | null;
  proof_compliance: number | null;
  avg_time_on_site_minutes: number | null;
  metadata: Record<string, unknown> | null;
}

export interface PerformanceMetrics {
  /** Last 30 days of health snapshots, newest first */
  snapshots: HealthSnapshot[];
  /** Aggregate stats computed from recent jobs */
  jobStats: {
    totalCompleted: number;
    totalCanceled: number;
    avgCompletionMinutes: number | null;
    onTimeRate: number | null;
    redoCount: number;
  };
  /** Enforcement actions (warnings, restrictions) */
  enforcements: { id: string; action_type: string; reason: string | null; created_at: string }[];
}

export function useProviderPerformance() {
  const { org } = useProviderOrg();

  return useQuery({
    queryKey: ["provider-performance", org?.id],
    queryFn: async (): Promise<PerformanceMetrics> => {
      if (!org) throw new Error("No org");

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const cutoff = thirtyDaysAgo.toISOString().split("T")[0];

      const [snapshotsRes, jobsRes, enforcementsRes, issuesRes] = await Promise.all([
        supabase
          .from("provider_health_snapshots")
          .select("id, snapshot_date, completed_jobs, issue_rate, proof_compliance, avg_time_on_site_minutes, metadata")
          .eq("provider_org_id", org.id)
          .gte("snapshot_date", cutoff)
          .order("snapshot_date", { ascending: false }),
        supabase
          .from("jobs")
          .select("id, status, scheduled_date, arrived_at, started_at, completed_at")
          .eq("provider_org_id", org.id)
          .gte("scheduled_date", cutoff),
        supabase
          .from("provider_enforcement_actions")
          .select("id, action_type, reason, created_at")
          .eq("provider_org_id", org.id)
          .order("created_at", { ascending: false })
          .limit(10),
        supabase
          .from("job_issues")
          .select("id, job_id, issue_type, severity, status, created_at")
          .gte("created_at", new Date(cutoff).toISOString())
          .limit(500),
      ]);

      if (snapshotsRes.error) throw snapshotsRes.error;
      if (jobsRes.error) throw jobsRes.error;
      if (enforcementsRes.error) throw enforcementsRes.error;

      const jobs = jobsRes.data ?? [];
      const completed = jobs.filter((j) => j.status === "COMPLETED");
      const canceled = jobs.filter((j) => j.status === "CANCELED");

      // Calculate avg completion time (arrived → completed)
      const completionTimes = completed
        .filter((j) => j.arrived_at && j.completed_at)
        .map((j) => (new Date(j.completed_at!).getTime() - new Date(j.arrived_at!).getTime()) / 60000);
      const avgCompletionMinutes =
        completionTimes.length > 0
          ? Math.round(completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length)
          : null;

      // Redo count: jobs with issue_type = 'redo_required'
      const orgJobIds = new Set(jobs.map((j) => j.id));
      const redoCount = (issuesRes.data ?? []).filter(
        (issue) => orgJobIds.has(issue.job_id) && issue.issue_type === "redo_required"
      ).length;

      // On-time rate: arrived within scheduled date (simple: arrived_at on same day as scheduled_date)
      const jobsWithArrival = completed.filter((j) => j.arrived_at && j.scheduled_date);
      const onTimeCount = jobsWithArrival.filter((j) => {
        const arrivedDate = new Date(j.arrived_at!).toISOString().split("T")[0];
        return arrivedDate === j.scheduled_date;
      }).length;
      const onTimeRate = jobsWithArrival.length > 0 ? Math.round((onTimeCount / jobsWithArrival.length) * 100) : null;

      return {
        snapshots: (snapshotsRes.data ?? []) as HealthSnapshot[],
        jobStats: {
          totalCompleted: completed.length,
          totalCanceled: canceled.length,
          avgCompletionMinutes,
          onTimeRate,
          redoCount,
        },
        enforcements: enforcementsRes.data ?? [],
      };
    },
    enabled: !!org?.id,
  });
}
