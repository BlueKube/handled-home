import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AuditLogEntry {
  id: string;
  admin_user_id: string;
  actor_admin_role: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  reason: string | null;
  created_at: string;
}

export function useAuditLog(entityType?: string, limit = 100) {
  return useQuery({
    queryKey: ["audit-log", entityType, limit],
    queryFn: async (): Promise<AuditLogEntry[]> => {
      let q = supabase
        .from("admin_audit_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (entityType) q = q.eq("entity_type", entityType);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as AuditLogEntry[];
    },
  });
}
