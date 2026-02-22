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
      };
    },
  });
}
