import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

function daysAgoStr(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

export interface ZoneHealthRow {
  id: string;
  name: string;
  status: string;
  regionName: string | null;
  defaultServiceDay: string;
  maxStops: number;
  assignedCount: number;
  capacityPct: number;
  issueCount7d: number;
  issueRate7d: number;
  completedJobs7d: number;
  activeSubscriptions: number;
  newSignups7d: number;
  newSignups30d: number;
  growthPressure: number; // waitlist/uncovered demand signal
  weekLoadBars: { day: string; pct: number }[];
}

export function useZoneHealth() {
  return useQuery({
    queryKey: ["zone-health"],
    queryFn: async (): Promise<ZoneHealthRow[]> => {
      const sevenDaysAgo = daysAgoStr(7);
      const thirtyDaysAgo = daysAgoStr(30);

      const [zonesRes, capsRes, issuesRes, jobsRes, subsRes, waitlistRes] = await Promise.all([
        supabase.from("zones").select("id, name, status, region_id, default_service_day, max_stops_per_day, regions(name)").neq("status", "archived"),
        supabase.from("zone_service_day_capacity").select("zone_id, day_of_week, max_homes, assigned_count"),
        supabase.from("job_issues").select("id, jobs(zone_id)").gte("created_at", sevenDaysAgo),
        supabase.from("jobs").select("id, zone_id, status, completed_at, created_at").gte("created_at", thirtyDaysAgo),
        supabase.from("subscriptions").select("id, customer_id, zone_id, status, created_at").eq("status", "active"),
        // Growth pressure: pending service day assignments (waitlist proxy)
        supabase.from("service_day_assignments").select("id, zone_id, status").eq("status", "offered" as any),
      ]);

      const zones = zonesRes.data ?? [];
      const caps = capsRes.data ?? [];
      const issues = issuesRes.data ?? [];
      const jobs = jobsRes.data ?? [];
      const subs = subsRes.data ?? [];
      const waitlist = waitlistRes.data ?? [];

      // Aggregate capacity by zone (total + per-day)
      const capByZone: Record<string, { max: number; assigned: number }> = {};
      const capByZoneDay: Record<string, { day: string; max: number; assigned: number }[]> = {};
      caps.forEach((c: any) => {
        if (!capByZone[c.zone_id]) capByZone[c.zone_id] = { max: 0, assigned: 0 };
        capByZone[c.zone_id].max += c.max_homes || 0;
        capByZone[c.zone_id].assigned += c.assigned_count || 0;

        if (!capByZoneDay[c.zone_id]) capByZoneDay[c.zone_id] = [];
        capByZoneDay[c.zone_id].push({
          day: c.day_of_week || "—",
          max: c.max_homes || 0,
          assigned: c.assigned_count || 0,
        });
      });

      // Issues by zone (7d)
      const issuesByZone: Record<string, number> = {};
      issues.forEach((i: any) => {
        const zoneId = i.jobs?.zone_id;
        if (zoneId) issuesByZone[zoneId] = (issuesByZone[zoneId] || 0) + 1;
      });

      // Completed jobs by zone (7d)
      const completedByZone: Record<string, number> = {};
      jobs.forEach((j: any) => {
        if (j.status === "COMPLETED" && j.completed_at && j.completed_at >= sevenDaysAgo) {
          completedByZone[j.zone_id] = (completedByZone[j.zone_id] || 0) + 1;
        }
      });

      // Active subs by zone
      const subsByZone: Record<string, number> = {};
      const newSubs7d: Record<string, number> = {};
      const newSubs30d: Record<string, number> = {};
      subs.forEach((s: any) => {
        if (s.zone_id) {
          subsByZone[s.zone_id] = (subsByZone[s.zone_id] || 0) + 1;
          if (s.created_at >= sevenDaysAgo) newSubs7d[s.zone_id] = (newSubs7d[s.zone_id] || 0) + 1;
          if (s.created_at >= thirtyDaysAgo) newSubs30d[s.zone_id] = (newSubs30d[s.zone_id] || 0) + 1;
        }
      });

      // Growth pressure by zone (pending offers = unconfirmed demand)
      const waitlistByZone: Record<string, number> = {};
      waitlist.forEach((w: any) => {
        if (w.zone_id) waitlistByZone[w.zone_id] = (waitlistByZone[w.zone_id] || 0) + 1;
      });

      return zones.map((z: any) => {
        const cap = capByZone[z.id] ?? { max: z.max_stops_per_day || 0, assigned: 0 };
        const maxTotal = cap.max || z.max_stops_per_day || 1;
        const completed = completedByZone[z.id] || 0;
        const issueCount = issuesByZone[z.id] || 0;

        // Per-day load bars
        const dayEntries = capByZoneDay[z.id] || [];
        const weekLoadBars = dayEntries.map((d) => ({
          day: d.day,
          pct: d.max > 0 ? Math.round((d.assigned / d.max) * 100) : 0,
        }));

        return {
          id: z.id,
          name: z.name,
          status: z.status,
          regionName: z.regions?.name ?? null,
          defaultServiceDay: z.default_service_day,
          maxStops: maxTotal,
          assignedCount: cap.assigned,
          capacityPct: maxTotal > 0 ? Math.round((cap.assigned / maxTotal) * 100) : 0,
          issueCount7d: issueCount,
          issueRate7d: completed > 0 ? Math.round((issueCount / completed) * 100) : 0,
          completedJobs7d: completed,
          activeSubscriptions: subsByZone[z.id] || 0,
          newSignups7d: newSubs7d[z.id] || 0,
          newSignups30d: newSubs30d[z.id] || 0,
          growthPressure: waitlistByZone[z.id] || 0,
          weekLoadBars,
        };
      });
    },
  });
}

export function useZoneHealthDetail(zoneId: string | null) {
  return useQuery({
    queryKey: ["zone-health-detail", zoneId],
    enabled: !!zoneId,
    queryFn: async () => {
      const sevenDaysAgo = daysAgoStr(7);

      const [capsRes, providersRes, jobsRes, issuesRes, photosRes, checklistRes] = await Promise.all([
        supabase.from("zone_service_day_capacity").select("*").eq("zone_id", zoneId!),
        supabase.from("zone_provider_assignments").select("*, provider_orgs(business_name)").eq("zone_id", zoneId!),
        supabase.from("jobs").select("id, provider_org_id, status, completed_at, scheduled_date, arrived_at, departed_at").eq("zone_id", zoneId!).gte("scheduled_date", sevenDaysAgo),
        supabase.from("job_issues").select("id, job_id, issue_type, status").eq("status", "OPEN"),
        supabase.from("job_photos").select("job_id").in("job_id", []),  // will be populated below
        supabase.from("job_checklist_items").select("job_id, is_required"),
      ]);

      const allJobs = jobsRes.data ?? [];
      const completedJobs = allJobs.filter((j: any) => j.status === "COMPLETED");
      const completedIds = completedJobs.map((j: any) => j.id);

      // Fetch photos for completed jobs (separate query since we need IDs)
      let proofCompliance = 100;
      let redoIntents = 0;
      let avgTimeOnSiteMinutes = 0;

      if (completedIds.length > 0) {
        const [photosForCompleted, checklistForCompleted, redoRes] = await Promise.all([
          supabase.from("job_photos").select("job_id").in("job_id", completedIds),
          supabase.from("job_checklist_items").select("job_id, is_required").in("job_id", completedIds),
          supabase.from("job_issues").select("id", { count: "exact", head: true }).eq("issue_type", "REDO" as any).in("job_id", completedIds),
        ]);

        const photosSet = new Set((photosForCompleted.data ?? []).map((p: any) => p.job_id));
        const requiredSet = new Set<string>();
        (checklistForCompleted.data ?? []).forEach((ci: any) => {
          if (ci.is_required) requiredSet.add(ci.job_id);
        });

        // Jobs with required items that have photos = compliant
        let compliant = 0;
        let total = 0;
        completedIds.forEach((id: string) => {
          if (requiredSet.has(id)) {
            total++;
            if (photosSet.has(id)) compliant++;
          }
        });
        proofCompliance = total > 0 ? Math.round((compliant / total) * 100) : 100;
        redoIntents = redoRes.count ?? 0;
      }

      // Average time on site
      const timesOnSite = completedJobs
        .filter((j: any) => j.arrived_at && j.departed_at)
        .map((j: any) => (new Date(j.departed_at).getTime() - new Date(j.arrived_at).getTime()) / 60000);
      avgTimeOnSiteMinutes = timesOnSite.length > 0 ? Math.round(timesOnSite.reduce((a: number, b: number) => a + b, 0) / timesOnSite.length) : 0;

      // Jobs per provider
      const jobsByProvider: Record<string, number> = {};
      allJobs.forEach((j: any) => {
        if (j.provider_org_id) jobsByProvider[j.provider_org_id] = (jobsByProvider[j.provider_org_id] || 0) + 1;
      });

      const providers = (providersRes.data ?? []).map((p: any) => ({
        id: p.id,
        providerOrgId: p.provider_org_id,
        businessName: p.provider_orgs?.business_name ?? "Unknown",
        assignmentType: p.assignment_type,
        jobs7d: jobsByProvider[p.provider_org_id] || 0,
      }));

      return {
        capacities: capsRes.data ?? [],
        providers,
        jobs: allJobs,
        openIssues: issuesRes.data ?? [],
        proofCompliance,
        redoIntents,
        avgTimeOnSiteMinutes,
      };
    },
  });
}
