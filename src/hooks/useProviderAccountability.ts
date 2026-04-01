import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface IncidentWithRelations {
  id: string;
  provider_org_id: string;
  incident_type: string;
  severity: string;
  visit_id: string | null;
  zone_id: string | null;
  details: any;
  is_excused: boolean;
  excuse_reason: string | null;
  classified_by_user_id: string | null;
  created_at: string;
  updated_at: string;
  provider_org_name?: string;
  zone_name?: string;
}

export interface ProbationWithRelations {
  id: string;
  provider_org_id: string;
  entry_reason: string;
  sla_level_at_entry: string | null;
  targets: any;
  deadline_at: string;
  status: string;
  outcome: string | null;
  progress_notes: string | null;
  resolved_at: string | null;
  resolved_by_user_id: string | null;
  created_at: string;
  updated_at: string;
  provider_org_name?: string;
}

// === INCIDENTS ===

export function useProviderIncidents(providerOrgId?: string) {
  return useQuery({
    queryKey: ["provider-incidents", providerOrgId],
    queryFn: async () => {
      let query = (supabase
        .from("provider_incidents" as any)
        .select(`*, provider_orgs:provider_org_id(name), zones:zone_id(name)`) as any)
        .order("created_at", { ascending: false })
        .limit(100);

      if (providerOrgId) {
        query = query.eq("provider_org_id", providerOrgId);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data ?? []).map((row: any) => ({
        ...row,
        provider_org_name: row.provider_orgs?.name ?? null,
        zone_name: row.zones?.name ?? null,
        provider_orgs: undefined,
        zones: undefined,
      })) as IncidentWithRelations[];
    },
  });
}

export function useIncidentRollingCount(providerOrgId: string, days: number = 60) {
  return useQuery({
    queryKey: ["provider-incident-count", providerOrgId, days],
    queryFn: async () => {
      const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
      const { count, error } = await (supabase
        .from("provider_incidents" as any)
        .select("id", { count: "exact", head: true }) as any)
        .eq("provider_org_id", providerOrgId)
        .eq("is_excused", false)
        .gte("created_at", cutoff);
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!providerOrgId,
  });
}

interface CreateIncidentParams {
  providerOrgId: string;
  incidentType: string;
  severity: string;
  visitId?: string;
  zoneId?: string;
  details?: Record<string, unknown>;
}

export function useCreateIncident() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: CreateIncidentParams) => {
      const { error } = await (supabase
        .from("provider_incidents" as any) as any)
        .insert({
          provider_org_id: params.providerOrgId,
          incident_type: params.incidentType,
          severity: params.severity,
          visit_id: params.visitId ?? null,
          zone_id: params.zoneId ?? null,
          details: (params.details as any) ?? {},
        });
      if (error) throw error;
    },
    onSuccess: (_, params) => {
      qc.invalidateQueries({ queryKey: ["provider-incidents"] });
      qc.invalidateQueries({ queryKey: ["provider-incident-count", params.providerOrgId] });
    },
  });
}

interface ClassifyIncidentParams {
  incidentId: string;
  isExcused: boolean;
  excuseReason?: string;
}

export function useClassifyIncident() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: ClassifyIncidentParams) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await (supabase
        .from("provider_incidents" as any) as any)
        .update({
          is_excused: params.isExcused,
          excuse_reason: params.excuseReason ?? null,
          classified_by_user_id: user.id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", params.incidentId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["provider-incidents"] });
    },
  });
}

// === PROBATION ===

export function useProviderProbation(providerOrgId?: string) {
  return useQuery({
    queryKey: ["provider-probation", providerOrgId],
    queryFn: async () => {
      let query = (supabase
        .from("provider_probation" as any)
        .select(`*, provider_orgs:provider_org_id(name)`) as any)
        .order("created_at", { ascending: false });

      if (providerOrgId) {
        query = query.eq("provider_org_id", providerOrgId);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data ?? []).map((row: any) => ({
        ...row,
        provider_org_name: row.provider_orgs?.name ?? null,
        provider_orgs: undefined,
      })) as ProbationWithRelations[];
    },
  });
}

export function useActiveProbation(providerOrgId: string) {
  return useQuery({
    queryKey: ["provider-probation-active", providerOrgId],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from("provider_probation" as any)
        .select("*") as any)
        .eq("provider_org_id", providerOrgId)
        .eq("status", "active")
        .maybeSingle();
      if (error) throw error;
      return data as ProbationWithRelations | null;
    },
    enabled: !!providerOrgId,
  });
}

interface CreateProbationParams {
  providerOrgId: string;
  entryReason: string;
  slaLevelAtEntry?: string;
  targets: Record<string, unknown>;
  deadlineDays: number;
}

export function useCreateProbation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: CreateProbationParams) => {
      const deadline = new Date(Date.now() + params.deadlineDays * 24 * 60 * 60 * 1000).toISOString();
      const { error } = await (supabase
        .from("provider_probation" as any) as any)
        .insert({
          provider_org_id: params.providerOrgId,
          entry_reason: params.entryReason,
          sla_level_at_entry: params.slaLevelAtEntry ?? null,
          targets: params.targets as any,
          deadline_at: deadline,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["provider-probation"] });
    },
  });
}

interface ResolveProbationParams {
  probationId: string;
  outcome: "improved" | "suspended" | "extended";
  progressNotes?: string;
}

export function useResolveProbation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: ResolveProbationParams) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const status = params.outcome === "extended" ? "active" : params.outcome === "improved" ? "completed" : "failed";

      const { error } = await (supabase
        .from("provider_probation" as any) as any)
        .update({
          status,
          outcome: params.outcome,
          progress_notes: params.progressNotes ?? null,
          resolved_at: params.outcome !== "extended" ? new Date().toISOString() : null,
          resolved_by_user_id: params.outcome !== "extended" ? user.id : null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", params.probationId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["provider-probation"] });
    },
  });
}
