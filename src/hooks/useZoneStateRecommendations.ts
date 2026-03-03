import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ZoneStateRecommendation {
  id: string;
  zone_id: string;
  category: string;
  current_state: string;
  recommended_state: string;
  confidence: "high" | "medium" | "low";
  reasons: string[];
  metrics_snapshot: Record<string, any>;
  status: "pending" | "approved" | "rejected" | "snoozed" | "superseded";
  reviewed_by_admin_user_id: string | null;
  review_note: string | null;
  reviewed_at: string | null;
  snoozed_until: string | null;
  created_at: string;
  updated_at: string;
}

export function useZoneStateRecommendations(filters?: {
  status?: string;
  zoneId?: string;
  category?: string;
}) {
  const queryClient = useQueryClient();

  const recommendations = useQuery({
    queryKey: ["zone_state_recommendations", filters],
    queryFn: async () => {
      let q = (supabase as any)
        .from("zone_state_recommendations")
        .select("*")
        .order("created_at", { ascending: false });
      if (filters?.status) q = q.eq("status", filters.status);
      if (filters?.zoneId) q = q.eq("zone_id", filters.zoneId);
      if (filters?.category) q = q.eq("category", filters.category);
      const { data, error } = await q;
      if (error) throw error;
      return data as ZoneStateRecommendation[];
    },
  });

  const approve = useMutation({
    mutationFn: async (params: { recommendationId: string; note?: string }) => {
      const { data, error } = await supabase.rpc("approve_zone_state_recommendation" as any, {
        p_recommendation_id: params.recommendationId,
        p_note: params.note ?? null,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["zone_state_recommendations"] });
      queryClient.invalidateQueries({ queryKey: ["market_zone_category_state"] });
    },
  });

  const reject = useMutation({
    mutationFn: async (params: { recommendationId: string; note: string }) => {
      const { data, error } = await supabase.rpc("reject_zone_state_recommendation" as any, {
        p_recommendation_id: params.recommendationId,
        p_note: params.note,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["zone_state_recommendations"] }),
  });

  const snooze = useMutation({
    mutationFn: async (params: { recommendationId: string; snoozeDays?: number; note?: string }) => {
      const { data, error } = await supabase.rpc("snooze_zone_state_recommendation" as any, {
        p_recommendation_id: params.recommendationId,
        p_snooze_days: params.snoozeDays ?? 7,
        p_note: params.note ?? null,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["zone_state_recommendations"] }),
  });

  return { recommendations, approve, reject, snooze };
}
