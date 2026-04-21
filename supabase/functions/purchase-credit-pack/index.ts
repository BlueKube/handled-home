import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { requireUserJwt } from "../_shared/auth.ts";

type PackId = "starter" | "homeowner" | "year_round";

// Credits per pack — source of truth mirrors src/lib/creditPacks.ts.
// Kept server-side so the webhook can grant credits without trusting
// anything from the request body beyond the pack id.
const PACK_CREDITS: Record<PackId, number> = {
  starter: 300,
  homeowner: 600,
  year_round: 1200,
};

function envForPack(packId: PackId): string {
  // e.g. STRIPE_CREDIT_PACK_HOMEOWNER_PRICE_ID
  return `STRIPE_CREDIT_PACK_${packId.toUpperCase()}_PRICE_ID`;
}

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  const preflight = handleCors(req);
  if (preflight) return preflight;

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not configured");

    const { user, supabase } = await requireUserJwt(req);

    const body = await req.json().catch(() => ({}));
    const packId = body.pack_id as PackId | undefined;
    const successUrl = body.success_url as string | undefined;
    const cancelUrl = body.cancel_url as string | undefined;
    const customerEmail = (body.customer_email as string | undefined) ?? user.email ?? undefined;

    if (!packId || !(packId in PACK_CREDITS)) {
      return jsonResponse(400, { error: "Invalid pack_id" });
    }
    const credits = PACK_CREDITS[packId];

    // Resolve pack → Stripe price id. When the env var is missing we return
    // a "not configured" shape so the frontend toast can explain that
    // top-ups aren't live yet (matches create-checkout-session:56-60's dev
    // fallback pattern).
    const priceEnv = envForPack(packId);
    const priceId = Deno.env.get(priceEnv);
    if (!priceId) {
      return jsonResponse(200, {
        url: null,
        message: `Credit pack checkout not yet configured (${priceEnv} unset).`,
      });
    }

    // Find the customer's active subscription — webhook needs it to credit
    // the correct balance row. No active sub = no top-up.
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("id")
      .eq("customer_id", user.id)
      .eq("status", "active")
      .maybeSingle();

    if (!subscription?.id) {
      return jsonResponse(409, { error: "Active subscription required" });
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Reuse or create the Stripe customer.
    let stripeCustomerId: string | undefined;
    if (customerEmail) {
      const customers = await stripe.customers.list({ email: customerEmail, limit: 1 });
      if (customers.data.length > 0) {
        stripeCustomerId = customers.data[0].id;
      }
    }
    if (!stripeCustomerId) {
      const created = await stripe.customers.create({
        email: customerEmail,
        metadata: { supabase_user_id: user.id },
      });
      stripeCustomerId = created.id;
    }

    const metadata: Record<string, string> = {
      supabase_user_id: user.id,
      subscription_id: subscription.id,
      pack_id: packId,
      credits: String(credits),
      origin: "credit_pack_topup",
    };

    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: "payment",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl || `${req.headers.get("origin")}/customer/credits?purchase=success`,
      cancel_url: cancelUrl || `${req.headers.get("origin")}/customer/credits?purchase=cancel`,
      metadata,
      payment_intent_data: { metadata },
    });

    return jsonResponse(200, { url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("purchase-credit-pack failed:", message);
    return jsonResponse(500, { error: message });
  }
});
