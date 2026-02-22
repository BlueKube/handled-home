import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not configured");

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16", httpClient: Stripe.createFetchHttpClient() });

    const body = await req.text();
    const sig = req.headers.get("stripe-signature");

    // For now, parse without signature verification (webhook secret can be added later)
    let event: Stripe.Event;
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (webhookSecret && sig) {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } else {
      event = JSON.parse(body);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as any;
        const userId = session.metadata?.supabase_user_id;
        const planId = session.metadata?.plan_id;
        const stripeCustomerId = session.customer;
        const stripeSubscriptionId = session.subscription;

        if (userId && planId) {
          // Fetch plan to get entitlement version
          const { data: plan } = await supabase
            .from("plans")
            .select("current_entitlement_version_id")
            .eq("id", planId)
            .single();

          // Create subscription record
          const { data: sub, error: subErr } = await supabase
            .from("subscriptions")
            .insert({
              customer_id: userId,
              plan_id: planId,
              entitlement_version_id: plan?.current_entitlement_version_id,
              status: "active",
              stripe_customer_id: stripeCustomerId,
              stripe_subscription_id: stripeSubscriptionId,
              current_period_start: new Date().toISOString(),
              current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            })
            .select()
            .single();

          if (sub) {
            await supabase.from("subscription_events").insert({
              subscription_id: sub.id,
              source: "stripe",
              event_type: "checkout_completed",
              payload: { session_id: session.id },
            });

            // Lock the draft routine
            await supabase
              .from("customer_plan_selections")
              .update({ status: "locked" })
              .eq("customer_id", userId)
              .eq("status", "draft");
          }
        }
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as any;
        const stripeSubId = sub.id;
        const status = sub.cancel_at_period_end ? "canceling" : sub.status;

        await supabase
          .from("subscriptions")
          .update({
            status,
            current_period_start: sub.current_period_start ? new Date(sub.current_period_start * 1000).toISOString() : null,
            current_period_end: sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null,
            cancel_at_period_end: sub.cancel_at_period_end,
          })
          .eq("stripe_subscription_id", stripeSubId);

        // Log event
        const { data: internalSub } = await supabase
          .from("subscriptions")
          .select("id")
          .eq("stripe_subscription_id", stripeSubId)
          .single();

        if (internalSub) {
          await supabase.from("subscription_events").insert({
            subscription_id: internalSub.id,
            source: "stripe",
            event_type: "subscription_updated",
            payload: { status: sub.status, cancel_at_period_end: sub.cancel_at_period_end },
          });
        }
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as any;
        await supabase
          .from("subscriptions")
          .update({ status: "canceled" })
          .eq("stripe_subscription_id", sub.id);

        const { data: internalSub } = await supabase
          .from("subscriptions")
          .select("id")
          .eq("stripe_subscription_id", sub.id)
          .single();

        if (internalSub) {
          await supabase.from("subscription_events").insert({
            subscription_id: internalSub.id,
            source: "stripe",
            event_type: "subscription_deleted",
            payload: {},
          });
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as any;
        const stripeSubId = invoice.subscription;
        if (stripeSubId) {
          await supabase
            .from("subscriptions")
            .update({ status: "past_due" })
            .eq("stripe_subscription_id", stripeSubId);
        }
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as any;
        const stripeSubId = invoice.subscription;
        if (stripeSubId) {
          await supabase
            .from("subscriptions")
            .update({ status: "active" })
            .eq("stripe_subscription_id", stripeSubId);
        }
        break;
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
