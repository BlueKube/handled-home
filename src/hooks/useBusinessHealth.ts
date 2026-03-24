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

      const [
        activeSubsRes,
        canceledSubsRes,
        subItemsRes,
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
        // Subscription items (SKUs) for active subs — count distinct SKUs per household
        supabase
          .from("subscription_items")
          .select("subscription_id, sku_id")
          .eq("status", "active" as any),
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

      // Attach rate
      const activeSubs = activeSubsRes.data ?? [];
      const activeHouseholds = activeSubs.length;
      const activeSubIds = new Set(activeSubs.map((s) => s.id));
      const totalActiveSKUs = (subItemsRes.data ?? []).filter(
        (si: any) => activeSubIds.has(si.subscription_id)
      ).length;
      const attachRate = activeHouseholds > 0
        ? Math.round((totalActiveSKUs / activeHouseholds) * 100) / 100
        : 0;

      // Household churn
      const canceledLast30d = canceledSubsRes.count ?? 0;
      const churnBase = activeHouseholds + canceledLast30d;
      const householdChurnPct = churnBase > 0
        ? Math.round((canceledLast30d / churnBase) * 1000) / 10
        : 0;

      // Provider churn (annualized from 90d window)
      const totalActiveProviders = activeProvidersRes.count ?? 0;
      const providersExitedLast90d = exitedProvidersRes.count ?? 0;
      const providerBase = totalActiveProviders + providersExitedLast90d;
      const providerChurnPct = providerBase > 0
        ? Math.round(((providersExitedLast90d / providerBase) * 4) * 10) / 10 // × 4 to annualize 90d
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
