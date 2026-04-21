import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { noCorsHeaders } from "../_shared/cors.ts";
import { requireCronSecret } from "../_shared/auth.ts";

// Pack catalog must stay in lockstep with src/lib/creditPacks.ts and with
// purchase-credit-pack/index.ts. Source of truth is duplicated across the
// frontend + two edge functions because each flow runs in a different
// environment (browser / user-session function / cron-session function).
const PACK_CREDITS: Record<string, number> = {
  starter: 300,
  homeowner: 600,
  year_round: 1200,
};
const PACK_PRICE_CENTS: Record<string, number> = {
  starter: 14900,
  homeowner: 26900,
  year_round: 47900,
};

function priceIdEnvFor(packId: string): string {
  return `STRIPE_CREDIT_PACK_${packId.toUpperCase()}_PRICE_ID`;
}

interface RunResult {
  processed: number;
  granted: number;
  skipped: number;
  errors: number;
}

async function flag(
  supabase: ReturnType<typeof createClient>,
  type: string,
  severity: "LOW" | "MED" | "HIGH",
  subscriptionId: string | null,
  customerId: string | null,
  message: string,
): Promise<void> {
  await supabase.from("billing_exceptions").insert({
    type,
    severity,
    entity_type: subscriptionId ? "subscription" : "autopay_run",
    entity_id: subscriptionId,
    customer_id: customerId,
    status: "OPEN",
    next_action: message,
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 405 });
  }

  try {
    requireCronSecret(req);
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 401,
      headers: noCorsHeaders,
    });
  }

  const result: RunResult = { processed: 0, granted: 0, skipped: 0, errors: 0 };

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not configured");
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Candidates: autopay_credits.enabled = true. Threshold filter happens
    // in JS because the metadata jsonb path needs a numeric cast that's
    // more robust inline than in PostgREST filter syntax.
    const { data: candidates, error: candErr } = await supabase
      .from("subscriptions")
      .select("id, customer_id, stripe_customer_id, handles_balance, metadata")
      .eq("status", "active")
      .filter("metadata->autopay_credits->>enabled", "eq", "true");

    if (candErr) throw candErr;

    for (const row of candidates ?? []) {
      result.processed += 1;

      const meta = (row.metadata ?? {}) as Record<string, unknown>;
      const autopay = (meta.autopay_credits ?? {}) as Record<string, unknown>;
      const packId = typeof autopay.pack_id === "string" ? autopay.pack_id : undefined;
      const threshold = Number(autopay.threshold);

      if (!packId || !(packId in PACK_CREDITS) || Number.isNaN(threshold) || threshold <= 0) {
        result.skipped += 1;
        await flag(
          supabase,
          "credit_pack_autopay_metadata_invalid",
          "MED",
          row.id,
          row.customer_id,
          `Autopay metadata invalid: pack=${packId}, threshold=${autopay.threshold}`,
        );
        continue;
      }

      const balance = row.handles_balance ?? 0;
      if (balance >= threshold) {
        result.skipped += 1;
        continue;
      }

      const priceEnv = priceIdEnvFor(packId);
      const priceId = Deno.env.get(priceEnv);
      if (!priceId) {
        result.skipped += 1;
        await flag(
          supabase,
          "credit_pack_autopay_price_unset",
          "HIGH",
          row.id,
          row.customer_id,
          `Env var ${priceEnv} unset — skipping autopay for this subscription`,
        );
        continue;
      }

      if (!row.stripe_customer_id) {
        result.skipped += 1;
        await flag(
          supabase,
          "credit_pack_autopay_no_stripe_customer",
          "HIGH",
          row.id,
          row.customer_id,
          "Subscription has no stripe_customer_id; can't off-session charge",
        );
        continue;
      }

      const { data: defaultPm } = await supabase
        .from("customer_payment_methods")
        .select("processor_ref")
        .eq("customer_id", row.customer_id)
        .eq("status", "active")
        .eq("is_default", true)
        .limit(1)
        .maybeSingle();

      if (!defaultPm?.processor_ref) {
        result.skipped += 1;
        await flag(
          supabase,
          "credit_pack_autopay_no_payment_method",
          "HIGH",
          row.id,
          row.customer_id,
          "No default active customer_payment_methods row",
        );
        continue;
      }

      let pi: Stripe.PaymentIntent;
      try {
        pi = await stripe.paymentIntents.create({
          amount: PACK_PRICE_CENTS[packId],
          currency: "usd",
          customer: row.stripe_customer_id,
          payment_method: defaultPm.processor_ref,
          off_session: true,
          confirm: true,
          metadata: {
            supabase_user_id: row.customer_id,
            subscription_id: row.id,
            pack_id: packId,
            credits: String(PACK_CREDITS[packId]),
            origin: "credit_pack_topup_autopay",
          },
        });
      } catch (err) {
        result.errors += 1;
        await flag(
          supabase,
          "credit_pack_autopay_declined",
          "HIGH",
          row.id,
          row.customer_id,
          `PaymentIntent failed: ${(err as Error).message}`,
        );
        continue;
      }

      if (pi.status !== "succeeded") {
        result.errors += 1;
        await flag(
          supabase,
          "credit_pack_autopay_unfinished",
          "HIGH",
          row.id,
          row.customer_id,
          `PaymentIntent ${pi.id} landed in status=${pi.status} (likely requires_action / SCA challenge)`,
        );
        continue;
      }

      const { error: rpcErr } = await supabase.rpc("grant_topup_credits", {
        p_subscription_id: row.id,
        p_customer_id: row.customer_id,
        p_credits: PACK_CREDITS[packId],
        p_pack_id: packId,
        p_idempotency_key: pi.id,
      });

      if (rpcErr) {
        result.errors += 1;
        await flag(
          supabase,
          "credit_pack_autopay_grant_failed",
          "HIGH",
          row.id,
          row.customer_id,
          `grant_topup_credits failed after PaymentIntent ${pi.id}: ${rpcErr.message}`,
        );
        continue;
      }

      await supabase.from("subscription_events").insert({
        subscription_id: row.id,
        source: "stripe",
        event_type: "credit_pack_autopay_charged",
        payload: {
          payment_intent_id: pi.id,
          pack_id: packId,
          credits: PACK_CREDITS[packId],
          amount_cents: PACK_PRICE_CENTS[packId],
        },
      });

      result.granted += 1;
    }

    return new Response(JSON.stringify(result), { headers: noCorsHeaders });
  } catch (err) {
    console.error("process-credit-pack-autopay failed:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message, ...result }),
      { status: 500, headers: noCorsHeaders },
    );
  }
});
