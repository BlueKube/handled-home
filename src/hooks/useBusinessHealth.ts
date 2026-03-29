import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

function daysAgoStr(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

export interface BusinessHealthMetrics {
  // Attach rate: avg SKUs per active household
  attachRate: number;
  attachRateGlobal: number;
  attachRate90d: number;
  attachRate180d: number;
  flywheelHealthy: boolean;
  activeHouseholds: number;
  totalActiveSKUs: number;

  // Household churn: canceled last 30d / (active + canceled last 30d)
  householdChurnPct: number;
  canceledLast30d: number;

  // Provider churn: providers deactivated last 90d, annualized
  providerChurnPct: number;
  providersExitedLast90d: number;
  totalActiveProviders: number;

  // Zone density distribution
  zoneDensity: {
    zoneId: string;
    zoneName: string;
    households: number;
    band: "critical" | "seeding" | "growing" | "scale";
  }[];
  zonesBelowMinimum: number;
}

export function useBusinessHealth() {
  return useQuery({
    queryKey: ["business-health"],
    queryFn: async (): Promise<BusinessHealthMetrics> => {
      const thirtyDaysAgo = daysAgoStr(30);
      const ninetyDaysAgo = daysAgoStr(90);

      // Phase 1: parallel queries that don't depend on each other
      const [
        activeSubsRes,
        canceledSubsRes,
        activeProvidersRes,
        exitedProvidersRes,
        zonesRes,
      ] = await Promise.all([
        // Active subscriptions (households)
        supabase
          .from("subscriptions")
          .select("id, zone_id")
          .eq("status", "active"),
        // Canceled in last 30d
        supabase
          .from("subscriptions")
          .select("id", { count: "exact", head: true })
          .eq("status", "canceled")
          .gte("updated_at", thirtyDaysAgo),
        // Active provider orgs
        supabase
          .from("provider_orgs")
          .select("id", { count: "exact", head: true })
          .eq("status", "ACTIVE"),
        // Providers that exited (SUSPENDED or enforcement action) in last 90d
        supabase
          .from("provider_enforcement_actions")
          .select("id, org_id:provider_org_id", { count: "exact", head: true })
          .eq("action_type", "SUSPEND")
          .gte("created_at", ninetyDaysAgo),
        // Zones for density
        supabase
          .from("zones")
          .select("id, name, status")
          .neq("status", "archived"),
      ]);

      // Phase 2: fetch subscription items scoped to active subs only
      const activeSubs = activeSubsRes.data ?? [];
      const activeHouseholds = activeSubs.length;
      const activeSubIds = activeSubs.map((s) => s.id);

      let totalActiveSKUs = 0;
      if (activeSubIds.length > 0) {
        const { count } = await (supabase
          .from("subscription_items" as any)
          .select("id", { count: "exact", head: true })
          .in("subscription_id", activeSubIds)
          .eq("status", "active") as any);
        totalActiveSKUs = count ?? 0;
      }
      const attachRate = activeHouseholds > 0
        ? Math.round((totalActiveSKUs / activeHouseholds) * 100) / 100
        : 0;
      const attachRateGlobal = attachRate;

      // TODO: Replace with actual cohort query — need household activation date
      // Mock: new households typically have lower attach rates
      const attachRate90d = Math.round(attachRate * 0.7 * 100) / 100;
      const attachRate180d = Math.round(attachRate * 0.85 * 100) / 100;
      const flywheelHealthy = attachRate180d >= 1.5;

      // Household churn
      const canceledLast30d = canceledSubsRes.count ?? 0;
      const churnBase = activeHouseholds + canceledLast30d;
      const householdChurnPct = churnBase > 0
        ? Math.round((canceledLast30d / churnBase) * 1000) / 10
        : 0;

      // Provider churn (annualized from 90d window)
      // Denominator approximates start-of-period: active now + those who left ≈ active 90d ago
      const totalActiveProviders = activeProvidersRes.count ?? 0;
      const providersExitedLast90d = exitedProvidersRes.count ?? 0;
      const startOfPeriodProviders = totalActiveProviders + providersExitedLast90d;
      const providerChurnPct = startOfPeriodProviders > 0
        ? Math.round(((providersExitedLast90d / startOfPeriodProviders) * 4) * 10) / 10 // × 4 to annualize 90d
        : 0;

      // Zone density
      const subsByZone: Record<string, number> = {};
      activeSubs.forEach((s) => {
        if (s.zone_id) subsByZone[s.zone_id] = (subsByZone[s.zone_id] || 0) + 1;
      });

      const zones = (zonesRes.data ?? []).map((z: any) => {
        const households = subsByZone[z.id] || 0;
        let band: "critical" | "seeding" | "growing" | "scale";
        if (households < 10) band = "critical";
        else if (households < 15) band = "seeding";
        else if (households < 50) band = "growing";
        else band = "scale";
        return { zoneId: z.id, zoneName: z.name, households, band };
      });

      zones.sort((a, b) => a.households - b.households);

      return {
        attachRate,
        attachRateGlobal,
        attachRate90d,
        attachRate180d,
        flywheelHealthy,
        activeHouseholds,
        totalActiveSKUs,
        householdChurnPct,
        canceledLast30d,
        providerChurnPct,
        providersExitedLast90d,
        totalActiveProviders,
        zoneDensity: zones,
        zonesBelowMinimum: zones.filter((z) => z.band === "critical").length,
      };
    },
    refetchInterval: 5 * 60_000, // 5 min
  });
}
