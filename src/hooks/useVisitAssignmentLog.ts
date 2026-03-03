import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface VisitAssignmentLogEntry {
  id: string;
  visit_id: string;
  action: string;
  provider_org_id: string | null;
  previous_provider_org_id: string | null;
  reason: string | null;
  performed_by: string | null;
  score_breakdown: Record<string, any> | null;
  candidates: Record<string, any> | null;
  created_at: string;
  // joined
  provider_org_name?: string;
}

export function useVisitAssignmentLog(visitId?: string) {
  return useQuery({
    queryKey: ["visit_assignment_log", visitId],
    enabled: !!visitId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("visit_assignment_log")
        .select("*")
        .eq("visit_id", visitId!)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;

      const logs = data as VisitAssignmentLogEntry[];
      // Resolve org names
      const orgIds = [
        ...new Set(logs.map((l) => l.provider_org_id).filter(Boolean)),
      ] as string[];
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
