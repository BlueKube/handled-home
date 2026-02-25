import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ExpansionSuggestion {
  id: string;
  zone_id: string;
  suggestion_type: string;
  status: string;
  priority: string;
  metrics: Record<string, unknown>;
  recommendation: string;
  explain_admin: string | null;
  proposed_action: Record<string, unknown>;
  reviewed_by_admin_user_id: string | null;
  reviewed_at: string | null;
  review_note: string | null;
  created_at: string;
  updated_at: string;
}

export function useExpansionSuggestions(filters: { zoneId?: string; status?: string } = {}) {
  return useQuery({
    queryKey: ["expansion-suggestions", filters],
    queryFn: async () => {
      let query = supabase
        .from("expansion_suggestions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (filters.zoneId) query = query.eq("zone_id", filters.zoneId);
      if (filters.status) query = query.eq("status", filters.status);

      const { data, error } = await query;
      if (error) throw error;
      return data as ExpansionSuggestion[];
    },
  });
}

export function useReviewExpansionSuggestion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ suggestionId, decision, note }: { suggestionId: string; decision: "approved" | "rejected"; note?: string }) => {
      const { error } = await supabase.rpc("review_expansion_suggestion", {
        p_suggestion_id: suggestionId,
        p_decision: decision,
        p_note: note || null,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["expansion-suggestions"] }),
  });
}
