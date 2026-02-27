import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface PrivateReview {
  id: string;
  job_id: string;
  customer_id: string;
  provider_org_id: string;
  rating: number;
  tags: string[];
  comment_public_candidate: string | null;
  comment_private: string | null;
  submitted_at: string | null;
  created_at: string;
}

export function usePrivateReview(jobId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const reviewQuery = useQuery<PrivateReview | null>({
    queryKey: ["private_review", jobId],
    enabled: !!user && !!jobId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("visit_ratings_private")
        .select("*")
        .eq("job_id", jobId!)
        .eq("customer_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data as PrivateReview | null;
    },
  });

  const submitReview = useMutation({
    mutationFn: async ({
      rating,
      tags,
      commentPublic,
      commentPrivate,
    }: {
      rating: number;
      tags?: string[];
      commentPublic?: string;
      commentPrivate?: string;
    }) => {
      const { data, error } = await supabase.rpc("submit_private_review", {
        p_job_id: jobId!,
        p_rating: rating,
        p_tags: JSON.stringify(tags ?? []),
        p_comment_public_candidate: commentPublic || null,
        p_comment_private: commentPrivate || null,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["private_review", jobId] });
      toast.success("Thank you! Your feedback is completely private.");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to submit review");
    },
  });

  return {
    review: reviewQuery.data,
    isLoading: reviewQuery.isLoading,
    submitReview,
  };
}
