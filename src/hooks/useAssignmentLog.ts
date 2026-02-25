import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AssignmentLogEntry {
  id: string;
  job_id: string;
  provider_org_id: string | null;
  previous_provider_org_id: string | null;
  assignment_reason: string;
  explain_customer: string | null;
  explain_provider: string | null;
  explain_admin: string | null;
  score_breakdown: Record<string, any> | null;
  assigned_at: string;
  assigned_by: string;
  created_at: string;
  provider_org_name?: string;
}

export function useAssignmentLog(filters: { zoneId?: string; limit?: number } = {}) {
  return useQuery({
    queryKey: ["assignment-log", filters.zoneId, filters.limit],
    queryFn: async () => {
      let query = supabase
        .from("job_assignment_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(filters.limit ?? 50);

      if (filters.zoneId) {
        const { data: jobIds } = await supabase
          .from("jobs")
          .select("id")
          .eq("zone_id", filters.zoneId)
          .limit(500);

        if (jobIds?.length) {
          query = query.in("job_id", jobIds.map((j) => j.id));
        } else {
          return [];
        }
      }

      const { data, error } = await query;
      if (error) throw error;
      const logs = data as AssignmentLogEntry[];

      // Resolve provider org names
      const orgIds = [...new Set(logs.map((l) => l.provider_org_id).filter(Boolean))] as string[];
      if (orgIds.length) {
        const { data: orgs } = await supabase
          .from("provider_orgs")
          .select("id, name")
          .in("id", orgIds);
        const orgMap = new Map(orgs?.map((o) => [o.id, o.name]) ?? []);
        logs.forEach((l) => {
          if (l.provider_org_id) {
            l.provider_org_name = orgMap.get(l.provider_org_id) ?? undefined;
          }
        });
      }

      return logs;
    },
  });
}
