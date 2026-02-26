import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/**
 * send-email edge function — transactional email delivery via Resend.
 *
 * Expects to be called internally by process-notification-events.
 * Reads RESEND_API_KEY from secrets; if not configured, logs and marks
 * deliveries as SKIPPED (infrastructure-only mode).
 *
 * Body: { deliveries: Array<{ delivery_id, to_email, subject, html_body }> }
 */
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  const resendKey = Deno.env.get("RESEND_API_KEY");

  try {
    const { deliveries } = await req.json();

    if (!deliveries || !Array.isArray(deliveries) || deliveries.length === 0) {
      return new Response(
        JSON.stringify({ error: "No deliveries provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Infrastructure-only mode: no Resend key configured
    if (!resendKey) {
      console.log(
        `[send-email] RESEND_API_KEY not configured. Marking ${deliveries.length} email deliveries as SKIPPED.`
      );

      const ids = deliveries.map((d: { delivery_id: string }) => d.delivery_id);
      await supabase
        .from("notification_delivery")
        .update({
          status: "SKIPPED",
          error_message: "RESEND_API_KEY not configured — email delivery deferred",
          attempted_at: new Date().toISOString(),
        })
        .in("id", ids);

      return new Response(
        JSON.stringify({
          sent: 0,
          skipped: deliveries.length,
          reason: "RESEND_API_KEY not configured",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ─── Live mode: send via Resend ─────────────────────────
    let sentCount = 0;
    let failedCount = 0;

    for (const delivery of deliveries) {
      const { delivery_id, to_email, subject, html_body } = delivery;

      try {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${resendKey}`,
          },
          body: JSON.stringify({
            from: Deno.env.get("RESEND_FROM_EMAIL") ?? "Handled Home <notifications@handl.homes>",
            to: [to_email],
            subject,
            html: html_body,
          }),
        });

        const result = await res.json();

        if (res.ok && result.id) {
          await supabase
            .from("notification_delivery")
            .update({
              status: "SENT",
              provider_message_id: result.id,
              attempted_at: new Date().toISOString(),
            })
            .eq("id", delivery_id);
          sentCount++;
        } else {
          await supabase
            .from("notification_delivery")
            .update({
              status: "FAILED",
              error_code: String(res.status),
              error_message: JSON.stringify(result).slice(0, 500),
              attempted_at: new Date().toISOString(),
            })
            .eq("id", delivery_id);
          failedCount++;
        }
      } catch (emailErr) {
        const errMsg = emailErr instanceof Error ? emailErr.message : String(emailErr);
        await supabase
          .from("notification_delivery")
          .update({
            status: "FAILED",
            error_message: errMsg.slice(0, 500),
            attempted_at: new Date().toISOString(),
          })
          .eq("id", delivery_id);
        failedCount++;
      }
    }

    return new Response(
      JSON.stringify({ sent: sentCount, failed: failedCount }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error("[send-email] Fatal error:", errMsg);
    return new Response(
      JSON.stringify({ error: errMsg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
