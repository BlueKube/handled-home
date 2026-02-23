import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface AdminJobFilters {
  status?: string;
  provider_org_id?: string;
  zone_id?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  pageSize?: number;
}

export function useAdminJobs(filters: AdminJobFilters = {}) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const pageSize = filters.pageSize ?? 25;
  const page = filters.page ?? 0;

  const jobsQuery = useQuery({
    queryKey: ["admin_jobs", filters],
    queryFn: async () => {
      const offset = page * pageSize;

      let query = (supabase.from("jobs") as any)
        .select(`
          *,
          property:properties(street_address, city, zip_code),
          job_skus(id, sku_name_snapshot, sku_id)
        `, { count: "exact" })
        .order("scheduled_date", { ascending: false })
        .range(offset, offset + pageSize - 1);

      if (filters.status) query = query.eq("status", filters.status);
      if (filters.provider_org_id) query = query.eq("provider_org_id", filters.provider_org_id);
      if (filters.zone_id) query = query.eq("zone_id", filters.zone_id);
      if (filters.date_from) query = query.gte("scheduled_date", filters.date_from);
      if (filters.date_to) query = query.lte("scheduled_date", filters.date_to);

      const { data, error, count } = await query;
      if (error) throw error;
      return { jobs: data ?? [], totalCount: count ?? 0 };
    },
  });

  const overrideComplete = useMutation({
    mutationFn: async (params: { jobId: string; reason: string; note?: string }) => {
      const { data, error } = await supabase.rpc("admin_override_complete_job", {
        p_job_id: params.jobId,
        p_reason: params.reason,
        p_note: params.note ?? null,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_jobs"] });
      queryClient.invalidateQueries({ queryKey: ["job_detail"] });
    },
  });

  // A6: Add admin_audit_log entry when resolving issues
  const resolveIssue = useMutation({
    mutationFn: async (params: { issueId: string; jobId: string; note: string }) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("job_issues")
        .update({
          status: "RESOLVED",
          resolved_at: new Date().toISOString(),
          resolved_by_admin_user_id: user.id,
          resolution_note: params.note,
        })
        .eq("id", params.issueId);
      if (error) throw error;

      await supabase.from("job_events").insert({
        job_id: params.jobId,
        actor_user_id: user.id,
        actor_role: "admin",
        event_type: "ISSUE_RESOLVED",
        metadata: { issue_id: params.issueId, note: params.note },
      });

      // A6: Write admin audit log
      await supabase.from("admin_audit_log").insert({
        admin_user_id: user.id,
        entity_type: "job_issue",
        entity_id: params.issueId,
        action: "resolve_issue",
        after: { status: "RESOLVED", resolution_note: params.note },
        reason: params.note,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_jobs"] });
      queryClient.invalidateQueries({ queryKey: ["job_detail"] });
    },
  });

  return {
    jobs: jobsQuery.data?.jobs ?? [],
    totalCount: jobsQuery.data?.totalCount ?? 0,
    loading: jobsQuery.isLoading,
    overrideComplete,
    resolveIssue,
  };
}
