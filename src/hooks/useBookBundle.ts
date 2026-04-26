import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { BundleItem } from "./useBundle";

export interface BookBundleInput {
  bundleId: string;
  totalCredits: number;
  items: BundleItem[];
  targetJobId: string;
  subscriptionId: string;
  customerId: string;
}

interface SpendHandlesResult {
  success?: boolean;
  error?: string;
  balance?: number;
  required?: number;
  new_balance?: number;
}

export class BookBundleError extends Error {
  code:
    | "insufficient_handles"
    | "spend_failed"
    | "task_insert_failed"
    | "subscription_not_found";
  balance?: number;
  required?: number;

  constructor(
    code: BookBundleError["code"],
    message: string,
    extras?: { balance?: number; required?: number },
  ) {
    super(message);
    this.code = code;
    this.balance = extras?.balance;
    this.required = extras?.required;
  }
}

// Books a bundle onto an existing routine job:
// 1. Hold credits via spend_handles RPC.
// 2. Insert one job_tasks row per bundle_item with task_type='bundle'.
// 3. On partial failure (credits debited but task insert errored), write a
//    billing_exceptions HIGH row so ops can reconcile manually.
export function useBookBundle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: BookBundleInput) => {
      const {
        bundleId,
        totalCredits,
        items,
        targetJobId,
        subscriptionId,
        customerId,
      } = input;

      // Step 1: spend_handles. RPC returns JSONB with success/error/balance.
      const { data: spendData, error: spendErr } = await supabase.rpc("spend_handles", {
        p_subscription_id: subscriptionId,
        p_customer_id: customerId,
        p_amount: totalCredits,
        p_reference_id: bundleId,
      });
      if (spendErr) {
        throw new BookBundleError("spend_failed", spendErr.message);
      }
      const spend = (spendData ?? {}) as SpendHandlesResult;
      if (!spend.success) {
        if (spend.error === "insufficient_handles") {
          throw new BookBundleError(
            "insufficient_handles",
            "Not enough credits to book this bundle.",
            { balance: spend.balance, required: spend.required },
          );
        }
        if (spend.error === "subscription_not_found") {
          throw new BookBundleError("subscription_not_found", "Subscription not found.");
        }
        throw new BookBundleError(
          "spend_failed",
          spend.error ?? "Could not hold credits.",
        );
      }

      // Step 2: insert one job_tasks row per bundle_item.
      // job_tasks types ARE in types.ts (Phase 4 + PR #39).
      const taskRows = items.map((item) => ({
        job_id: targetJobId,
        sku_id: item.sku_id,
        task_type: "bundle" as const,
        description: item.label,
        credits_estimated: item.credits,
        status: "pending" as const,
      }));
      const { error: taskErr } = await supabase.from("job_tasks").insert(taskRows);

      if (taskErr) {
        // Credits already debited — log a billing_exceptions row so ops can
        // reconcile manually. Do NOT attempt automated refund here; this
        // matches the stripe-webhook + process-credit-pack-autopay precedent
        // of using billing_exceptions as the escape valve for partial-success
        // states.
        await supabase.from("billing_exceptions").insert({
          type: "bundle_routing_failed",
          severity: "HIGH",
          entity_type: "job",
          entity_id: targetJobId,
          customer_id: customerId,
          status: "OPEN",
          next_action: `Bundle ${bundleId} routing failed for job ${targetJobId}; ${totalCredits} credits already held. Task insert error: ${taskErr.message}`,
        });
        throw new BookBundleError(
          "task_insert_failed",
          "Credits were held but the bundle could not be added to your visit. Support has been notified.",
        );
      }

      return {
        targetJobId,
        creditsHeld: totalCredits,
        newBalance: spend.new_balance ?? null,
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer_jobs"] });
      queryClient.invalidateQueries({ queryKey: ["handle_balance"] });
    },
  });
}
