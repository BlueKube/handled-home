import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface VisitRating {
  id: string;
  job_id: string;
  customer_id: string;
  provider_org_id: string;
  rating: number;
  comment: string | null;
  is_suppressed: boolean;
  suppression_reason: string | null;
  created_at: string;
}

interface SubmitRatingInput {
  jobId: string;
  providerOrgId: string;
  rating: number;
  comment?: string;
}

/**
 * Smart suppression logic:
 * - Suppress on first-ever visit (no prior completed jobs)
 * - Suppress if customer already reported an issue on this job
 */
function computeSuppression(
  isFirstVisit: boolean,
  hasIssue: boolean,
): { is_suppressed: boolean; suppression_reason: string | null } {
  if (isFirstVisit) {
    return { is_suppressed: true, suppression_reason: "first_visit" };
  }
  if (hasIssue) {
    return { is_suppressed: true, suppression_reason: "issue_reported" };
  }
  return { is_suppressed: false, suppression_reason: null };
}

export function useVisitRating(jobId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Load existing rating for this job
  const ratingQuery = useQuery<VisitRating | null>({
    queryKey: ["visit_rating", jobId],
    enabled: !!user && !!jobId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("visit_ratings")
        .select("*")
        .eq("job_id", jobId!)
        .eq("customer_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data as VisitRating | null;
    },
  });

  // Check smart suppression context
  const suppressionQuery = useQuery({
    queryKey: ["visit_rating_suppression", jobId],
    enabled: !!user && !!jobId && !ratingQuery.data,
    queryFn: async () => {
      // Check if this is the customer's first completed visit
      const [completedRes, issueRes] = await Promise.all([
        supabase
          .from("jobs")
          .select("id", { count: "exact", head: true })
          .eq("customer_id", user!.id)
          .eq("status", "COMPLETED"),
        supabase
          .from("customer_issues")
          .select("id", { count: "exact", head: true })
          .eq("job_id", jobId!)
          .eq("customer_id", user!.id),
      ]);

      const completedCount = completedRes.count ?? 0;
      const issueCount = issueRes.count ?? 0;

      return {
        isFirstVisit: completedCount <= 1,
        hasIssue: issueCount > 0,
      };
    },
  });

  const submitRating = useMutation({
    mutationFn: async ({ jobId, providerOrgId, rating, comment }: SubmitRatingInput) => {
      const suppression = suppressionQuery.data
        ? computeSuppression(suppressionQuery.data.isFirstVisit, suppressionQuery.data.hasIssue)
        : { is_suppressed: false, suppression_reason: null };

      const { data, error } = await supabase
        .from("visit_ratings")
        .upsert(
          {
            job_id: jobId,
            customer_id: user!.id,
            provider_org_id: providerOrgId,
            rating,
            comment: comment || null,
            ...suppression,
          },
          { onConflict: "job_id,customer_id" }
        )
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["visit_rating", jobId] });
      toast.success("Thanks for your feedback!");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to submit rating");
    },
  });

  return {
    rating: ratingQuery.data,
    isLoading: ratingQuery.isLoading,
    suppression: suppressionQuery.data,
    submitRating,
  };
}
