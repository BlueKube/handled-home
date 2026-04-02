import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AdminQuickFeedback {
  id: string;
  job_id: string;
  customer_id: string;
  provider_org_id: string;
  zone_id: string | null;
  outcome: string;
  tags: unknown;
  created_at: string;
}

export interface AdminPrivateRating {
  id: string;
  job_id: string;
  customer_id: string;
  provider_org_id: string;
  zone_id: string | null;
  rating: number;
  tags: unknown;
  comment_private: string | null;
  comment_public_candidate: string | null;
  submitted_at: string | null;
  created_at: string;
}

export function useAdminFeedback() {
  const quickFeedbackQuery = useQuery<AdminQuickFeedback[]>({
    queryKey: ["admin_quick_feedback"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("visit_feedback_quick")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as AdminQuickFeedback[];
    },
  });

  const privateRatingsQuery = useQuery<AdminPrivateRating[]>({
    queryKey: ["admin_private_ratings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("visit_ratings_private")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as AdminPrivateRating[];
    },
  });

  const issueCount = (quickFeedbackQuery.data ?? []).filter(
    (f) => f.outcome === "ISSUE"
  ).length;

  return {
    quickFeedback: quickFeedbackQuery.data ?? [],
    privateRatings: privateRatingsQuery.data ?? [],
    issueCount,
    isLoading: quickFeedbackQuery.isLoading || privateRatingsQuery.isLoading,
    isError: quickFeedbackQuery.isError || privateRatingsQuery.isError,
  };
}
