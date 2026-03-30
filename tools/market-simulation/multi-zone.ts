/**
 * Multi-Zone Market Simulation
 *
 * Extends the single-zone simulation to model a metro launch
 * with 1-6 zones sharing overhead costs and provider resources.
 *
 * Key insight from single-zone analysis: a single zone doesn't break
 * even in 12 months because fixed overhead dominates. This simulation
 * tests when adding zones flips the economics.
 */

import { assumptions as defaultAssumptions, type ModelAssumptions } from "./model.ts";
import { simulate, type SimulationResult, type MonthSnapshot } from "./simulate.ts";

export interface MultiZoneResult {
  zone_count: number;
  zones: SimulationResult[];
  combined: {
    months: CombinedMonth[];
    total_revenue_cents: number;
    total_cost_cents: number;
    total_margin_cents: number;
    avg_margin_pct: number;
    break_even_month: number | null;
    total_customers_month12: number;
    total_jobs_month12: number;
    overhead_per_zone_cents: number;
  };
  score: number;
}

interface CombinedMonth {
  month: number;
  total_customers: number;
  total_jobs: number;
  total_revenue_cents: number;
  total_provider_payout_cents: number;
  shared_overhead_cents: number;
  total_margin_cents: number;
  margin_pct: number;
}

/**
 * Run a multi-zone simulation.
 * Each zone uses slightly varied assumptions to model real-world heterogeneity.
 * Overhead is shared across all zones (1 ops person covers the metro).
 */
export function simulateMultiZone(
  zoneCount: number,
  baseAssumptions?: ModelAssumptions,
): MultiZoneResult {
  const base = baseAssumptions ?? defaultAssumptions;

  // Each zone gets slightly different demand characteristics
  // to model real-world variation (some suburbs richer, some denser)
  const zoneVariations = [
    { homes: 1.0, income: 1.0, ownership: 1.0 },   // Zone A: baseline
    { homes: 0.9, income: 1.1, ownership: 1.05 },   // Zone B: smaller but richer
    { homes: 1.1, income: 0.9, ownership: 0.95 },   // Zone C: bigger but less affluent
    { homes: 0.85, income: 1.15, ownership: 1.1 },  // Zone D: small, wealthy
    { homes: 1.2, income: 0.85, ownership: 0.9 },   // Zone E: large, mixed income
    { homes: 0.95, income: 1.05, ownership: 1.0 },  // Zone F: average
  ];

  const zones: SimulationResult[] = [];

  for (let i = 0; i < zoneCount; i++) {
    const variation = zoneVariations[i % zoneVariations.length];

    // Stagger launch: zone 1 starts month 1, zone 2 starts month 2, etc.
    // Simulated by reducing BYOC wave for later zones (they have less runway)
    const launchDelay = i; // months

    const zoneAssumptions: ModelAssumptions = {
      ...base,
      homes_in_zone: Math.round(base.homes_in_zone * variation.homes),
      income_qualifying_rate: Math.min(0.85, base.income_qualifying_rate * variation.income),
      home_ownership_rate: Math.min(0.90, base.home_ownership_rate * variation.ownership),
      // Later zones have fewer BYOC customers (providers already tapped their best)
      byoc_customers_per_provider: Math.max(5, Math.round(base.byoc_customers_per_provider * (1 - launchDelay * 0.15))),
      // Overhead is ZERO per zone — it's shared at the metro level
      monthly_ops_overhead_cents: 0,
      monthly_tech_overhead_cents: 0,
    };

    zones.push(simulate(zoneAssumptions));
  }

  // Combine monthly results across all zones + add shared overhead
  const sharedOpsOverhead = base.monthly_ops_overhead_cents;
  const sharedTechOverhead = base.monthly_tech_overhead_cents;
  const totalSharedOverhead = sharedOpsOverhead + sharedTechOverhead;
  const overheadPerZone = Math.round(totalSharedOverhead / zoneCount);

  const combinedMonths: CombinedMonth[] = [];
  let cumulativeMargin = 0;
  let breakEvenMonth: number | null = null;

  for (let month = 0; month < 12; month++) {
    let totalCustomers = 0;
    let totalJobs = 0;
    let totalRevenue = 0;
    let totalProviderPayout = 0;

    for (const zone of zones) {
      const snap = zone.months[month];
      if (snap) {
        totalCustomers += snap.active_customers;
        totalJobs += snap.total_jobs;
        totalRevenue += snap.revenue_cents;
        totalProviderPayout += snap.provider_payout_cents;
      }
    }

    // Add BYOC bonuses + referral credits from all zones
    let totalBonuses = 0;
    let totalReferralCredits = 0;
    for (const zone of zones) {
      const snap = zone.months[month];
      if (snap) {
        totalBonuses += snap.byoc_bonus_cents;
        totalReferralCredits += snap.referral_credit_cents;
      }
    }

    const totalCosts = totalProviderPayout + totalBonuses + totalReferralCredits + totalSharedOverhead;
    const margin = totalRevenue - totalCosts;
    const marginPct = totalRevenue > 0 ? (margin / totalRevenue) * 100 : -100;

    cumulativeMargin += margin;
    if (cumulativeMargin > 0 && !breakEvenMonth) {
      breakEvenMonth = month + 1;
    }

    combinedMonths.push({
      month: month + 1,
      total_customers: totalCustomers,
      total_jobs: totalJobs,
      total_revenue_cents: totalRevenue,
      total_provider_payout_cents: totalProviderPayout,
      shared_overhead_cents: totalSharedOverhead,
      total_margin_cents: margin,
      margin_pct: marginPct,
    });
  }

  const totalRevenue = combinedMonths.reduce((s, m) => s + m.total_revenue_cents, 0);
  const totalCost = combinedMonths.reduce((s, m) => s + (m.total_revenue_cents - m.total_margin_cents), 0);
  const totalMargin = totalRevenue - totalCost;
  const avgMargin = combinedMonths.reduce((s, m) => s + m.margin_pct, 0) / 12;

  const month12 = combinedMonths[11];

  const score =
    avgMargin * 30 +
    100 * 25 + // Retention assumed from single-zone (already validated)
    (month12 ? (month12.total_jobs / (zoneCount * base.provider_stops_per_day * base.provider_working_days_per_week * 4) * 100) : 0) * 20 +
    28 * 15 + // Attach rate from single-zone
    (breakEvenMonth ?? 52) * -10;

  return {
    zone_count: zoneCount,
    zones,
    combined: {
      months: combinedMonths,
      total_revenue_cents: totalRevenue,
      total_cost_cents: totalCost,
      total_margin_cents: totalMargin,
      avg_margin_pct: avgMargin,
      break_even_month: breakEvenMonth,
      total_customers_month12: month12?.total_customers ?? 0,
      total_jobs_month12: month12?.total_jobs ?? 0,
      overhead_per_zone_cents: overheadPerZone,
    },
    score,
  };
}

