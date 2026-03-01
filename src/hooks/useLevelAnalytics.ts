import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

function daysAgoStr(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

export interface MismatchRow {
  sku_id: string;
  sku_name: string;
  zone_id: string;
  zone_name: string;
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
  totalRecommendations: number;
  totalCourtesyUpgrades: number;
  totalJobsWithLevels: number;
  recommendationRate: number;
  courtesyRate: number;
  mismatchRows: MismatchRow[];
  outlierProviders: OutlierProvider[];
  acceptanceCount: number;
}

export function useLevelAnalytics() {
  return useQuery({
    queryKey: ["level-analytics"],
    queryFn: async (): Promise<LevelAnalytics> => {
      const thirtyDaysAgo = daysAgoStr(30);

      // F2-fix: fetch sku_levels to resolve SKU from recommendation level IDs
      const [recsRes, courtesyRes, jobSkusRes, zonesRes, skusRes, orgsRes, skuLevelsRes] = await Promise.all([
        supabase
          .from("level_recommendations")
          .select("id, job_id, provider_org_id, recommended_level_id, scheduled_level_id, created_at")
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
        supabase.from("sku_levels").select("id, sku_id"),
      ]);

      const recs = recsRes.data ?? [];
      const courtesies = courtesyRes.data ?? [];
      const jobSkus = jobSkusRes.data ?? [];

      // F2-fix: build level_id → sku_id map
      const levelToSku = new Map<string, string>();
      for (const sl of skuLevelsRes.data ?? []) {
        levelToSku.set(sl.id, sl.sku_id);
      }

      // Collect ALL unique job IDs we need zone/date info for
      const allJobIds = new Set<string>();
      for (const r of recs) allJobIds.add(r.job_id);
      for (const c of courtesies) allJobIds.add(c.job_id);
      for (const js of jobSkus) allJobIds.add(js.job_id);

      // Fetch jobs with scheduled_date for time-scoping (F1-fix)
      const jobInfoMap = new Map<string, { zone_id: string; provider_org_id: string; scheduled_date: string | null }>();
      const jobIdArr = [...allJobIds];
      const batchSize = 200;
      for (let i = 0; i < jobIdArr.length; i += batchSize) {
        const batch = jobIdArr.slice(i, i + batchSize);
        const { data } = await supabase
          .from("jobs")
          .select("id, zone_id, provider_org_id, scheduled_date")
          .in("id", batch);
        for (const j of data ?? []) {
          jobInfoMap.set(j.id, { zone_id: j.zone_id, provider_org_id: j.provider_org_id, scheduled_date: j.scheduled_date });
        }
      }

      // F1-fix: filter job_skus to only jobs scheduled within last 30 days
      const recentJobSkus = jobSkus.filter((js) => {
        const info = jobInfoMap.get(js.job_id);
        if (!info) return false;
        const d = info.scheduled_date ?? "";
        return d >= thirtyDaysAgo.slice(0, 10); // compare date portion
      });

      const zoneMap = new Map((zonesRes.data ?? []).map((z: any) => [z.id, z.name]));
      const skuMap = new Map((skusRes.data ?? []).map((s: any) => [s.id, s.name]));
      const orgMap = new Map((orgsRes.data ?? []).map((o: any) => [o.id, o.name]));

      // Aggregate counts (F1-fix: use recentJobSkus)
      const totalRecommendations = recs.length;
      const totalCourtesyUpgrades = courtesies.length;
      const totalJobsWithLevels = recentJobSkus.length;
      const recommendationRate = totalJobsWithLevels > 0
        ? Math.round((totalRecommendations / totalJobsWithLevels) * 100)
        : 0;
      const courtesyRate = totalJobsWithLevels > 0
        ? Math.round((totalCourtesyUpgrades / totalJobsWithLevels) * 100)
        : 0;

      // Build mismatch table: group by sku_id + zone_id
      // F3-fix: removed provider_org_id from aggregation entry
      const mismatchAgg = new Map<string, {
        sku_id: string; zone_id: string;
        recs: number; courtesies: number; totalJobs: number;
      }>();

      const makeKey = (skuId: string, zoneId: string) => `${skuId}|${zoneId}`;

      // Count total jobs with levels by sku+zone (F1-fix: use recentJobSkus)
      for (const js of recentJobSkus) {
        const jobInfo = jobInfoMap.get(js.job_id);
        if (!jobInfo) continue;
        const key = makeKey(js.sku_id, jobInfo.zone_id);
        if (!mismatchAgg.has(key)) {
          mismatchAgg.set(key, {
            sku_id: js.sku_id, zone_id: jobInfo.zone_id,
            recs: 0, courtesies: 0, totalJobs: 0,
          });
        }
        mismatchAgg.get(key)!.totalJobs++;
      }

      // F2-fix: resolve SKU from scheduled_level_id instead of fanning out
      for (const rec of recs) {
        const jobInfo = jobInfoMap.get(rec.job_id);
        if (!jobInfo) continue;
        const skuId = levelToSku.get(rec.scheduled_level_id);
        if (!skuId) continue;
        const key = makeKey(skuId, jobInfo.zone_id);
        const entry = mismatchAgg.get(key);
        if (entry) entry.recs++;
      }

      for (const cu of courtesies) {
        const jobInfo = jobInfoMap.get(cu.job_id);
        if (!jobInfo) continue;
        const key = makeKey(cu.sku_id, jobInfo.zone_id);
        const entry = mismatchAgg.get(key);
        if (entry) entry.courtesies++;
      }

      // F3-fix: removed provider_org_id from MismatchRow
      const mismatchRows: MismatchRow[] = [...mismatchAgg.values()]
        .filter((e) => e.recs > 0 || e.courtesies > 0)
        .map((e) => ({
          sku_id: e.sku_id,
          sku_name: skuMap.get(e.sku_id) ?? "Unknown",
          zone_id: e.zone_id,
          zone_name: zoneMap.get(e.zone_id) ?? "Unknown",
          recommendation_count: e.recs,
          courtesy_count: e.courtesies,
          total_jobs: e.totalJobs,
          mismatch_rate: e.totalJobs > 0 ? Math.round((e.recs / e.totalJobs) * 100) : 0,
        }))
        .sort((a, b) => b.mismatch_rate - a.mismatch_rate);

      // Outlier providers: courtesy upgrade rate per provider (F1-fix: use recentJobSkus)
      const providerCourtesy = new Map<string, number>();
      const providerJobs = new Map<string, number>();

      for (const cu of courtesies) {
        const orgId = cu.provider_org_id;
        providerCourtesy.set(orgId, (providerCourtesy.get(orgId) ?? 0) + 1);
      }

      for (const js of recentJobSkus) {
        const jobInfo = jobInfoMap.get(js.job_id);
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
        acceptanceCount: 0,
      };
    },
    refetchInterval: 120_000,
  });
}
