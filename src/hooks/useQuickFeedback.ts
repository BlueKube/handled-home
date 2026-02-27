import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export type FeedbackOutcome = "GOOD" | "ISSUE";

export interface QuickFeedback {
  id: string;
  job_id: string;
  customer_id: string;
  provider_org_id: string;
  zone_id: string | null;
  outcome: string;
  tags: string[];
  created_at: string;
}

export function useQuickFeedback(jobId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const feedbackQuery = useQuery<QuickFeedback | null>({
    queryKey: ["quick_feedback", jobId],
    enabled: !!user && !!jobId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("visit_feedback_quick")
        .select("*")
        .eq("job_id", jobId!)
        .eq("customer_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data as QuickFeedback | null;
    },
  });

  const submitFeedback = useMutation({
    mutationFn: async ({ outcome, tags }: { outcome: FeedbackOutcome; tags?: string[] }) => {
      const { data, error } = await supabase.rpc("submit_quick_feedback", {
        p_job_id: jobId!,
        p_outcome: outcome,
        p_tags: JSON.stringify(tags ?? []),
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["quick_feedback", jobId] });
      if (vars.outcome === "GOOD") {
        toast.success("Thanks for the feedback!");
      }
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to submit feedback");
    },
  });

  return {
    feedback: feedbackQuery.data,
    isLoading: feedbackQuery.isLoading,
    submitFeedback,
  };
}
