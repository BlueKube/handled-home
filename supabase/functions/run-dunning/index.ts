import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const today = new Date().toISOString().split("T")[0];
    const idempotencyKey = `run-dunning:${today}`;

    // Check idempotency
    const { data: existingRun } = await supabase
      .from("cron_run_log")
      .select("id, status")
      .eq("idempotency_key", idempotencyKey)
      .eq("status", "completed")
      .maybeSingle();

    if (existingRun) {
      return new Response(
        JSON.stringify({ status: "skipped", reason: "Already completed today" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create run log
    const { data: runLog, error: runLogErr } = await supabase
      .from("cron_run_log")
      .insert({
        function_name: "run-dunning",
        idempotency_key: idempotencyKey,
        status: "running",
        started_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (runLogErr) throw runLogErr;
    const runId = runLog.id;

    // Find subscriptions that need dunning progression
    // Step timing: step 1 = day 1, step 2 = day 3, step 3 = day 7, step 4 = day 10, step 5 = day 14
    const stepDayMap: Record<number, number> = { 0: 1, 1: 3, 2: 7, 3: 10, 4: 14 };

    const { data: dunningCandidates, error: candErr } = await supabase
      .from("subscriptions")
      .select("id, dunning_step, last_dunning_at, dunning_started_at, customer_id")
      .in("status", ["active", "past_due", "paused"])
      .gt("dunning_step", -1) // has dunning activity or needs it
      .not("dunning_started_at", "is", null);

    if (candErr) throw candErr;

    // Also find subscriptions with failed payments that haven't started dunning
    const { data: failedInvoices, error: failedErr } = await supabase
      .from("customer_invoices")
      .select("subscription_id, customer_id")
      .eq("status", "FAILED")
      .not("subscription_id", "is", null);

    if (failedErr) throw failedErr;

    // Combine: start dunning for failed invoices whose subscription hasn't started dunning
    const needsStart = (failedInvoices ?? []).filter(fi => {
      const existing = (dunningCandidates ?? []).find(dc => dc.id === fi.subscription_id);
      return !existing || existing.dunning_step === 0;
    });

    let stepped = 0;
    let started = 0;
    let errors = 0;
    const results: Array<{ subscription_id: string; step: number; result: string }> = [];

    // Start dunning for new failed subscriptions
    for (const fi of needsStart) {
      if (!fi.subscription_id) continue;
      try {
        const { data, error } = await supabase.rpc("run_dunning_step", {
          p_subscription_id: fi.subscription_id,
        });
        if (error) {
          errors++;
          results.push({ subscription_id: fi.subscription_id, step: 1, result: error.message });
        } else {
          started++;
          results.push({ subscription_id: fi.subscription_id, step: 1, result: data?.status ?? "ok" });
        }
      } catch (err) {
        errors++;
      }
    }

    // Progress existing dunning sequences based on timing
    for (const sub of dunningCandidates ?? []) {
      const currentStep = sub.dunning_step ?? 0;
      if (currentStep >= 5) continue; // Already completed dunning

      const daysSinceStart = sub.dunning_started_at
        ? Math.floor((Date.now() - new Date(sub.dunning_started_at).getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      const nextStepDay = stepDayMap[currentStep];
      if (nextStepDay === undefined || daysSinceStart < nextStepDay) continue;

      try {
        const { data, error } = await supabase.rpc("run_dunning_step", {
          p_subscription_id: sub.id,
        });
        if (error) {
          errors++;
          results.push({ subscription_id: sub.id, step: currentStep + 1, result: error.message });
        } else {
          stepped++;
          results.push({ subscription_id: sub.id, step: currentStep + 1, result: data?.status ?? "ok" });
        }
      } catch (err) {
        errors++;
      }
    }

    // Update run log
    await supabase
      .from("cron_run_log")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        result_summary: { started, stepped, errors, total: results.length, details: results },
      })
      .eq("id", runId);

    return new Response(
      JSON.stringify({ status: "completed", run_id: runId, started, stepped, errors }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("run-dunning error:", error);
    return new Response(
      JSON.stringify({ status: "error", message: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
