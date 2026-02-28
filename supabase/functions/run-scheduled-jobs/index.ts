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

type Client = ReturnType<typeof createClient>;

/** Start a cron_run_log entry via RPC, returns its id */
async function startRun(
  supabase: Client,
  functionName: string,
  idempotencyKey: string,
): Promise<string | null> {
  const { data, error } = await supabase.rpc("start_cron_run", {
    p_function_name: functionName,
    p_idempotency_key: idempotencyKey,
  });
  if (error) {
    console.error(`Failed to start cron_run_log for ${functionName}:`, error.message);
    return null;
  }
  return data as string;
}

/** Finish a cron_run_log entry via RPC */
async function finishRun(
  supabase: Client,
  runId: string | null,
  status: "success" | "partial_failure" | "failed",
  resultSummary?: Record<string, unknown>,
  errorMessage?: string,
) {
  if (!runId) return;
  const { error } = await supabase.rpc("finish_cron_run", {
    p_run_id: runId,
    p_status: status,
    p_result_summary: resultSummary ?? null,
    p_error_message: errorMessage ?? null,
  });
  if (error) console.error(`Failed to finish cron_run_log ${runId}:`, error.message);
}

/** Run a single sub-job with its own cron_run_log entry */
async function runSubJob(
  supabase: Client,
  jobName: string,
  idempotencyKey: string,
  fn: () => Promise<{ data: unknown; error: { message: string } | null }>,
): Promise<{ status: string; data?: unknown; error?: string }> {
  const subRunId = await startRun(supabase, jobName, idempotencyKey);
  console.log(`Running ${jobName}...`);
  try {
    const { data, error } = await fn();
    if (error) {
      console.error(`${jobName} failed:`, error);
      await finishRun(supabase, subRunId, "failed", undefined, error.message);
      return { status: "failed", error: error.message };
    }
    console.log(`${jobName} result:`, data);
    await finishRun(supabase, subRunId, "success", { result: data });
    return { status: "success", data };
  } catch (err) {
    const msg = err?.message ?? String(err);
    console.error(`${jobName} threw:`, msg);
    await finishRun(supabase, subRunId, "failed", undefined, msg);
    return { status: "failed", error: msg };
  }
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

    // ── Daily: Quality score computation ──
    if (job === "all" || job === "quality_compute_daily") {
      subResults.quality_compute_daily = await runSubJob(
        supabase,
        "quality_compute_daily",
        `quality_compute_daily:${today}`,
        () => supabase.rpc("compute_provider_quality_scores"),
      );
    }

    // ── Daily: Training gates evaluation ──
    if (job === "all" || job === "training_gates_daily") {
      subResults.training_gates_daily = await runSubJob(
        supabase,
        "training_gates_daily",
        `training_gates_daily:${today}`,
        () => supabase.rpc("evaluate_training_gates"),
      );
    }

    // ── Daily: BYOC lifecycle transitions ──
    if (job === "all" || job === "byoc_lifecycle_daily") {
      subResults.byoc_lifecycle_daily = await runSubJob(
        supabase,
        "byoc_lifecycle_daily",
        `byoc_lifecycle_daily:${today}`,
        () => supabase.rpc("run_byoc_lifecycle_transitions"),
      );
    }

    // ── Weekly (Monday): BYOC bonus computation ──
    if (job === "byoc_bonuses_weekly" || (job === "all" && isMonday)) {
      const prevMonday = new Date(now);
      prevMonday.setUTCDate(now.getUTCDate() - 7);
      const mondayOffset = prevMonday.getUTCDay() === 0 ? 6 : prevMonday.getUTCDay() - 1;
      prevMonday.setUTCDate(prevMonday.getUTCDate() - mondayOffset);
      const weekStart = fmtDate(prevMonday);

      subResults.byoc_bonuses_weekly = await runSubJob(
        supabase,
        "byoc_bonuses_weekly",
        `byoc_bonuses_weekly:${weekStart}`,
        () => supabase.rpc("compute_byoc_bonuses", { p_week_start: weekStart }),
      );
    }

    // ── Weekly (Monday): Provider weekly rollups ──
    if (job === "provider_weekly_rollups_weekly" || (job === "all" && isMonday)) {
      subResults.provider_weekly_rollups_weekly = await runSubJob(
        supabase,
        "provider_weekly_rollups_weekly",
        `provider_weekly_rollups_weekly:${today}`,
        () => supabase.rpc("compute_provider_weekly_rollups"),
      );
    }

    // Determine orchestrator outcome
    const entries = Object.entries(subResults);
    const failedSubs = entries.filter(([, v]) => v.status === "failed");
    const successSubs = entries.filter(([, v]) => v.status === "success");
    const totalSubs = entries.length;
    const orchStatus = failedSubs.length === 0
      ? "success"
      : failedSubs.length === totalSubs
        ? "failed"
        : "partial_failure";

    const orchSummary = {
      sub_jobs_ran: totalSubs,
      sub_jobs_succeeded: successSubs.length,
      sub_jobs_failed: failedSubs.length,
      per_job: Object.fromEntries(entries.map(([k, v]) => [k, { status: v.status, error: v.error }])),
    };

    await finishRun(supabase, orchRunId, orchStatus, orchSummary,
      failedSubs.length > 0 ? failedSubs.map(([k, v]) => `${k}: ${v.error}`).join("; ") : undefined);

    return new Response(
      JSON.stringify({ success: orchStatus === "success", results: subResults }),
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
