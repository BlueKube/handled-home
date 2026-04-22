import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type CancelSnapResult = {
  success: true;
  resolution: "canceled" | "already_resolved";
  refunded: number;
  /** Server-reported status when `resolution === 'already_resolved'`. */
  priorStatus?: string;
};

// Parse the raw (data, error) pair from supabase.rpc("resolve_snap", ...
// p_canceled:true). `already_resolved` is idempotent-safe and returns a
// zero-refund success so the SnapSheet refund-on-failure path is safe to
// call twice. Exported for direct testing without QueryClient setup.
export function parseCancelSnapResponse(
  data: unknown,
  error: { message?: string } | null,
): CancelSnapResult {
  if (error) throw new Error(error.message ?? "Cancel failed");
  if (!data || typeof data !== "object") throw new Error("Empty response from resolve_snap");

  const result = data as
    | CancelSnapResult
    | { success: false; error: string; status?: string };

  if (result.success === false) {
    if (result.error === "already_resolved") {
      // Idempotent-safe for SnapSheet's refund-on-failure path, but
      // don't lie about the prior state — surface the server-reported
      // status so a caller that cares (admin UI, audit log) can tell
      // whether the snap had been completed or actually canceled.
      return {
        success: true,
        resolution: "already_resolved",
        refunded: 0,
        priorStatus: result.status,
      };
    }
    throw new Error(result.error ?? "Cancel failed");
  }
  return result;
}

// Cancels a snap and refunds the full credit hold. Used both as:
//  - customer-facing cancel (future admin/history UI)
//  - SnapSheet's refund-on-route-failure path
// Invalidation mirrors useFinalizeSnap's onSuccess so CreditsRing + history
// update immediately after the refund.
export function useCancelSnap() {
  const qc = useQueryClient();

  return useMutation<CancelSnapResult, Error, { snapId: string }>({
    mutationFn: async ({ snapId }) => {
      const { data, error } = await supabase.rpc("resolve_snap", {
        p_snap_request_id: snapId,
        p_credits_actual: null,
        p_canceled: true,
      });
      return parseCancelSnapResponse(data, error);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["subscription"] });
      qc.invalidateQueries({ queryKey: ["handle_balance"] });
      qc.invalidateQueries({ queryKey: ["handle_transactions"] });
    },
  });
}
