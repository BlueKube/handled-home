import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type SnapClassification = {
  summary: string;
  suggested_sku_id: string | null;
  suggested_credits: number;
  area_inference: "bath" | "kitchen" | "yard" | "exterior" | "other" | "unknown";
  confidence: number;
  urgency_signal: "low" | "medium" | "high";
};

// Phase 2 of the 3-step Snap flow (4.3): invoke snap-ai-classify.
// Caller should treat errors as recoverable — SnapSheet falls back to a
// placeholder card if this fails. Timeouts / 429 / 529 all return null-like
// shapes via the thrown Error.
export function useClassifySnap() {
  return useMutation<SnapClassification, Error, { snapId: string }>({
    mutationFn: async ({ snapId }) => {
      const { data, error } = await supabase.functions.invoke("snap-ai-classify", {
        body: { snap_request_id: snapId },
      });

      if (error) {
        // FunctionsFetchError / FunctionsRelayError don't reliably expose
        // .message — fall back to String(error) so we never throw a
        // "Classification failed" with a silent cause.
        throw new Error(error?.message ?? String(error));
      }

      const result = data as (SnapClassification & { success?: boolean; error?: string }) | null;
      if (!result) throw new Error("Empty response from classify");
      if (result.error) throw new Error(result.error);
      if (!result.summary) throw new Error("Malformed classification response");

      return {
        summary: result.summary,
        suggested_sku_id: result.suggested_sku_id ?? null,
        suggested_credits: result.suggested_credits,
        area_inference: result.area_inference,
        confidence: result.confidence,
        urgency_signal: result.urgency_signal,
      };
    },
  });
}
