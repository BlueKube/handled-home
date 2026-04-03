import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
      // Fetch active plans with subscriber counts
      const { data: plans } = await supabase
        .from("plans" as any)
        .select("id, name, price_cents, tier_key")
        .eq("status", "active") as any;

      const planProfitability: PlanProfitability[] = [];
      for (const plan of plans ?? []) {
        const { count } = await supabase
          .from("subscriptions" as any)
          .select("id", { count: "exact", head: true })
          .eq("plan_id", plan.id)
          .eq("status", "active") as any;

        const subscriberCount = count ?? 0;
        const revenue = plan.price_cents ?? 0;
        // Estimate cost as 65% of revenue (industry average for managed services)
        const estimatedCost = Math.round(revenue * 0.65);
        const margin = revenue - estimatedCost;
        const marginPercent = revenue > 0 ? Math.round((margin / revenue) * 1000) / 10 : 0;

        planProfitability.push({
          planId: plan.id,
          planName: plan.name,
          tier: plan.tier_key ?? "entry",
          revenue,
          estimatedCost,
          margin,
          marginPercent,
          subscriberCount,
        });
      }

      // Compute real cohort attach rates from subscription age
      const now = new Date();
      const cohortRanges: Array<{ label: string; range: [number, number]; target: number }> = [
        { label: "30-day", range: [0, 30], target: 1.0 },
        { label: "60-day", range: [31, 60], target: 1.3 },
        { label: "90-day", range: [61, 90], target: 1.5 },
        { label: "120-day", range: [91, 120], target: 1.8 },
      ];

      const cohortAttachRates: CohortAttachRate[] = [];
      for (const { label, range, target } of cohortRanges) {
        const from = new Date(now); from.setDate(from.getDate() - range[1]);
        const to = new Date(now); to.setDate(to.getDate() - range[0]);
        const { data: cohortSubs } = await supabase
          .from("subscriptions" as any)
          .select("id")
          .eq("status", "active")
          .gte("created_at", from.toISOString())
          .lte("created_at", to.toISOString()) as any;

        const cohortIds = (cohortSubs ?? []).map((s: any) => s.id);
        let totalItems = 0;
        if (cohortIds.length > 0) {
          const { count } = await supabase
            .from("subscription_items" as any)
            .select("id", { count: "exact", head: true })
            .in("subscription_id", cohortIds)
            .eq("status", "active") as any;
          totalItems = count ?? 0;
        }

        cohortAttachRates.push({
          cohortLabel: label,
          daysRange: range,
          householdCount: cohortIds.length,
          attachRate: cohortIds.length > 0 ? Math.round((totalItems / cohortIds.length) * 100) / 100 : 0,
          target,
        });
      }

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
