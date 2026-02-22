import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not configured");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    const body = await req.text();
    const sig = req.headers.get("stripe-signature");

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

    // Deduplicate webhook events
    const { error: dedupeErr } = await supabase
      .from("payment_webhook_events")
      .insert({
        processor_event_id: event.id,
        event_type: event.type,
        payload: event,
        processed: false,
      });

    if (dedupeErr?.code === "23505") {
      logStep("Duplicate webhook event, skipping", { eventId: event.id });
      return new Response(JSON.stringify({ received: true, duplicate: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    logStep("Processing event", { type: event.type, id: event.id });

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as any;
        const userId = session.metadata?.supabase_user_id;
        const planId = session.metadata?.plan_id;
        const stripeCustomerId = session.customer;
        const stripeSubscriptionId = session.subscription;

        if (userId && planId) {
          const { data: plan } = await supabase
            .from("plans")
            .select("current_entitlement_version_id")
            .eq("id", planId)
            .single();

          const now = new Date();
          const billingEnd = new Date(now);
          billingEnd.setUTCDate(billingEnd.getUTCDate() + 28);

          const propertyId = session.metadata?.property_id;
          let serviceWeekFields: Record<string, string | null> = {
            current_service_week_start_at: null,
            current_service_week_end_at: null,
            next_service_week_start_at: null,
            next_service_week_end_at: null,
          };

          let zoneId = session.metadata?.zone_id;
          if (!zoneId && propertyId) {
            const { data: prop } = await supabase
              .from("properties")
              .select("zip_code")
              .eq("id", propertyId)
              .single();
            if (prop?.zip_code) {
              const { data: zones } = await supabase
                .from("zones")
                .select("id, zip_codes")
                .eq("status", "active");
              const matchedZone = zones?.find((z: any) => z.zip_codes?.includes(prop.zip_code));
              if (matchedZone) zoneId = matchedZone.id;
            }
          }

          if (zoneId) {
            const { data: swConfig } = await supabase
              .from("zone_service_week_config")
              .select("*")
              .eq("zone_id", zoneId)
              .maybeSingle();

            const anchorDay = swConfig?.anchor_day ?? 1;
            const currentDow = now.getUTCDay();
            const daysSinceAnchor = (currentDow - anchorDay + 7) % 7;
            const swStart = new Date(now);
            swStart.setUTCDate(swStart.getUTCDate() - daysSinceAnchor);
            swStart.setUTCHours(0, 0, 0, 0);
            const swEnd = new Date(swStart);
            swEnd.setUTCDate(swEnd.getUTCDate() + 7);
            const nextSwStart = new Date(swEnd);
            const nextSwEnd = new Date(nextSwStart);
            nextSwEnd.setUTCDate(nextSwEnd.getUTCDate() + 7);

            serviceWeekFields = {
              current_service_week_start_at: swStart.toISOString(),
              current_service_week_end_at: swEnd.toISOString(),
              next_service_week_start_at: nextSwStart.toISOString(),
              next_service_week_end_at: nextSwEnd.toISOString(),
            };
          }

          const { data: sub } = await supabase
            .from("subscriptions")
            .insert({
              customer_id: userId,
              plan_id: planId,
              entitlement_version_id: plan?.current_entitlement_version_id,
              status: "active",
              stripe_customer_id: stripeCustomerId,
              stripe_subscription_id: stripeSubscriptionId,
              current_period_start: now.toISOString(),
              current_period_end: billingEnd.toISOString(),
              access_activated_at: now.toISOString(),
              billing_cycle_start_at: now.toISOString(),
              billing_cycle_end_at: billingEnd.toISOString(),
              next_billing_at: billingEnd.toISOString(),
              billing_cycle_length_days: 28,
              zone_id: zoneId || null,
              property_id: propertyId || null,
              ...serviceWeekFields,
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

            await supabase
              .from("customer_plan_selections")
              .update({ status: "locked" })
              .eq("customer_id", userId)
              .eq("status", "draft");

            // Save payment method if available
            if (session.payment_method_types?.includes("card") && stripeCustomerId) {
              try {
                const paymentMethods = await stripe.paymentMethods.list({
                  customer: stripeCustomerId,
                  type: "card",
                  limit: 1,
                });
                if (paymentMethods.data.length > 0) {
                  const pm = paymentMethods.data[0];
                  await supabase.from("customer_payment_methods").upsert({
                    customer_id: userId,
                    processor_ref: pm.id,
                    brand: pm.card?.brand || null,
                    last4: pm.card?.last4 || null,
                    exp_month: pm.card?.exp_month || null,
                    exp_year: pm.card?.exp_year || null,
                    is_default: true,
                    status: "active",
                  }, { onConflict: "customer_id,processor_ref", ignoreDuplicates: true });
                }
              } catch (e) {
                logStep("Failed to save payment method", { error: (e as Error).message });
              }
            }
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

          // Find internal subscription and create billing exception
          const { data: internalSub } = await supabase
            .from("subscriptions")
            .select("id, customer_id")
            .eq("stripe_subscription_id", stripeSubId)
            .single();

          if (internalSub) {
            // Record payment attempt
            await supabase.from("customer_payments").insert({
              invoice_id: null as any, // May not have internal invoice yet
              customer_id: internalSub.customer_id,
              amount_cents: invoice.amount_due || 0,
              processor_payment_id: invoice.payment_intent || null,
              status: "FAILED",
              attempt_number: (invoice.attempt_count || 1),
            }).then(() => {});

            // Create billing exception
            await supabase.from("billing_exceptions").insert({
              type: "PAYMENT_FAILED",
              severity: "HIGH",
              entity_type: "subscription",
              entity_id: internalSub.id,
              customer_id: internalSub.customer_id,
              next_action: "Retry payment or update payment method",
            });
          }
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

          // Update internal invoice if exists
          const { data: internalSub } = await supabase
            .from("subscriptions")
            .select("id, customer_id")
            .eq("stripe_subscription_id", stripeSubId)
            .single();

          if (internalSub) {
            // Mark matching invoices as paid
            await supabase
              .from("customer_invoices")
              .update({ status: "PAID", paid_at: new Date().toISOString(), processor_invoice_id: invoice.id })
              .eq("customer_id", internalSub.customer_id)
              .eq("status", "DUE");

            // Record successful payment
            await supabase.from("customer_payments").insert({
              customer_id: internalSub.customer_id,
              amount_cents: invoice.amount_paid || 0,
              processor_payment_id: invoice.payment_intent || null,
              status: "SUCCEEDED",
            }).then(() => {});

            // Resolve related billing exceptions
            await supabase
              .from("billing_exceptions")
              .update({ status: "RESOLVED", resolved_at: new Date().toISOString() })
              .eq("customer_id", internalSub.customer_id)
              .eq("type", "PAYMENT_FAILED")
              .eq("status", "OPEN");
          }
        }
        break;
      }

      case "charge.dispute.created": {
        const dispute = event.data.object as any;
        const chargeId = dispute.charge;

        // Create billing exception for dispute
        await supabase.from("billing_exceptions").insert({
          type: "DISPUTE",
          severity: "HIGH",
          entity_type: "charge",
          entity_id: null,
          next_action: "Review dispute and provide evidence",
        });

        logStep("Dispute created", { chargeId, amount: dispute.amount });
        break;
      }

      case "transfer.paid": {
        const transfer = event.data.object as any;
        // Update provider payout
        await supabase
          .from("provider_payouts")
          .update({ status: "PAID", paid_at: new Date().toISOString() })
          .eq("processor_payout_id", transfer.id);

        logStep("Transfer paid", { transferId: transfer.id });
        break;
      }

      case "transfer.failed": {
        const transfer = event.data.object as any;
        await supabase
          .from("provider_payouts")
          .update({ status: "FAILED" })
          .eq("processor_payout_id", transfer.id);

        // Get payout to create exception
        const { data: payout } = await supabase
          .from("provider_payouts")
          .select("id, provider_org_id")
          .eq("processor_payout_id", transfer.id)
          .single();

        if (payout) {
          await supabase.from("billing_exceptions").insert({
            type: "PAYOUT_FAILED",
            severity: "HIGH",
            entity_type: "provider_payout",
            entity_id: payout.id,
            provider_org_id: payout.provider_org_id,
            next_action: "Check provider payout account status",
          });
        }

        logStep("Transfer failed", { transferId: transfer.id });
        break;
      }
    }

    // Mark webhook as processed
    await supabase
      .from("payment_webhook_events")
      .update({ processed: true, processed_at: new Date().toISOString() })
      .eq("processor_event_id", event.id);

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
