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
  // Growth (7d)
  referralsActivated: number;
  providerApplications: number;
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

      // Run queries individually to avoid deep type instantiation
      const jobsTodayRes = await supabase.from("jobs").select("id", { count: "exact", head: true }).eq("scheduled_date", today);
      const jobsCompletedRes = await supabase.from("jobs").select("id", { count: "exact", head: true }).eq("scheduled_date", today).eq("status", "COMPLETED" as any);
      const jobIssuesRes = await supabase.from("job_issues").select("id", { count: "exact", head: true }).eq("status", "OPEN");
      const proofRes = await supabase.from("jobs").select("id").eq("status", "COMPLETED").gte("completed_at", sevenDaysAgo);
      const zonesRes = await supabase.from("zones").select("id, name, max_stops_per_day, default_service_day").eq("status", "active");
      const capacityRes = await supabase.from("zone_service_day_capacity").select("zone_id, max_homes, assigned_count") as any;
      const issuesRes = await supabase.from("job_issues").select("id", { count: "exact", head: true }).gte("created_at", sevenDaysAgo);
      const creditsRes = await supabase.from("customer_credits").select("amount_cents").gte("created_at", sevenDaysAgo);
      const invoicesPastDueRes = await supabase.from("customer_invoices").select("id", { count: "exact", head: true }).eq("status", "PAST_DUE" as any);
      const invoicesPaidRes = await supabase.from("customer_invoices").select("total_cents").eq("status", "PAID").gte("paid_at", today + "T00:00:00Z") as any;
      const invoicesFailedRes = await supabase.from("customer_invoices").select("id", { count: "exact", head: true }).eq("status", "FAILED").gte("updated_at", today + "T00:00:00Z") as any;
      const referralsRes = await (supabase.from("referrals") as any).select("id", { count: "exact", head: true }).eq("status", "ACTIVATED").gte("created_at", sevenDaysAgo);
      const applicationsRes = await supabase.from("provider_applications").select("id", { count: "exact", head: true }).gte("created_at", sevenDaysAgo);

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

      // Completed 7d count for issue rate
      const completed7d = proofRes.data?.length ?? 0;
      const issues7d = issuesRes.count ?? 0;
      const issueRate = completed7d > 0 ? Math.round((issues7d / completed7d) * 100) : 0;

      return {
        jobsScheduledToday: jobsTodayRes.count ?? 0,
        jobsCompletedToday: jobsCompletedRes.count ?? 0,
        jobsInIssue: jobIssuesRes.count ?? 0,
        proofExceptions: 0, // TODO: requires checking job_photos vs checklist requirements
        zonesOverCapacity,
        tightDays: tightDays.slice(0, 3),
        issueRate,
        creditsIssuedCents: creditsCents,
        redoIntents: 0, // TODO: requires redo-specific issue type
        paidTodayCents: paidCents,
        pastDueCount: invoicesPastDueRes.count ?? 0,
        failedPaymentsToday: invoicesFailedRes.count ?? 0,
        referralsActivated: referralsRes.count ?? 0,
        providerApplications: applicationsRes.count ?? 0,
        hotZones: [],
        updatedAt: new Date(),
      };
    },
    refetchInterval: 60_000, // refresh every minute
  });
}
