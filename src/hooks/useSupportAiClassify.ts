import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useSupportAiClassify() {
  return useMutation({
    mutationFn: async (ticketId: string) => {
      const { data, error } = await supabase.functions.invoke("support-ai-classify", {
        body: { ticket_id: ticketId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data as {
        success: boolean;
        ai_summary: string;
        recommended_severity: string;
        evidence_score: number;
        risk_score: number;
        classification: {
          is_repeat_offender: boolean;
          recommended_action: string;
          reasoning: string;
        };
        duplicate_ticket_id?: string;
        auto_resolvable: boolean;
        suggested_credit_cents: number;
        resolution_explanation: string;
        photo_analysis: {
          has_evidence: boolean;
          evidence_description: string;
        } | null;
        should_auto_resolve: boolean;
        auto_resolve_result?: {
          success: boolean;
          credit_cents?: number;
          resolution?: string;
          reason?: string;
        } | null;
      };
    },
  });
}
