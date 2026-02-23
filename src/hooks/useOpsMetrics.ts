import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

function daysAgoStr(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

export interface OpsMetrics {
  // Today execution
  jobsScheduledToday: number;
  jobsCompletedToday: number;
  completionPct: number;
  jobsInIssue: number;
  proofExceptions: number;
  // Capacity
  zonesOverCapacity: number;
  tightDays: { zone_name: string; day: string; pct: number }[];
  // Quality (7d)
  issueRate: number;
  creditsIssuedCents: number;
  redoIntents: number;
  // Billing
  paidTodayCents: number;
  pastDueCount: number;
  failedPaymentsToday: number;
  addOnRevenue7dCents: number;
  // Growth (7d)
  referralsActivated: number;
  providerApplications: number;
  providerInvitesSent: number;
  hotZones: { zone_name: string; demand: number }[];
  // meta
  updatedAt: Date;
}

export function useOpsMetrics() {
  return useQuery({
    queryKey: ["ops-metrics"],
    queryFn: async (): Promise<OpsMetrics> => {
      const today = todayStr();
      const sevenDaysAgo = daysAgoStr(7);

      // Parallelize ALL queries with Promise.all
      const [
        jobsTodayRes,
        jobsCompletedRes,
        jobIssuesRes,
        completedJobs7dRes,
        checklistItemsRes,
        jobPhotosRes,
        zonesRes,
        capacityRes,
        issues7dRes,
        creditsRes,
        invoicesPastDueRes,
        invoicesPaidRes,
        invoicesFailedRes,
        addOnInvoicesRes,
        referralsRes,
        applicationsRes,
        providerInvitesRes,
        subsRes,
        redoIssuesRes,
      ] = await Promise.all([
        supabase.from("jobs").select("id", { count: "exact", head: true }).eq("scheduled_date", today),
        supabase.from("jobs").select("id", { count: "exact", head: true }).eq("scheduled_date", today).eq("status", "COMPLETED" as any),
        supabase.from("job_issues").select("id", { count: "exact", head: true }).eq("status", "OPEN"),
        // Completed jobs in last 7d for proof exception + issue rate
        supabase.from("jobs").select("id").eq("status", "COMPLETED" as any).gte("completed_at", sevenDaysAgo),
        // Checklist items for completed jobs (required items)
        supabase.from("job_checklist_items").select("job_id, is_required, status"),
        // Job photos for proof compliance
        supabase.from("job_photos").select("job_id"),
        supabase.from("zones").select("id, name, max_stops_per_day, default_service_day, status").eq("status", "active"),
        supabase.from("zone_service_day_capacity").select("zone_id, max_homes, assigned_count") as any,
        supabase.from("job_issues").select("id", { count: "exact", head: true }).gte("created_at", sevenDaysAgo),
        supabase.from("customer_credits").select("amount_cents").gte("created_at", sevenDaysAgo),
        supabase.from("customer_invoices").select("id", { count: "exact", head: true }).eq("status", "PAST_DUE" as any),
        supabase.from("customer_invoices").select("total_cents").eq("status", "PAID").gte("paid_at", today + "T00:00:00Z") as any,
        supabase.from("customer_invoices").select("id", { count: "exact", head: true }).eq("status", "FAILED").gte("updated_at", today + "T00:00:00Z") as any,
        // Add-on revenue (7d) - invoices with type ADD_ON
        supabase.from("customer_invoices").select("total_cents").eq("invoice_type", "ADD_ON" as any).eq("status", "PAID").gte("paid_at", sevenDaysAgo) as any,
        (supabase.from("referrals") as any).select("id", { count: "exact", head: true }).eq("status", "ACTIVATED").gte("created_at", sevenDaysAgo),
        supabase.from("provider_applications").select("id", { count: "exact", head: true }).gte("created_at", sevenDaysAgo),
        // Provider invites sent (growth_events with event_type = invite_sent)
        supabase.from("growth_events").select("id", { count: "exact", head: true }).eq("event_type", "invite_sent" as any).gte("created_at", sevenDaysAgo),
        // Active subs per zone for hot zones
        supabase.from("subscriptions").select("zone_id, created_at").eq("status", "active").gte("created_at", sevenDaysAgo),
        // Redo intents - issues with type REDO
        supabase.from("job_issues").select("id", { count: "exact", head: true }).eq("issue_type", "REDO" as any).gte("created_at", sevenDaysAgo),
      ]);

      // Proof exceptions: completed jobs (7d) missing required proof photos
      const completedJobIds = new Set((completedJobs7dRes.data ?? []).map((j: any) => j.id));
      const checklistItems = checklistItemsRes.data ?? [];
      const photos = jobPhotosRes.data ?? [];
      const photosJobIds = new Set(photos.map((p: any) => p.job_id));

      // A job has a proof exception if it has required checklist items but no photos
      const jobsWithRequiredChecklist = new Set<string>();
      checklistItems.forEach((ci: any) => {
        if (ci.is_required && completedJobIds.has(ci.job_id)) {
          jobsWithRequiredChecklist.add(ci.job_id);
        }
      });
      let proofExceptions = 0;
      jobsWithRequiredChecklist.forEach((jobId) => {
        if (!photosJobIds.has(jobId)) {
          proofExceptions++;
        }
      });

      // Capacity pressure
      const zones = zonesRes.data ?? [];
      const caps = capacityRes.data ?? [];
      const capByZone: Record<string, { max: number; assigned: number }> = {};
      caps.forEach((c: any) => {
        if (!capByZone[c.zone_id]) capByZone[c.zone_id] = { max: 0, assigned: 0 };
        capByZone[c.zone_id].max += c.max_homes || 0;
        capByZone[c.zone_id].assigned += c.assigned_count || 0;
      });

      let zonesOverCapacity = 0;
      const tightDays: { zone_name: string; day: string; pct: number }[] = [];
      zones.forEach((z: any) => {
        const cap = capByZone[z.id];
        if (cap && cap.max > 0) {
          const pct = Math.round((cap.assigned / cap.max) * 100);
          if (pct >= 90) {
            zonesOverCapacity++;
            tightDays.push({ zone_name: z.name, day: z.default_service_day, pct });
          }
        }
      });
      tightDays.sort((a, b) => b.pct - a.pct);

      // Credits sum
      const creditsCents = (creditsRes.data ?? []).reduce((s: number, c: any) => s + (c.amount_cents || 0), 0);

      // Paid today sum
      const paidCents = (invoicesPaidRes.data ?? []).reduce((s: number, i: any) => s + (i.total_cents || 0), 0);

      // Add-on revenue
      const addOnCents = (addOnInvoicesRes.data ?? []).reduce((s: number, i: any) => s + (i.total_cents || 0), 0);

      // Issue rate
      const completed7d = completedJobIds.size;
      const issues7d = issues7dRes.count ?? 0;
      const issueRate = completed7d > 0 ? Math.round((issues7d / completed7d) * 100) : 0;

      // Completion %
      const scheduled = jobsTodayRes.count ?? 0;
      const completed = jobsCompletedRes.count ?? 0;
      const completionPct = scheduled > 0 ? Math.round((completed / scheduled) * 100) : 0;

      // Hot zones: zones with most new subs in 7d
      const newSubsByZone: Record<string, number> = {};
      (subsRes.data ?? []).forEach((s: any) => {
        if (s.zone_id) newSubsByZone[s.zone_id] = (newSubsByZone[s.zone_id] || 0) + 1;
      });
      const hotZones = zones
        .map((z: any) => ({ zone_name: z.name, demand: newSubsByZone[z.id] || 0 }))
        .filter((h: any) => h.demand > 0)
        .sort((a: any, b: any) => b.demand - a.demand)
        .slice(0, 3);

      return {
        jobsScheduledToday: scheduled,
        jobsCompletedToday: completed,
        completionPct,
        jobsInIssue: jobIssuesRes.count ?? 0,
        proofExceptions,
        zonesOverCapacity,
        tightDays: tightDays.slice(0, 3),
        issueRate,
        creditsIssuedCents: creditsCents,
        redoIntents: redoIssuesRes.count ?? 0,
        paidTodayCents: paidCents,
        pastDueCount: invoicesPastDueRes.count ?? 0,
        failedPaymentsToday: invoicesFailedRes.count ?? 0,
        addOnRevenue7dCents: addOnCents,
        referralsActivated: referralsRes.count ?? 0,
        providerApplications: applicationsRes.count ?? 0,
        providerInvitesSent: providerInvitesRes.count ?? 0,
        hotZones,
        updatedAt: new Date(),
      };
    },
    refetchInterval: 60_000,
  });
}
