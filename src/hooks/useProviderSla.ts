import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const SLA_LEVEL_ORDER: Record<string, number> = { RED: 0, ORANGE: 1, YELLOW: 2, GREEN: 3 };

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
        .order("last_evaluated_at", { ascending: false })
        .limit(200);

      if (filters.zoneId) query = query.eq("zone_id", filters.zoneId);
      if (filters.level) query = query.eq("sla_level", filters.level);

      const { data, error } = await query;
      if (error) throw error;
      // Sort by severity (RED first) then by level_since ascending (longest at level first)
      const sorted = (data as ProviderSlaEntry[]).sort((a, b) => {
        const levelDiff = (SLA_LEVEL_ORDER[a.sla_level] ?? 4) - (SLA_LEVEL_ORDER[b.sla_level] ?? 4);
        if (levelDiff !== 0) return levelDiff;
        return new Date(a.level_since).getTime() - new Date(b.level_since).getTime();
      });
      return sorted;
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
