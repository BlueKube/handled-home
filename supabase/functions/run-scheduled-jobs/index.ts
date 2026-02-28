import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/** Helper: format YYYY-MM-DD from a Date */
function fmtDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

/** Start a cron_run_log entry, returns its id */
async function startRun(
  supabase: ReturnType<typeof createClient>,
  functionName: string,
  idempotencyKey: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .from("cron_run_log")
    .insert({
      function_name: functionName,
      idempotency_key: idempotencyKey,
      started_at: new Date().toISOString(),
      status: "running",
    })
    .select("id")
    .single();
  if (error) {
    console.error(`Failed to start cron_run_log for ${functionName}:`, error.message);
    return null;
  }
  return data.id;
}

/** Finish a cron_run_log entry */
async function finishRun(
  supabase: ReturnType<typeof createClient>,
  runId: string | null,
  status: "success" | "partial_failure" | "failed",
  resultSummary?: Record<string, unknown>,
  errorMessage?: string,
) {
  if (!runId) return;
  const { error } = await supabase
    .from("cron_run_log")
    .update({
      status,
      completed_at: new Date().toISOString(),
      result_summary: resultSummary ?? null,
      error_message: errorMessage ?? null,
    })
    .eq("id", runId);
  if (error) console.error(`Failed to finish cron_run_log ${runId}:`, error.message);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  const now = new Date();
  const today = fmtDate(now);
  const dayOfWeek = now.getUTCDay();
  const isMonday = dayOfWeek === 1;

  // Orchestrator-level log
  const orchKey = `orchestrator:${today}`;
  const orchRunId = await startRun(supabase, "run-scheduled-jobs", orchKey);

  try {
    // Parse which job(s) to run
    let body: { job?: string } = {};
    try {
      body = await req.json();
    } catch {
      // No body = run all daily jobs
    }

    const job = body.job || "all";
    const subResults: Record<string, { status: string; data?: unknown; error?: string }> = {};

    // ── Daily: BYOC lifecycle transitions ──
    if (job === "all" || job === "byoc_lifecycle") {
      const subKey = `byoc_lifecycle:${today}`;
      const subRunId = await startRun(supabase, "byoc_lifecycle", subKey);
      console.log("Running BYOC lifecycle transitions...");
      const { data, error } = await supabase.rpc("run_byoc_lifecycle_transitions");
      if (error) {
        console.error("BYOC lifecycle failed:", error);
        subResults.byoc_lifecycle = { status: "failed", error: error.message };
        await finishRun(supabase, subRunId, "failed", undefined, error.message);
      } else {
        subResults.byoc_lifecycle = { status: "success", data };
        console.log("BYOC lifecycle result:", data);
        await finishRun(supabase, subRunId, "success", { result: data });
      }
    }

    // ── Weekly (Monday): BYOC bonus computation ──
    if (job === "compute_byoc_bonuses" || (job === "all" && isMonday)) {
      const prevMonday = new Date(now);
      prevMonday.setUTCDate(now.getUTCDate() - 7);
      const mondayOffset = prevMonday.getUTCDay() === 0 ? 6 : prevMonday.getUTCDay() - 1;
      prevMonday.setUTCDate(prevMonday.getUTCDate() - mondayOffset);
      const weekStart = fmtDate(prevMonday);

      const subKey = `compute_byoc_bonuses:${weekStart}`;
      const subRunId = await startRun(supabase, "compute_byoc_bonuses", subKey);
      console.log("Running BYOC bonus computation...");
      const { data, error } = await supabase.rpc("compute_byoc_bonuses", {
        p_week_start: weekStart,
      });
      if (error) {
        console.error("BYOC bonuses failed:", error);
        subResults.compute_byoc_bonuses = { status: "failed", error: error.message };
        await finishRun(supabase, subRunId, "failed", undefined, error.message);
      } else {
        subResults.compute_byoc_bonuses = { status: "success", data };
        console.log("BYOC bonuses result:", data);
        await finishRun(supabase, subRunId, "success", { result: data, week_start: weekStart });
      }
    }

    // ── Weekly (Monday): Provider weekly rollups ──
    if (job === "provider_weekly_rollups" || (job === "all" && isMonday)) {
      const subKey = `provider_weekly_rollups:${today}`;
      const subRunId = await startRun(supabase, "provider_weekly_rollups", subKey);
      console.log("Running provider weekly rollups...");
      const { data, error } = await supabase.rpc("compute_provider_weekly_rollups");
      if (error) {
        console.error("Weekly rollups failed:", error);
        subResults.provider_weekly_rollups = { status: "failed", error: error.message };
        await finishRun(supabase, subRunId, "failed", undefined, error.message);
      } else {
        subResults.provider_weekly_rollups = { status: "success", data };
        console.log("Weekly rollups result:", data);
        await finishRun(supabase, subRunId, "success", { result: data });
      }
    }

    // Determine orchestrator outcome
    const failedSubs = Object.entries(subResults).filter(([, v]) => v.status === "failed");
    const totalSubs = Object.keys(subResults).length;
    const orchStatus = failedSubs.length === 0
      ? "success"
      : failedSubs.length === totalSubs
        ? "failed"
        : "partial_failure";

    const orchSummary = {
      sub_jobs_ran: totalSubs,
      sub_jobs_failed: failedSubs.length,
      sub_job_results: subResults,
    };

    await finishRun(supabase, orchRunId, orchStatus, orchSummary,
      failedSubs.length > 0 ? failedSubs.map(([k, v]) => `${k}: ${v.error}`).join("; ") : undefined);

    return new Response(
      JSON.stringify({ success: orchStatus === "success", results: subResults, errors: failedSubs.length > 0 ? failedSubs.map(([k, v]) => `${k}: ${v.error}`) : undefined }),
      {
        status: orchStatus === "success" ? 200 : 207,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    await finishRun(supabase, orchRunId, "failed", undefined, err.message);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
