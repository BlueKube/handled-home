import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireCronSecret } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    requireCronSecret(req);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } }
    );

    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split("T")[0];

    // Idempotency: check if already ran today
    const idempotencyKey = `reminders:${tomorrowStr}`;
    const { data: existing } = await supabase
      .from("cron_run_log")
      .select("id")
      .eq("idempotency_key", idempotencyKey)
      .eq("status", "completed")
      .maybeSingle();

    if (existing) {
      return new Response(
        JSON.stringify({ status: "already_ran", date: tomorrowStr }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Log run start
    const { data: runLog } = await supabase
      .from("cron_run_log")
      .insert({
        function_name: "send-reminders",
        idempotency_key: idempotencyKey,
        status: "running",
        started_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    // Find all jobs scheduled for tomorrow that aren't canceled/completed
    const { data: jobs, error: jobsErr } = await supabase
      .from("jobs")
      .select("id, customer_id, property_id, scheduled_date")
      .eq("scheduled_date", tomorrowStr)
      .not("status", "in", "(COMPLETED,CANCELED)");

    if (jobsErr) throw jobsErr;

    let emitted = 0;
    for (const job of jobs ?? []) {
      await supabase.rpc("emit_notification_event", {
        p_event_type: "CUSTOMER_SERVICE_REMINDER_24H",
        p_idempotency_key: `reminder_24h:${job.id}`,
        p_audience_type: "CUSTOMER",
        p_audience_user_id: job.customer_id,
        p_priority: "NORMAL",
        p_payload: {
          job_id: job.id,
          scheduled_date: job.scheduled_date,
        },
      });
      emitted++;
    }

    // Mark complete
    if (runLog) {
      await supabase
        .from("cron_run_log")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
          result_summary: { emitted, date: tomorrowStr },
        })
        .eq("id", runLog.id);
    }

    return new Response(
      JSON.stringify({ status: "ok", emitted, date: tomorrowStr }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("send-reminders error:", err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
