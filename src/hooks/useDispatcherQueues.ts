import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

export interface QueueJob {
  id: string;
  scheduled_date: string | null;
  status: string;
  customer_id: string;
  property_id: string;
  provider_org_id: string;
  zone_id: string;
  created_at: string;
  updated_at: string;
  arrived_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  provider_summary: string | null;
  // joined
  property_address?: string;
  zone_name?: string;
  provider_name?: string;
}

export interface QueueIssue {
  id: string;
  job_id: string;
  issue_type: string;
  severity: string;
  status: string;
  description: string | null;
  created_at: string;
  created_by_role: string;
}

export interface DispatcherQueues {
  atRisk: QueueJob[];
  missingProof: QueueJob[];
  unassigned: QueueJob[];
  customerIssues: QueueIssue[];
  providerIncidents: QueueIssue[];
  coverageGaps: { zone_id: string; zone_name: string; gap_count: number }[];
}

export function useDispatcherQueues() {
  return useQuery({
    queryKey: ["dispatcher-queues"],
    queryFn: async (): Promise<DispatcherQueues> => {
      const today = todayStr();

      const [
        atRiskRes,
        missingProofRes,
        unassignedRes,
        customerIssuesRes,
        providerIncidentsRes,
        zonesRes,
      ] = await Promise.all([
        // At Risk: today's jobs not completed and in issue/late states
        supabase
          .from("jobs")
          .select("*")
          .eq("scheduled_date", today)
          .in("status", ["issue", "ISSUE", "in_progress", "IN_PROGRESS", "scheduled", "SCHEDULED"])
          .order("updated_at", { ascending: false })
          .limit(50),

        // Missing Proof: completed today but need to check photos
        supabase
          .from("jobs")
          .select("*")
          .eq("scheduled_date", today)
          .in("status", ["completed", "COMPLETED"])
          .order("completed_at", { ascending: false })
          .limit(100),

        // Unassigned: scheduled but no provider
        supabase
          .from("jobs")
          .select("*")
          .eq("scheduled_date", today)
          .or("provider_org_id.is.null")
          .in("status", ["pending", "PENDING", "scheduled", "SCHEDULED"])
          .order("created_at", { ascending: true })
          .limit(50),

        // Customer issues (open, recent)
        supabase
          .from("job_issues")
          .select("*")
          .in("status", ["open", "OPEN"])
          .eq("created_by_role", "customer")
          .order("created_at", { ascending: false })
          .limit(50),

        // Provider incidents (open, recent)
        supabase
          .from("job_issues")
          .select("*")
          .in("status", ["open", "OPEN"])
          .eq("created_by_role", "provider")
          .order("created_at", { ascending: false })
          .limit(50),

        // Zones for coverage gap calc
        supabase
          .from("zones")
          .select("id, name, max_stops_per_day")
          .eq("status", "active"),
      ]);

      // Filter missing proof: completed jobs with no photos
      let missingProof: QueueJob[] = [];
      const completedJobs = (missingProofRes.data ?? []) as QueueJob[];
      if (completedJobs.length > 0) {
        const ids = completedJobs.map(j => j.id);
        const { data: photos } = await supabase
          .from("job_photos")
          .select("job_id")
          .in("job_id", ids);
        const photosSet = new Set((photos ?? []).map((p: any) => p.job_id));
        missingProof = completedJobs.filter(j => !photosSet.has(j.id));
      }

      // Coverage gaps: zones where today's scheduled count is low vs capacity
      const zones = zonesRes.data ?? [];
      const { data: todayJobs } = await supabase
        .from("jobs")
        .select("zone_id")
        .eq("scheduled_date", today);
      
      const jobsByZone: Record<string, number> = {};
      (todayJobs ?? []).forEach((j: any) => {
        if (j.zone_id) jobsByZone[j.zone_id] = (jobsByZone[j.zone_id] || 0) + 1;
      });

      const coverageGaps = zones
        .filter((z: any) => {
          const max = z.max_stops_per_day || 0;
          const assigned = jobsByZone[z.id] || 0;
          // Gap = zone has capacity but 0 jobs assigned today (likely missing provider coverage)
          return max > 0 && assigned === 0;
        })
        .map((z: any) => ({
          zone_id: z.id,
          zone_name: z.name,
          gap_count: z.max_stops_per_day || 0,
        }));

      return {
        atRisk: (atRiskRes.data ?? []) as QueueJob[],
        missingProof,
        unassigned: (unassignedRes.data ?? []) as QueueJob[],
        customerIssues: (customerIssuesRes.data ?? []) as QueueIssue[],
        providerIncidents: (providerIncidentsRes.data ?? []) as QueueIssue[],
        coverageGaps,
      };
    },
    refetchInterval: 30_000,
  });
}
