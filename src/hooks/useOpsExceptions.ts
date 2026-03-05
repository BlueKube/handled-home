import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type OpsException = Database["public"]["Tables"]["ops_exceptions"]["Row"];
type OpsExceptionAction = Database["public"]["Tables"]["ops_exception_actions"]["Row"];
type OpsExceptionSeverity = Database["public"]["Enums"]["ops_exception_severity"];
type OpsExceptionStatus = Database["public"]["Enums"]["ops_exception_status"];
type OpsExceptionType = Database["public"]["Enums"]["ops_exception_type"];

export interface OpsExceptionWithRelations extends OpsException {
  zone_name?: string;
  provider_org_name?: string;
  visit_scheduled_date?: string;
  visit_schedule_state?: string;
  customer_name?: string;
}

export interface OpsExceptionFilters {
  severity?: OpsExceptionSeverity | "all";
  status?: OpsExceptionStatus | "all";
  exception_type?: OpsExceptionType | "all";
  zone_id?: string | "all";
}

const ACTIVE_STATUSES: OpsExceptionStatus[] = ["open", "acknowledged", "in_progress", "escalated"];

export function useOpsExceptions(filters: OpsExceptionFilters = {}) {
  return useQuery({
    queryKey: ["ops-exceptions", filters],
    queryFn: async () => {
      let query = supabase
        .from("ops_exceptions")
        .select(`
          *,
          zones:zone_id(name),
          provider_orgs:provider_org_id(name),
          visits:visit_id(scheduled_date, schedule_state)
        `)
        .order("severity", { ascending: true })
        .order("sla_target_at", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: false });

      // Default to active statuses if no specific status filter
      if (!filters.status || filters.status === "all") {
        query = query.in("status", ACTIVE_STATUSES);
      } else {
        query = query.eq("status", filters.status);
      }

      if (filters.severity && filters.severity !== "all") {
        query = query.eq("severity", filters.severity);
      }
      if (filters.exception_type && filters.exception_type !== "all") {
        query = query.eq("exception_type", filters.exception_type);
      }
      if (filters.zone_id && filters.zone_id !== "all") {
        query = query.eq("zone_id", filters.zone_id);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data ?? []).map((row: any) => ({
        ...row,
        zone_name: row.zones?.name ?? null,
        provider_org_name: row.provider_orgs?.name ?? null,
        visit_scheduled_date: row.visits?.scheduled_date ?? null,
        visit_schedule_state: row.visits?.schedule_state ?? null,
        zones: undefined,
        provider_orgs: undefined,
        visits: undefined,
      })) as OpsExceptionWithRelations[];
    },
    refetchInterval: 30_000, // real-time-ish
  });
}

export function useOpsExceptionDetail(exceptionId: string | null) {
  return useQuery({
    queryKey: ["ops-exception-detail", exceptionId],
    queryFn: async () => {
      if (!exceptionId) return null;
      const { data, error } = await supabase
        .from("ops_exceptions")
        .select(`
          *,
          zones:zone_id(name),
          provider_orgs:provider_org_id(name),
          visits:visit_id(scheduled_date, schedule_state, route_order, stop_duration_minutes, eta_range_start, eta_range_end, property_id)
        `)
        .eq("id", exceptionId)
        .single();
      if (error) throw error;
      return data as any;
    },
    enabled: !!exceptionId,
  });
}

export function useOpsExceptionActions(exceptionId: string | null) {
  return useQuery({
    queryKey: ["ops-exception-actions", exceptionId],
    queryFn: async () => {
      if (!exceptionId) return [];
      const { data, error } = await supabase
        .from("ops_exception_actions")
        .select("*")
        .eq("exception_id", exceptionId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as OpsExceptionAction[];
    },
    enabled: !!exceptionId,
  });
}

export function useOpsExceptionCount() {
  return useQuery({
    queryKey: ["ops-exception-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("ops_exceptions")
        .select("id", { count: "exact", head: true })
        .in("status", ACTIVE_STATUSES);
      if (error) throw error;
      return count ?? 0;
    },
    refetchInterval: 30_000,
  });
}

interface RecordActionParams {
  exceptionId: string;
  actionType: string;
  reasonCode: string;
  reasonNote?: string;
  isFreezeOverride?: boolean;
  beforeState?: Record<string, unknown>;
  afterState?: Record<string, unknown>;
  impactSummary?: Record<string, unknown>;
}

export function useRecordOpsAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: RecordActionParams) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("ops_exception_actions")
        .insert({
          exception_id: params.exceptionId,
          action_type: params.actionType,
          actor_role: "admin",
          actor_user_id: user.id,
          reason_code: params.reasonCode,
          reason_note: params.reasonNote ?? null,
          is_freeze_override: params.isFreezeOverride ?? false,
          before_state: (params.beforeState as any) ?? null,
          after_state: (params.afterState as any) ?? null,
          impact_summary: (params.impactSummary as any) ?? null,
          undo_expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        });
      if (error) throw error;
    },
    onSuccess: (_, params) => {
      qc.invalidateQueries({ queryKey: ["ops-exception-actions", params.exceptionId] });
      qc.invalidateQueries({ queryKey: ["ops-exception-detail", params.exceptionId] });
      qc.invalidateQueries({ queryKey: ["ops-exceptions"] });
      qc.invalidateQueries({ queryKey: ["ops-exception-count"] });
    },
  });
}

interface UpdateExceptionStatusParams {
  exceptionId: string;
  status: OpsExceptionStatus;
  resolutionType?: string;
  resolutionNote?: string;
}

export function useUpdateExceptionStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: UpdateExceptionStatusParams) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const update: Record<string, unknown> = {
        status: params.status,
        updated_at: new Date().toISOString(),
      };
      if (params.status === "resolved") {
        update.resolved_at = new Date().toISOString();
        update.resolved_by_user_id = user.id;
        update.resolution_type = params.resolutionType ?? "manual";
        update.resolution_note = params.resolutionNote ?? null;
      }
      if (params.status === "escalated") {
        update.escalated_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("ops_exceptions")
        .update(update)
        .eq("id", params.exceptionId);
      if (error) throw error;
    },
    onSuccess: (_, params) => {
      qc.invalidateQueries({ queryKey: ["ops-exception-detail", params.exceptionId] });
      qc.invalidateQueries({ queryKey: ["ops-exceptions"] });
      qc.invalidateQueries({ queryKey: ["ops-exception-count"] });
    },
  });
}
