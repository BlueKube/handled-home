import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, serviceKey);

    const today = new Date().toISOString().split("T")[0];
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();

    // ── Phase 1: Gather source data in parallel ──

    const [
      jobsCompletedRes,
      jobsScheduledRes,
      jobIssues7dRes,
      credits7dRes,
      pastDueRes,
      referralsRes,
      applicationsRes,
      zonesRes,
      capsRes,
      subsRes,
      providerOrgsRes,
      openTicketsRes,
      refundsRes,
    ] = await Promise.all([
      sb.from("jobs").select("id, zone_id, provider_org_id, completed_at, arrived_at, departed_at").eq("status", "COMPLETED").gte("completed_at", sevenDaysAgo),
      sb.from("jobs").select("id", { count: "exact", head: true }).eq("scheduled_date", today),
      sb.from("job_issues").select("id, job_id").gte("created_at", sevenDaysAgo),
      sb.from("customer_credits").select("amount_cents").gte("created_at", sevenDaysAgo),
      sb.from("customer_invoices").select("id", { count: "exact", head: true }).eq("status", "PAST_DUE"),
      sb.from("referrals").select("id", { count: "exact", head: true }).eq("status", "ACTIVATED").gte("created_at", sevenDaysAgo),
      sb.from("provider_applications").select("id", { count: "exact", head: true }).gte("created_at", sevenDaysAgo),
      sb.from("zones").select("id, name, status").eq("status", "active"),
      sb.from("zone_service_day_capacity").select("zone_id, max_homes, assigned_count"),
      sb.from("subscriptions").select("zone_id").eq("status", "active"),
      sb.from("provider_orgs").select("id").eq("status", "ACTIVE"),
      sb.from("support_tickets").select("id", { count: "exact", head: true }).eq("status", "open"),
      sb.from("admin_adjustments").select("amount_cents").eq("adjustment_type", "refund").gte("created_at", sevenDaysAgo),
    ]);

    const completedJobs = jobsCompletedRes.data ?? [];
    const completedJobIds = completedJobs.map((j: any) => j.id);
    const jobIssues = jobIssues7dRes.data ?? [];

    // ── Phase 2: Scoped queries for proof data ──

    let proofExceptions = 0;
    const proofByJob: Record<string, boolean> = {}; // job_id -> has proof
    const requiredProofJobs = new Set<string>();

    if (completedJobIds.length > 0) {
      const [checklistRes, photosRes] = await Promise.all([
        sb.from("job_checklist_items").select("job_id, is_required").in("job_id", completedJobIds),
        sb.from("job_photos").select("job_id").in("job_id", completedJobIds),
      ]);

      const photosSet = new Set((photosRes.data ?? []).map((p: any) => p.job_id));
      (checklistRes.data ?? []).forEach((ci: any) => {
        if (ci.is_required) requiredProofJobs.add(ci.job_id);
      });
      requiredProofJobs.forEach((jid) => {
        proofByJob[jid] = photosSet.has(jid);
        if (!photosSet.has(jid)) proofExceptions++;
      });
    }

    // ── Build issue maps by zone and provider ──

    // Map job_id -> zone_id and provider_org_id from completed jobs
    const jobZoneMap: Record<string, string> = {};
    const jobProviderMap: Record<string, string> = {};
    completedJobs.forEach((j: any) => {
      if (j.zone_id) jobZoneMap[j.id] = j.zone_id;
      if (j.provider_org_id) jobProviderMap[j.id] = j.provider_org_id;
    });

    const issuesByZone: Record<string, number> = {};
    const issuesByProvider: Record<string, number> = {};
    jobIssues.forEach((i: any) => {
      const zoneId = jobZoneMap[i.job_id];
      const providerId = jobProviderMap[i.job_id];
      if (zoneId) issuesByZone[zoneId] = (issuesByZone[zoneId] || 0) + 1;
      if (providerId) issuesByProvider[providerId] = (issuesByProvider[providerId] || 0) + 1;
    });

    // ── Compute global KPIs ──

    const creditsCents = (credits7dRes.data ?? []).reduce((s: number, c: any) => s + (c.amount_cents || 0), 0);
    const refundsCents = (refundsRes.data ?? []).reduce((s: number, c: any) => s + (c.amount_cents || 0), 0);
    const issues7d = jobIssues.length;
    const issueRate = completedJobs.length > 0 ? Math.round((issues7d / completedJobs.length) * 100) : 0;

    const globalMetrics: Record<string, number> = {
      jobs_scheduled_today: jobsScheduledRes.count ?? 0,
      jobs_completed_7d: completedJobs.length,
      issues_7d: issues7d,
      issue_rate_7d: issueRate,
      proof_exceptions_7d: proofExceptions,
      credits_issued_7d_cents: creditsCents,
      refunds_issued_7d_cents: refundsCents,
      past_due_count: pastDueRes.count ?? 0,
      referrals_activated_7d: referralsRes.count ?? 0,
      provider_applications_7d: applicationsRes.count ?? 0,
      open_tickets: openTicketsRes.count ?? 0,
    };

    // Upsert daily snapshots
    const dailyRows = Object.entries(globalMetrics).map(([key, val]) => ({
      snapshot_date: today,
      metric_key: key,
      metric_value: val,
    }));

    for (const row of dailyRows) {
      await sb.from("ops_kpi_snapshots_daily")
        .upsert(row, { onConflict: "snapshot_date,metric_key" });
    }

    // Upsert realtime
    const realtimeRows = Object.entries(globalMetrics).map(([key, val]) => ({
      metric_key: key,
      metric_value: val,
      updated_at: new Date().toISOString(),
    }));
    for (const row of realtimeRows) {
      await sb.from("ops_kpi_snapshots_realtime")
        .upsert(row, { onConflict: "metric_key" });
    }

    // ── Zone health snapshots ──

    const zones = zonesRes.data ?? [];
    const caps = capsRes.data ?? [];
    const subs = subsRes.data ?? [];

    const capByZone: Record<string, { max: number; assigned: number }> = {};
    caps.forEach((c: any) => {
      if (!capByZone[c.zone_id]) capByZone[c.zone_id] = { max: 0, assigned: 0 };
      capByZone[c.zone_id].max += c.max_homes || 0;
      capByZone[c.zone_id].assigned += c.assigned_count || 0;
    });

    const subsByZone: Record<string, number> = {};
    subs.forEach((s: any) => {
      if (s.zone_id) subsByZone[s.zone_id] = (subsByZone[s.zone_id] || 0) + 1;
    });

    const completedByZone: Record<string, number> = {};
    completedJobs.forEach((j: any) => {
      if (j.zone_id) completedByZone[j.zone_id] = (completedByZone[j.zone_id] || 0) + 1;
    });

    let zoneSnapshotCount = 0;
    for (const z of zones) {
      const cap = capByZone[z.id] ?? { max: 0, assigned: 0 };
      const capPct = cap.max > 0 ? Math.round((cap.assigned / cap.max) * 100) : 0;
      const completed = completedByZone[z.id] || 0;
      const zoneIssues = issuesByZone[z.id] || 0;
      const zoneIssueRate = completed > 0 ? Math.round((zoneIssues / completed) * 100) : 0;

      await sb.from("zone_health_snapshots").upsert({
        zone_id: z.id,
        snapshot_date: today,
        capacity_pct: capPct,
        active_subs: subsByZone[z.id] || 0,
        completed_jobs_7d: completed,
        issue_rate_7d: zoneIssueRate,
      }, { onConflict: "zone_id,snapshot_date" });
      zoneSnapshotCount++;
    }

    // ── Provider health snapshots ──

    const providerOrgs = providerOrgsRes.data ?? [];
    let providerSnapshotCount = 0;

    // Jobs by provider
    const jobsByProvider: Record<string, any[]> = {};
    completedJobs.forEach((j: any) => {
      if (j.provider_org_id) {
        if (!jobsByProvider[j.provider_org_id]) jobsByProvider[j.provider_org_id] = [];
        jobsByProvider[j.provider_org_id].push(j);
      }
    });

    for (const po of providerOrgs) {
      const pJobs = jobsByProvider[po.id] || [];
      const completedCount = pJobs.length;

      // Avg time on site
      const times = pJobs
        .filter((j: any) => j.arrived_at && j.departed_at)
        .map((j: any) => (new Date(j.departed_at).getTime() - new Date(j.arrived_at).getTime()) / 60000);
      const avgTime = times.length > 0 ? Math.round(times.reduce((a: number, b: number) => a + b, 0) / times.length) : null;

      // Provider issue rate
      const provIssues = issuesByProvider[po.id] || 0;
      const provIssueRate = completedCount > 0 ? Math.round((provIssues / completedCount) * 100) : 0;

      // Provider proof compliance
      let proofCompliant = 0;
      let proofTotal = 0;
      pJobs.forEach((j: any) => {
        if (requiredProofJobs.has(j.id)) {
          proofTotal++;
          if (proofByJob[j.id]) proofCompliant++;
        }
      });
      const proofCompliancePct = proofTotal > 0 ? Math.round((proofCompliant / proofTotal) * 100) : null;

      await sb.from("provider_health_snapshots").upsert({
        provider_org_id: po.id,
        snapshot_date: today,
        completed_jobs: completedCount,
        avg_time_on_site_minutes: avgTime,
        issue_rate: provIssueRate,
        proof_compliance: proofCompliancePct,
      }, { onConflict: "provider_org_id,snapshot_date" });
      providerSnapshotCount++;
    }

    const summary = {
      daily_kpi_rows: dailyRows.length,
      zone_snapshots: zoneSnapshotCount,
      provider_snapshots: providerSnapshotCount,
      snapshot_date: today,
    };

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
