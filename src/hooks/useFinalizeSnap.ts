import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type SnapRouting = "next_visit" | "ad_hoc";

export type SnapFinalizeInput = {
  snapId: string;
  subscriptionId: string;
  routing: SnapRouting;
  creditsToHold: number;
};

export type SnapFinalizeResult = {
  snapId: string;
  subscriptionId: string;
  newBalance: number;
};

// Phase 3 of the 3-step Snap flow (4.3): set routing + credits_held on the
// existing draft row, then call spend_handles to actually hold the credits.
// Rolls back the snap_requests update if spend_handles fails so the row
// stays in a clean state for another finalize attempt.
export function useFinalizeSnap() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation<SnapFinalizeResult, Error, SnapFinalizeInput>({
    mutationFn: async ({ snapId, subscriptionId, routing, creditsToHold }) => {
      if (!user) throw new Error("Not authenticated");
      if (creditsToHold <= 0) throw new Error("Invalid credit amount");

      // Persist routing + credits_held first so a crash between here and
      // spend_handles leaves the row self-describing.
      const { error: updateErr } = await (supabase.from("snap_requests") as any)
        .update({ routing, credits_held: creditsToHold })
        .eq("id", snapId);
      if (updateErr) throw updateErr;

      const rollback = async () => {
        await (supabase.from("snap_requests") as any)
          .update({ routing: null, credits_held: 0 })
          .eq("id", snapId)
          .then(
            () => {},
            () => {},
          );
      };

      const { data: spendResult, error: spendErr } = await supabase.rpc("spend_handles", {
        p_subscription_id: subscriptionId,
        p_customer_id: user.id,
        p_amount: creditsToHold,
        p_reference_id: snapId,
      });

      if (spendErr) {
        await rollback();
        throw spendErr;
      }

      const result = spendResult as { success: boolean; error?: string; new_balance?: number };
      if (!result.success) {
        await rollback();
        if (result.error === "insufficient_handles") {
          throw new Error("Not enough credits to submit this snap.");
        }
        throw new Error(result.error ?? "Failed to hold credits");
      }

      return { snapId, subscriptionId, newBalance: result.new_balance ?? 0 };
    },
    onSuccess: (result) => {
      // Seed handle_balance cache with the authoritative value so CreditsRing
      // doesn't flash stale between submit and the refetch. Same pattern
      // as Batch 4.2 Lane-4 N1 fix.
      qc.setQueryData(["handle_balance", result.subscriptionId], result.newBalance);
      qc.invalidateQueries({ queryKey: ["subscription"] });
      qc.invalidateQueries({ queryKey: ["handle_balance"] });
      qc.invalidateQueries({ queryKey: ["handle_transactions"] });
    },
  });
}