// === CLI RUNNER ===
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith("multi-zone.ts")) {
  console.log("\n=== MULTI-ZONE MARKET SIMULATION ===\n");
  console.log("Testing 1-6 zone configurations to find break-even point.\n");

  console.log(
    "Zones".padEnd(7) +
    "M12 Cust".padEnd(10) +
    "M12 Jobs".padEnd(10) +
    "Revenue".padEnd(12) +
    "Margin".padEnd(12) +
    "Margin%".padEnd(10) +
    "Break-Even".padEnd(12) +
    "OH/Zone".padEnd(10) +
    "Score"
  );
  console.log("─".repeat(93));

  for (let zones = 1; zones <= 6; zones++) {
    const result = simulateMultiZone(zones);
    const c = result.combined;

    console.log(
      String(zones).padEnd(7) +
      String(c.total_customers_month12).padEnd(10) +
      String(c.total_jobs_month12).padEnd(10) +
      `$${(c.total_revenue_cents / 100).toFixed(0)}`.padEnd(12) +
      `$${(c.total_margin_cents / 100).toFixed(0)}`.padEnd(12) +
      `${c.avg_margin_pct.toFixed(1)}%`.padEnd(10) +
      `${c.break_even_month ? `Month ${c.break_even_month}` : "Never"}`.padEnd(12) +
      `$${(c.overhead_per_zone_cents / 100).toFixed(0)}`.padEnd(10) +
      result.score.toFixed(0)
    );
  }

  // Detailed view of the best configuration
  console.log("\n\n=== DETAILED: 4-ZONE CONFIGURATION ===\n");
  const best = simulateMultiZone(4);

  console.log(
    "Month".padEnd(7) +
    "Customers".padEnd(11) +
    "Jobs".padEnd(8) +
    "Revenue".padEnd(12) +
    "Prov.Pay".padEnd(12) +
    "Overhead".padEnd(12) +
    "Margin".padEnd(12) +
    "Margin%"
  );
  console.log("─".repeat(86));

  for (const m of best.combined.months) {
    console.log(
      String(m.month).padEnd(7) +
      String(m.total_customers).padEnd(11) +
      String(m.total_jobs).padEnd(8) +
      `$${(m.total_revenue_cents / 100).toFixed(0)}`.padEnd(12) +
      `$${(m.total_provider_payout_cents / 100).toFixed(0)}`.padEnd(12) +
      `$${(m.shared_overhead_cents / 100).toFixed(0)}`.padEnd(12) +
      `$${(m.total_margin_cents / 100).toFixed(0)}`.padEnd(12) +
      `${m.margin_pct.toFixed(1)}%`
    );
  }

  console.log(`\nBreak-even: ${best.combined.break_even_month ? `Month ${best.combined.break_even_month}` : "Never"}`);
  console.log(`Total 12-month revenue: $${(best.combined.total_revenue_cents / 100).toFixed(0)}`);
  console.log(`Total 12-month margin: $${(best.combined.total_margin_cents / 100).toFixed(0)}`);
}
