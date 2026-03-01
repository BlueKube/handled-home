import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

function daysAgoStr(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

export interface LevelMixRow {
  sku_id: string;
  sku_name: string;
  zone_id: string;
  zone_name: string;
  level_label: string;
  level_number: number;
  count: number;
}

export interface MismatchRow {
  sku_id: string;
  sku_name: string;
  zone_id: string;
  zone_name: string;
  provider_org_id: string;
  recommendation_count: number;
  courtesy_count: number;
  total_jobs: number;
  mismatch_rate: number;
}

export interface OutlierProvider {
  provider_org_id: string;
  org_name: string;
  courtesy_count: number;
  total_jobs: number;
  rate_pct: number;
}

export interface LevelAnalytics {
  // Aggregate counts (last 30d)
  totalRecommendations: number;
  totalCourtesyUpgrades: number;
  totalJobsWithLevels: number;
  recommendationRate: number;
  courtesyRate: number;

  // By SKU/zone mismatch table
  mismatchRows: MismatchRow[];

  // Outlier providers (courtesy upgrade rate)
  outlierProviders: OutlierProvider[];

  // Acceptance rate: recommendations that led to routine updates
  acceptanceCount: number;
}

export function useLevelAnalytics() {
  return useQuery({
    queryKey: ["level-analytics"],
    queryFn: async (): Promise<LevelAnalytics> => {
      const thirtyDaysAgo = daysAgoStr(30);

      const [recsRes, courtesyRes, jobSkusRes, zonesRes, skusRes, orgsRes] = await Promise.all([
        supabase
          .from("level_recommendations")
          .select("id, job_id, provider_org_id, recommended_level_id, created_at")
          .gte("created_at", thirtyDaysAgo),
        supabase
          .from("courtesy_upgrades")
          .select("id, job_id, provider_org_id, sku_id, property_id, created_at")
          .gte("created_at", thirtyDaysAgo),
        supabase
          .from("job_skus")
          .select("job_id, sku_id, scheduled_level_id")
          .not("scheduled_level_id", "is", null),
        supabase.from("zones").select("id, name").eq("status", "active"),
        supabase.from("service_skus").select("id, name"),
        supabase.from("provider_orgs").select("id, name"),
      ]);

      const recs = recsRes.data ?? [];
      const courtesies = courtesyRes.data ?? [];

      // Get unique job IDs from recs/courtesies to scope job lookups
      const recJobIds = new Set(recs.map((r: any) => r.job_id));
      const courtesyJobIds = new Set(courtesies.map((c: any) => c.job_id));
      const allRelevantJobIds = [...new Set([...recJobIds, ...courtesyJobIds])];

      // Fetch jobs for zone mapping (only relevant ones)
      let jobZoneMap = new Map<string, { zone_id: string; provider_org_id: string }>();
      if (allRelevantJobIds.length > 0) {
        const batchSize = 200;
        for (let i = 0; i < allRelevantJobIds.length; i += batchSize) {
          const batch = allRelevantJobIds.slice(i, i + batchSize);
          const { data } = await supabase
            .from("jobs")
            .select("id, zone_id, provider_org_id")
            .in("id", batch);
          (data ?? []).forEach((j: any) => {
            jobZoneMap.set(j.id, { zone_id: j.zone_id, provider_org_id: j.provider_org_id });
          });
        }
      }

      // Also need to map job_skus to zones for total counts
      const jobSkus = jobSkusRes.data ?? [];
      const jobSkuJobIds = [...new Set(jobSkus.map((js: any) => js.job_id))];
      // Fetch zone info for job_skus jobs too
      if (jobSkuJobIds.length > 0) {
        const batchSize = 200;
        for (let i = 0; i < jobSkuJobIds.length; i += batchSize) {
          const batch = jobSkuJobIds.slice(i, i + batchSize);
          const { data } = await supabase
            .from("jobs")
            .select("id, zone_id, provider_org_id")
            .in("id", batch);
          (data ?? []).forEach((j: any) => {
            if (!jobZoneMap.has(j.id)) {
              jobZoneMap.set(j.id, { zone_id: j.zone_id, provider_org_id: j.provider_org_id });
            }
          });
        }
      }

      const zoneMap = new Map((zonesRes.data ?? []).map((z: any) => [z.id, z.name]));
      const skuMap = new Map((skusRes.data ?? []).map((s: any) => [s.id, s.name]));
      const orgMap = new Map((orgsRes.data ?? []).map((o: any) => [o.id, o.name]));

      // Aggregate counts
      const totalRecommendations = recs.length;
      const totalCourtesyUpgrades = courtesies.length;
      const totalJobsWithLevels = jobSkus.length;
      const recommendationRate = totalJobsWithLevels > 0
        ? Math.round((totalRecommendations / totalJobsWithLevels) * 100)
        : 0;
      const courtesyRate = totalJobsWithLevels > 0
        ? Math.round((totalCourtesyUpgrades / totalJobsWithLevels) * 100)
        : 0;

      // Build mismatch table: group by sku_id + zone_id
      type MismatchKey = string;
      const mismatchAgg = new Map<MismatchKey, {
        sku_id: string; zone_id: string; provider_org_id: string;
        recs: number; courtesies: number; totalJobs: number;
      }>();

      const makeKey = (skuId: string, zoneId: string) => `${skuId}|${zoneId}`;

      // Count total jobs with levels by sku+zone
      for (const js of jobSkus) {
        const jobInfo = jobZoneMap.get(js.job_id);
        if (!jobInfo) continue;
        const key = makeKey(js.sku_id, jobInfo.zone_id);
        if (!mismatchAgg.has(key)) {
          mismatchAgg.set(key, {
            sku_id: js.sku_id, zone_id: jobInfo.zone_id,
            provider_org_id: jobInfo.provider_org_id,
            recs: 0, courtesies: 0, totalJobs: 0,
          });
        }
        mismatchAgg.get(key)!.totalJobs++;
      }

      // Count recommendations by sku+zone (need to resolve sku from job_skus)
      const jobToSkus = new Map<string, string[]>();
      for (const js of jobSkus) {
        if (!jobToSkus.has(js.job_id)) jobToSkus.set(js.job_id, []);
        jobToSkus.get(js.job_id)!.push(js.sku_id);
      }

      for (const rec of recs) {
        const jobInfo = jobZoneMap.get(rec.job_id);
        if (!jobInfo) continue;
        const skuIds = jobToSkus.get(rec.job_id) ?? [];
        for (const skuId of skuIds) {
          const key = makeKey(skuId, jobInfo.zone_id);
          const entry = mismatchAgg.get(key);
          if (entry) entry.recs++;
        }
      }

      for (const cu of courtesies) {
        const jobInfo = jobZoneMap.get(cu.job_id);
        if (!jobInfo) continue;
        const key = makeKey(cu.sku_id, jobInfo.zone_id);
        const entry = mismatchAgg.get(key);
        if (entry) entry.courtesies++;
      }

      const mismatchRows: MismatchRow[] = [...mismatchAgg.values()]
        .filter((e) => e.recs > 0 || e.courtesies > 0)
        .map((e) => ({
          sku_id: e.sku_id,
          sku_name: skuMap.get(e.sku_id) ?? "Unknown",
          zone_id: e.zone_id,
          zone_name: zoneMap.get(e.zone_id) ?? "Unknown",
          provider_org_id: e.provider_org_id,
          recommendation_count: e.recs,
          courtesy_count: e.courtesies,
          total_jobs: e.totalJobs,
          mismatch_rate: e.totalJobs > 0 ? Math.round((e.recs / e.totalJobs) * 100) : 0,
        }))
        .sort((a, b) => b.mismatch_rate - a.mismatch_rate);

      // Outlier providers: courtesy upgrade rate per provider
      const providerCourtesy = new Map<string, number>();
      const providerJobs = new Map<string, number>();

      for (const cu of courtesies) {
        const orgId = cu.provider_org_id;
        providerCourtesy.set(orgId, (providerCourtesy.get(orgId) ?? 0) + 1);
      }

      for (const js of jobSkus) {
        const jobInfo = jobZoneMap.get(js.job_id);
        if (!jobInfo) continue;
        providerJobs.set(jobInfo.provider_org_id, (providerJobs.get(jobInfo.provider_org_id) ?? 0) + 1);
      }

      const outlierProviders: OutlierProvider[] = [...providerCourtesy.entries()]
        .map(([orgId, count]) => {
          const total = providerJobs.get(orgId) ?? 0;
          return {
            provider_org_id: orgId,
            org_name: orgMap.get(orgId) ?? "Unknown",
            courtesy_count: count,
            total_jobs: total,
            rate_pct: total > 0 ? Math.round((count / total) * 100) : 0,
          };
        })
        .filter((p) => p.rate_pct > 20 || p.courtesy_count >= 3)
        .sort((a, b) => b.rate_pct - a.rate_pct);

      return {
        totalRecommendations,
        totalCourtesyUpgrades,
        totalJobsWithLevels,
        recommendationRate,
        courtesyRate,
        mismatchRows,
        outlierProviders,
        acceptanceCount: 0, // Would require tracking routine changes from recommendations — future enhancement
      };
    },
    refetchInterval: 120_000,
  });
}
