import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireCronSecret } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    requireCronSecret(req);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const today = new Date().toISOString().split("T")[0];
    const idempotencyKey = `assign-jobs:${today}`;

    // Check idempotency
    const { data: existingRun } = await supabase
      .from("cron_run_log")
      .select("id, status")
      .eq("idempotency_key", idempotencyKey)
      .eq("status", "completed")
      .maybeSingle();

    if (existingRun) {
      return new Response(
        JSON.stringify({ status: "skipped", reason: "Already completed today", run_id: existingRun.id }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create run log entry
    const { data: runLog, error: runLogErr } = await supabase
      .from("cron_run_log")
      .insert({
        function_name: "assign-jobs",
        idempotency_key: idempotencyKey,
        status: "running",
        started_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (runLogErr) throw runLogErr;
    const runId = runLog.id;

    // Find unassigned jobs for today and future dates
    // Jobs that have status NOT_STARTED and no provider_org_id or a placeholder one
    const { data: unassignedJobs, error: jobsErr } = await supabase
      .from("jobs")
      .select("id, zone_id, scheduled_date, provider_org_id, status")
      .in("status", ["NOT_STARTED", "assigned"])
      .gte("scheduled_date", today)
      .order("scheduled_date", { ascending: true })
      .limit(200);

    if (jobsErr) throw jobsErr;

    // Filter to jobs that need assignment (no provider_org_id set)
    const jobsToAssign = (unassignedJobs ?? []).filter(
      (j) => !j.provider_org_id
    );

    const results: { job_id: string; result: any }[] = [];
    let assigned = 0;
    let overflow = 0;
    let skipped = 0;
    let errors = 0;

    // Track assignments per provider for batch notification
    const assignmentsByProvider = new Map<string, string[]>();

    for (const job of jobsToAssign) {
      try {
        const { data, error } = await supabase.rpc("auto_assign_job", {
          p_job_id: job.id,
        });

        if (error) {
          errors++;
          results.push({ job_id: job.id, result: { status: "error", message: error.message } });
        } else {
          const status = data?.status;
          if (status === "assigned") {
            assigned++;
            const provId = data?.provider_org_id;
            if (provId) {
              if (!assignmentsByProvider.has(provId)) assignmentsByProvider.set(provId, []);
              assignmentsByProvider.get(provId)!.push(job.id);
            }
          }
          else if (status === "overflow") overflow++;
          else skipped++;
          results.push({ job_id: job.id, result: data });
        }
      } catch (err) {
        errors++;
        results.push({ job_id: job.id, result: { status: "error", message: String(err) } });
      }
    }

    // Emit PROVIDER_JOBS_ASSIGNED per provider org
    for (const [provOrgId, jobIds] of assignmentsByProvider) {
      await supabase.rpc("emit_notification_event", {
        p_event_type: "PROVIDER_JOBS_ASSIGNED",
        p_idempotency_key: `jobs_assigned:${provOrgId}:${today}`,
        p_audience_type: "PROVIDER",
        p_audience_org_id: provOrgId,
        p_priority: "SERVICE",
        p_payload: { count: jobIds.length, date: today, job_ids: jobIds },
      });
    }

    // Emit admin backlog alert if overflow is significant
    if (overflow >= 3) {
      await supabase.rpc("emit_notification_event", {
        p_event_type: "ADMIN_ZONE_ALERT_BACKLOG",
        p_idempotency_key: `zone_backlog:${today}`,
        p_audience_type: "ADMIN",
        p_priority: "CRITICAL",
        p_payload: { unassigned_count: overflow, date: today },
      });
    }

    // Update run log
    await supabase
      .from("cron_run_log")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        result_summary: {
          total: jobsToAssign.length,
          assigned,
          overflow,
          skipped,
          errors,
        },
      })
      .eq("id", runId);

    return new Response(
      JSON.stringify({
        status: "completed",
        run_id: runId,
        summary: { total: jobsToAssign.length, assigned, overflow, skipped, errors },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("assign-jobs error:", error);
    return new Response(
      JSON.stringify({ status: "error", message: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
