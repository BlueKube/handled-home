import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ProviderSlaEntry {
  id: string;
  provider_org_id: string;
  zone_id: string;
  category: string;
  sla_level: "GREEN" | "YELLOW" | "ORANGE" | "RED";
  on_time_pct: number;
  completion_pct: number;
  photo_compliance_pct: number;
  issue_rate: number;
  redo_rate: number;
  jobs_evaluated: number;
  level_since: string;
  weeks_at_level: number;
  last_evaluated_at: string;
  explain_provider: string | null;
  explain_admin: string | null;
}

/** Admin: fetch all SLA statuses, optionally filtered by zone */
export function useProviderSlaAdmin(filters: { zoneId?: string; level?: string } = {}) {
  return useQuery({
    queryKey: ["provider-sla-admin", filters.zoneId, filters.level],
    queryFn: async () => {
      let query = supabase
        .from("provider_sla_status")
        .select("*")
        .order("sla_level", { ascending: true })
        .order("weeks_at_level", { ascending: false })
        .limit(200);

      if (filters.zoneId) query = query.eq("zone_id", filters.zoneId);
      if (filters.level) query = query.eq("sla_level", filters.level);

      const { data, error } = await query;
      if (error) throw error;
      return data as ProviderSlaEntry[];
    },
  });
}

/** Provider: fetch own SLA statuses */
export function useProviderSlaOwn(providerOrgId: string | undefined) {
  return useQuery({
    queryKey: ["provider-sla-own", providerOrgId],
    enabled: !!providerOrgId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("provider_sla_status")
        .select("*")
        .eq("provider_org_id", providerOrgId!)
        .order("category");

      if (error) throw error;
      return data as ProviderSlaEntry[];
    },
  });
}
