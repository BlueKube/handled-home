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

      const exitAlerts: ExitAlert[] = [
        {
          planName: "Starter Promo",
          cohortLabel: "90-day",
          attachRate: 0.8,
          threshold: 0.3,
          action: "Consider discontinuing — attach rate below 30% at 90 days",
        },
      ];

      return { planProfitability, cohortAttachRates, exitAlerts };
    },
  });
}
