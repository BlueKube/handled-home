import { useQuery } from "@tanstack/react-query";

export interface PlanProfitability {
  planId: string;
  planName: string;
  tier: string;
  revenue: number;
  estimatedCost: number;
  margin: number;
  marginPercent: number;
  subscriberCount: number;
}

export interface CohortAttachRate {
  cohortLabel: string;
  daysRange: [number, number];
  householdCount: number;
  attachRate: number;
  target: number;
}

export interface ExitAlert {
  planName: string;
  cohortLabel: string;
  attachRate: number;
  threshold: number;
  action: string;
}

export interface LossLeaderMetrics {
  planProfitability: PlanProfitability[];
  cohortAttachRates: CohortAttachRate[];
  exitAlerts: ExitAlert[];
}

export function useLossLeaderMetrics() {
  return useQuery({
    queryKey: ["loss-leader-metrics"],
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<LossLeaderMetrics> => {
      // MOCK DATA — TODO: Replace with Supabase query
      const planProfitability: PlanProfitability[] = [
        { planId: "1", planName: "Essential", tier: "entry", revenue: 9900, estimatedCost: 7200, margin: 2700, marginPercent: 27.3, subscriberCount: 142 },
        { planId: "2", planName: "Plus", tier: "mid", revenue: 15900, estimatedCost: 10800, margin: 5100, marginPercent: 32.1, subscriberCount: 89 },
        { planId: "3", planName: "Premium", tier: "top", revenue: 24900, estimatedCost: 18500, margin: 6400, marginPercent: 25.7, subscriberCount: 34 },
        { planId: "4", planName: "Starter Promo", tier: "promo", revenue: 4900, estimatedCost: 7200, margin: -2300, marginPercent: -46.9, subscriberCount: 28 },
      ];

      const cohortAttachRates: CohortAttachRate[] = [
        { cohortLabel: "30-day", daysRange: [0, 30], householdCount: 45, attachRate: 1.1, target: 1.0 },
        { cohortLabel: "60-day", daysRange: [31, 60], householdCount: 62, attachRate: 1.3, target: 1.3 },
        { cohortLabel: "90-day", daysRange: [61, 90], householdCount: 58, attachRate: 1.4, target: 1.5 },
        { cohortLabel: "120-day", daysRange: [91, 120], householdCount: 71, attachRate: 1.7, target: 1.8 },
      ];

      // Compute exit alerts from cohort data
      // Exit criteria: attach < 1.5 SKUs/hh at 90d, or < 1.5 at 120d
      const exitAlerts: ExitAlert[] = [];
      const cohort90d = cohortAttachRates.find((c) => c.daysRange[0] >= 61 && c.daysRange[1] <= 90);
      const cohort120d = cohortAttachRates.find((c) => c.daysRange[0] >= 91 && c.daysRange[1] <= 120);

      // For negative-margin plans, check if attach rate is recovering
      planProfitability.filter((p) => p.margin < 0).forEach((plan) => {
        if (cohort90d && cohort90d.attachRate < cohort90d.target) {
          exitAlerts.push({
            planName: plan.planName,
            cohortLabel: "90-day",
            attachRate: cohort90d.attachRate,
            threshold: cohort90d.target,
            action: `Consider discontinuing — attach rate ${cohort90d.attachRate} below target ${cohort90d.target} at 90 days`,
          });
        }
        if (cohort120d && cohort120d.attachRate < cohort120d.target) {
          exitAlerts.push({
            planName: plan.planName,
            cohortLabel: "120-day",
            attachRate: cohort120d.attachRate,
            threshold: cohort120d.target,
            action: `Review urgently — attach rate ${cohort120d.attachRate} below target ${cohort120d.target} at 120 days`,
          });
        }
      });

      return { planProfitability, cohortAttachRates, exitAlerts };
    },
  });
}
