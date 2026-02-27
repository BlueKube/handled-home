import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface QualityScoreSnapshot {
  id: string;
  provider_org_id: string;
  score_window_days: number;
  score: number;
  band: string;
  components: Record<string, unknown>;
  computed_at: string;
}

export interface FeedbackRollup {
  id: string;
  provider_org_id: string;
  period_start: string;
  period_end: string;
  review_count: number;
  avg_rating: number | null;
  theme_counts: Record<string, number>;
  summary_positive: string | null;
  summary_improve: string | null;
  published_at: string | null;
  visibility_status: string;
}

export function useProviderQualityScore(providerOrgId: string | undefined) {
  const { user } = useAuth();

  const scoreQuery = useQuery<QualityScoreSnapshot | null>({
    queryKey: ["provider_quality_score", providerOrgId],
    enabled: !!user && !!providerOrgId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("provider_quality_score_snapshots")
        .select("*")
        .eq("provider_org_id", providerOrgId!)
        .order("computed_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as QualityScoreSnapshot | null;
    },
  });

  const rollupsQuery = useQuery<FeedbackRollup[]>({
    queryKey: ["provider_feedback_rollups", providerOrgId],
    enabled: !!user && !!providerOrgId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("provider_feedback_rollups")
        .select("*")
        .eq("provider_org_id", providerOrgId!)
        .order("period_end", { ascending: false })
        .limit(8);
      if (error) throw error;
      return (data ?? []) as FeedbackRollup[];
    },
  });

  const scoreEventsQuery = useQuery({
    queryKey: ["provider_score_events", providerOrgId],
    enabled: !!user && !!providerOrgId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("provider_quality_score_events")
        .select("*")
        .eq("provider_org_id", providerOrgId!)
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data ?? [];
    },
  });

  return {
    score: scoreQuery.data,
    rollups: rollupsQuery.data ?? [],
    scoreEvents: scoreEventsQuery.data ?? [],
    isLoading: scoreQuery.isLoading,
  };
}
