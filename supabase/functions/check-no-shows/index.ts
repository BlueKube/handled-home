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

    const now = new Date().toISOString();
    const hourKey = now.slice(0, 13); // YYYY-MM-DDTHH
    const idempotencyKey = `check-no-shows:${hourKey}`;

    // Check idempotency
    const { data: existingRun } = await supabase
      .from("cron_run_log")
      .select("id, status")
      .eq("idempotency_key", idempotencyKey)
      .eq("status", "completed")
      .maybeSingle();

    if (existingRun) {
      return new Response(
        JSON.stringify({ status: "skipped", reason: "Already completed this hour" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create run log
    const { data: runLog, error: runLogErr } = await supabase
      .from("cron_run_log")
      .insert({
        function_name: "check-no-shows",
        idempotency_key: idempotencyKey,
        status: "running",
        started_at: now,
      })
      .select("id")
      .single();

    if (runLogErr) throw runLogErr;
    const runId = runLog.id;

    // Find jobs past their latest_start_by that haven't started
    const { data: noShowJobs, error: nsErr } = await supabase
      .from("jobs")
      .select("id, zone_id, customer_id, provider_org_id, scheduled_date, latest_start_by, status")
      .in("status", ["NOT_STARTED", "assigned"])
      .not("latest_start_by", "is", null)
      .lt("latest_start_by", now)
      .limit(100);

    if (nsErr) throw nsErr;

    let reassigned = 0;
    let flagged = 0;
    let errors = 0;
    const results: any[] = [];

    for (const job of noShowJobs ?? []) {
      try {
        const originalProviderId = job.provider_org_id;

        // Get the job's category
        const { data: jobSkus } = await supabase
          .from("job_skus")
          .select("sku_id, service_skus(category)")
          .eq("job_id", job.id)
          .limit(1);

        const skuRow = jobSkus?.[0] as { sku_id: string; service_skus: { category: string } | null } | undefined;
        const category = skuRow?.service_skus?.category ?? "lawn_care";

        // Find backup providers for this zone+category
        const { data: backups } = await supabase
          .from("zone_category_providers")
          .select("provider_org_id, priority_rank, performance_score")
          .eq("zone_id", job.zone_id)
          .eq("category", category)
          .eq("role", "BACKUP")
          .eq("status", "ACTIVE")
          .neq("provider_org_id", originalProviderId ?? "")
          .order("priority_rank", { ascending: true });

        let newProviderId: string | null = null;

        // Try each backup
        for (const backup of backups ?? []) {
          // Check capacity
          const { count } = await supabase
            .from("jobs")
            .select("id", { count: "exact", head: true })
            .eq("provider_org_id", backup.provider_org_id)
            .eq("scheduled_date", job.scheduled_date)
            .not("status", "eq", "CANCELED");

          if ((count ?? 0) < 15) {
            newProviderId = backup.provider_org_id;
            break;
          }
        }

        if (newProviderId) {
          // Reassign
          await supabase
            .from("jobs")
            .update({ provider_org_id: newProviderId })
            .eq("id", job.id);

          // Log
          await supabase.from("job_assignment_log").insert({
            job_id: job.id,
            provider_org_id: newProviderId,
            previous_provider_org_id: originalProviderId,
            assignment_reason: "no_show_reassign",
            explain_customer: "We're sending a different pro to keep your Service Day on track.",
            explain_provider: "This job was reassigned due to the original provider not starting on time.",
            explain_admin: `No-show detected: job ${job.id} past latest_start_by. Reassigned from ${originalProviderId} to ${newProviderId}.`,
            score_breakdown: { trigger: "no_show", original_provider: originalProviderId },
            assigned_by: "system",
          });

          // Notify customer via event bus
          if (job.customer_id) {
            await supabase.rpc("emit_notification_event", {
              p_event_type: "CUSTOMER_PROVIDER_REASSIGNED",
              p_idempotency_key: `noshow_customer:${job.id}:${newProviderId}`,
              p_audience_type: "CUSTOMER",
              p_audience_user_id: job.customer_id,
              p_priority: "CRITICAL",
              p_payload: { job_id: job.id, date: job.scheduled_date },
            });
          }

          // Notify the no-show (original) provider via event bus
          if (originalProviderId) {
            await supabase.rpc("emit_notification_event", {
              p_event_type: "PROVIDER_NO_SHOW_PING",
              p_idempotency_key: `noshow_provider:${job.id}:${originalProviderId}`,
              p_audience_type: "PROVIDER",
              p_audience_org_id: originalProviderId,
              p_priority: "SERVICE",
              p_payload: { job_id: job.id },
            });
          }

          // Notify new provider via event bus
          await supabase.rpc("emit_notification_event", {
            p_event_type: "PROVIDER_JOB_REASSIGNED",
            p_idempotency_key: `noshow_reassign:${job.id}:${newProviderId}`,
            p_audience_type: "PROVIDER",
            p_audience_org_id: newProviderId,
            p_priority: "SERVICE",
            p_payload: { job_id: job.id },
          });

          reassigned++;
          results.push({ job_id: job.id, action: "reassigned", new_provider: newProviderId });
        } else {
          // No backup available — flag for admin
          await supabase.from("job_assignment_log").insert({
            job_id: job.id,
            provider_org_id: null,
            previous_provider_org_id: originalProviderId,
            assignment_reason: "no_show_no_backup",
            explain_customer: "We're working on rescheduling your service and will update you shortly.",
            explain_provider: null,
            explain_admin: `No-show detected for job ${job.id}. No backup available for reassignment.`,
            score_breakdown: { trigger: "no_show", original_provider: originalProviderId },
            assigned_by: "system",
          });

          // Look up zone name for human-readable notifications
          const { data: zoneRow } = await supabase
            .from("zones")
            .select("name")
            .eq("id", job.zone_id)
            .single();

          // Notify admins via event bus
          await supabase.rpc("emit_notification_event", {
            p_event_type: "ADMIN_ZONE_ALERT_BACKLOG",
            p_idempotency_key: `noshow_admin:${job.id}`,
            p_audience_type: "ADMIN",
            p_priority: "CRITICAL",
            p_payload: {
              job_id: job.id,
              zone_name: zoneRow?.name ?? job.zone_id,
              unassigned_count: 1,
            },
          });

          flagged++;
          results.push({ job_id: job.id, action: "flagged_admin" });
        }
      } catch (err) {
        errors++;
        results.push({ job_id: job.id, action: "error", message: String(err) });
      }
    }

    // Update run log
    await supabase
      .from("cron_run_log")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        result_summary: {
          total: (noShowJobs ?? []).length,
          reassigned,
          flagged,
          errors,
        },
      })
      .eq("id", runId);

    return new Response(
      JSON.stringify({
        status: "completed",
        run_id: runId,
        summary: { total: (noShowJobs ?? []).length, reassigned, flagged, errors },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("check-no-shows error:", error);
    return new Response(
      JSON.stringify({ status: "error", message: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
