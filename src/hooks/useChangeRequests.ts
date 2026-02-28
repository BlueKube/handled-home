import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ChangeRequest {
  id: string;
  requester_user_id: string;
  requester_role: string;
  target_table: string;
  target_entity_id: string | null;
  change_type: string;
  proposed_changes: Record<string, unknown>;
  reason: string;
  status: string;
  reviewer_user_id: string | null;
  reviewer_note: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export function useChangeRequests(statusFilter?: string) {
  return useQuery({
    queryKey: ["change-requests", statusFilter],
    queryFn: async (): Promise<ChangeRequest[]> => {
      let q = supabase
        .from("admin_change_requests")
        .select("*")
        .order("created_at", { ascending: false });
      if (statusFilter) q = q.eq("status", statusFilter);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as ChangeRequest[];
    },
  });
}

export function useSubmitChangeRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      target_table: string;
      target_entity_id?: string;
      change_type: string;
      proposed_changes: Record<string, unknown>;
      reason: string;
    }) => {
      const { data, error } = await supabase.rpc("submit_change_request", {
        p_target_table: params.target_table,
        p_target_entity_id: params.target_entity_id ?? null,
        p_change_type: params.change_type,
        p_proposed_changes: params.proposed_changes as unknown as Record<string, never>,
        p_reason: params.reason,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["change-requests"] }); toast.success("Change request submitted"); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useReviewChangeRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { request_id: string; decision: string; reviewer_note?: string }) => {
      const { error } = await supabase.rpc("review_change_request", {
        p_request_id: params.request_id,
        p_decision: params.decision,
        p_reviewer_note: params.reviewer_note ?? "",
      });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["change-requests"] }); toast.success("Request reviewed"); },
    onError: (e: Error) => toast.error(e.message),
  });
}
