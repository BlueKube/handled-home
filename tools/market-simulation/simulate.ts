/**
 * Market Simulation Engine
 *
 * Simulates 12 months of Handled Home operations for a single zone.
 * Takes ModelAssumptions as input, produces SimulationResult as output.
 *
 * This file is FIXED — the optimizer never modifies it.
 * Only model.ts assumptions change between experiments.
 */

import { assumptions as defaultAssumptions, type ModelAssumptions } from "./model.ts";

export interface MonthSnapshot {
  month: number;
  active_customers: number;
  new_from_byoc: number;
  new_from_referral: number;
  new_from_organic: number;
  churned: number;
  paused: number;
  returned_from_pause: number;
  total_jobs: number;
  revenue_cents: number;
  provider_payout_cents: number;
  byoc_bonus_cents: number;
  referral_credit_cents: number;
  gross_margin_cents: number;
  gross_margin_pct: number;
  provider_utilization_pct: number;
  attach_rate: number;
  cumulative_cac_cents: number;
}

export interface SimulationResult {
  months: MonthSnapshot[];
  score: number;
  metrics: {
    gross_margin_pct_avg: number;
    retention_60d_pct: number;
    provider_utilization_avg: number;
    attach_rate_90d: number;
    weeks_to_15_customers: number;
    total_revenue_cents: number;
    total_cost_cents: number;
    break_even_month: number | null;
    peak_customers: number;
    final_customers: number;
  };
}

export function simulate(input?: ModelAssumptions): SimulationResult {
  const m = input ?? defaultAssumptions;

  // === INITIAL STATE ===
  const byocCustomersAtLaunch = Math.round(
    m.providers_at_launch * m.byoc_customers_per_provider * m.byoc_invite_send_rate * m.byoc_activation_rate
  );
  const organicPool = m.homes_in_zone * m.home_ownership_rate * m.income_qualifying_rate;

  let activeCustomers = byocCustomersAtLaunch;
  let pausedCustomers = 0;
  let totalAcquired = byocCustomersAtLaunch;
  let customersWithSecondService = 0;
  let cumulativeCac = byocCustomersAtLaunch * m.cac_per_customer_cents;

  const months: MonthSnapshot[] = [];
  const providerCapacityPerMonth =
    m.providers_at_launch * m.provider_stops_per_day * m.provider_working_days_per_week * 4;

  // Track when we hit 15 customers (weekly resolution approximated)
  let weeksTo15 = activeCustomers >= m.min_customers_for_viability ? 0 : 52;

  // === MONTHLY SIMULATION ===
  for (let month = 1; month <= 12; month++) {
    // --- NEW CUSTOMERS ---

    // BYOC: first 3 months only (initial wave)
    const newByoc = month <= 3
      ? Math.round(
          m.providers_at_launch *
          m.byoc_customers_per_provider *
          m.byoc_invite_send_rate *
          m.byoc_activation_rate *
          (month === 1 ? 0.5 : month === 2 ? 0.3 : 0.2) // Diminishing waves
        )
      : 0;

    // Referrals from existing customers
    const newReferral = Math.round(
      activeCustomers * m.referral_rate_per_customer_per_month * m.referral_conversion_rate
    );

    // Organic growth (from marketing, word of mouth, app store)
    const newOrganic = Math.round(
      organicPool * m.initial_conversion_rate * m.monthly_organic_growth_rate * month
    );

    const totalNew = newByoc + newReferral + newOrganic;
    totalAcquired += totalNew;
    cumulativeCac += totalNew * m.cac_per_customer_cents;

    // --- CHURN ---
    const churnRate = month === 1
      ? m.month_1_churn_rate
      : month === 2
        ? m.month_2_churn_rate
        : m.steady_state_monthly_churn;

    const potentialChurn = Math.round(activeCustomers * churnRate);
    const actualPaused = Math.round(potentialChurn * m.pause_rate_instead_of_cancel);
    const actualChurned = potentialChurn - actualPaused;

    // Paused customers returning
    const returning = Math.round(pausedCustomers * m.pause_return_rate * 0.25); // 25% of paused return per month

    pausedCustomers = pausedCustomers + actualPaused - returning;
    activeCustomers = activeCustomers + totalNew - potentialChurn + returning;
    activeCustomers = Math.max(0, activeCustomers);

    // Track weeks to viability
    if (weeksTo15 === 52 && activeCustomers >= m.min_customers_for_viability) {
      weeksTo15 = month * 4; // Approximate
    }

    // --- ATTACH RATE ---
    const attachEligible = activeCustomers;
    const attachRate = month <= 1
      ? m.second_service_attach_30d
      : month <= 2
        ? m.second_service_attach_60d
        : m.second_service_attach_90d;
    customersWithSecondService = Math.round(attachEligible * attachRate);

    // --- JOBS ---
    // In the handles model, customers don't get unlimited service.
    // Each plan has a handle allowance per 28-day cycle.
    // Essential: ~14 handles (2 services/month at ~7 handles each)
    // Plus: ~28 handles (weekly service)
    // Premium: ~50 handles (weekly + extras)
    // Average handles per cycle determines jobs generated.
    const handlesPerJobAvg = 7; // ~7 handles = 1 standard lawn visit
    const avgHandlesPerCycle =
      14 * m.plan_mix_essential +
      28 * m.plan_mix_plus +
      50 * m.plan_mix_premium;
    const jobsPerCustomerPerMonth = avgHandlesPerCycle / handlesPerJobAvg;
    const baseJobs = Math.round(activeCustomers * jobsPerCustomerPerMonth);
    const addonJobs = Math.round(customersWithSecondService * (m.avg_handles_per_addon / handlesPerJobAvg));
    const totalJobs = baseJobs + addonJobs;

    // --- REVENUE ---
    const avgSubscriptionCents =
      m.essential_price_cents * m.plan_mix_essential +
      m.plus_price_cents * m.plan_mix_plus +
      m.premium_price_cents * m.plan_mix_premium;

    const subscriptionRevenue = Math.round(activeCustomers * avgSubscriptionCents);
    const addonRevenue = Math.round(customersWithSecondService * m.avg_handles_per_addon * 500); // ~$5 per handle
    const totalRevenue = subscriptionRevenue + addonRevenue;

    // --- COSTS ---
    const providerPayouts = Math.round(totalJobs * m.provider_payout_per_job_cents);

    // BYOC bonuses (only during bonus window)
    const byocBonuses = month <= Math.ceil(m.byoc_bonus_duration_weeks / 4)
      ? Math.round(
          byocCustomersAtLaunch * m.byoc_bonus_per_week_cents * 4
        )
      : 0;

    const referralCredits = Math.round(newReferral * m.referral_credit_cents);

    const totalCosts = providerPayouts + byocBonuses + referralCredits +
      m.monthly_ops_overhead_cents + m.monthly_tech_overhead_cents;

    const grossMargin = totalRevenue - totalCosts;
    const grossMarginPct = totalRevenue > 0 ? (grossMargin / totalRevenue) * 100 : -100;

    // --- PROVIDER UTILIZATION ---
    const utilization = providerCapacityPerMonth > 0
      ? Math.min(100, (totalJobs / providerCapacityPerMonth) * 100)
      : 0;

    months.push({
      month,
      active_customers: activeCustomers,
      new_from_byoc: newByoc,
      new_from_referral: newReferral,
      new_from_organic: newOrganic,
      churned: actualChurned,
      paused: actualPaused,
      returned_from_pause: returning,
      total_jobs: totalJobs,
      revenue_cents: totalRevenue,
      provider_payout_cents: providerPayouts,
      byoc_bonus_cents: byocBonuses,
      referral_credit_cents: referralCredits,
      gross_margin_cents: grossMargin,
      gross_margin_pct: grossMarginPct,
      provider_utilization_pct: utilization,
      attach_rate: attachRate,
      cumulative_cac_cents: cumulativeCac,
    });
  }

  // === COMPUTE AGGREGATE METRICS ===
  const avgMargin = months.reduce((s, m) => s + m.gross_margin_pct, 0) / 12;
  const avgUtilization = months.reduce((s, m) => s + m.provider_utilization_pct, 0) / 12;
  const totalRevenue = months.reduce((s, m) => s + m.revenue_cents, 0);
  const totalCost = months.reduce((s, m) => s + (m.revenue_cents - m.gross_margin_cents), 0);
  const peakCustomers = Math.max(...months.map(m => m.active_customers));
  const finalCustomers = months[11]?.active_customers ?? 0;

  // Retention: of customers active in month 1, how many are still active in month 3?
  const month1Customers = months[0]?.active_customers ?? 0;
  const month3Customers = months[2]?.active_customers ?? 0;
  const retention60d = month1Customers > 0 ? Math.min(100, (month3Customers / month1Customers) * 100) : 0;

  // Attach rate at 90 days
  const attachRate90d = months[2]?.attach_rate ?? 0;

  // Break-even month
  let breakEvenMonth: number | null = null;
  let cumulativeMargin = 0;
  for (const snap of months) {
    cumulativeMargin += snap.gross_margin_cents;
    if (cumulativeMargin > 0 && !breakEvenMonth) {
      breakEvenMonth = snap.month;
    }
  }

  const metrics = {
    gross_margin_pct_avg: avgMargin,
    retention_60d_pct: retention60d,
    provider_utilization_avg: avgUtilization,
    attach_rate_90d: attachRate90d * 100,
    weeks_to_15_customers: weeksTo15,
    total_revenue_cents: totalRevenue,
    total_cost_cents: totalCost,
    break_even_month: breakEvenMonth,
    peak_customers: peakCustomers,
    final_customers: finalCustomers,
  };

  // === SCORE ===
  const score =
    metrics.gross_margin_pct_avg * 30 +
    metrics.retention_60d_pct * 25 +
    metrics.provider_utilization_avg * 20 +
    metrics.attach_rate_90d * 15 +
    metrics.weeks_to_15_customers * -10;

  return { months, score, metrics };
}

// === CLI RUNNER ===
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith("simulate.ts")) {
  const result = simulate();

  console.log("\n=== HANDLED HOME MARKET SIMULATION ===\n");
  console.log("Monthly Projections:");
  console.log("─".repeat(120));
  console.log(
    "Month".padEnd(6) +
    "Customers".padEnd(11) +
    "New(BYOC)".padEnd(11) +
    "New(Ref)".padEnd(10) +
    "New(Org)".padEnd(10) +
    "Churned".padEnd(9) +
    "Jobs".padEnd(7) +
    "Revenue".padEnd(11) +
    "Margin".padEnd(10) +
    "Margin%".padEnd(9) +
    "Util%".padEnd(8) +
    "Attach%"
  );
  console.log("─".repeat(120));

  for (const m of result.months) {
    console.log(
      String(m.month).padEnd(6) +
      String(m.active_customers).padEnd(11) +
      String(m.new_from_byoc).padEnd(11) +
      String(m.new_from_referral).padEnd(10) +
      String(m.new_from_organic).padEnd(10) +
      String(m.churned).padEnd(9) +
      String(m.total_jobs).padEnd(7) +
      `$${(m.revenue_cents / 100).toFixed(0)}`.padEnd(11) +
      `$${(m.gross_margin_cents / 100).toFixed(0)}`.padEnd(10) +
      `${m.gross_margin_pct.toFixed(1)}%`.padEnd(9) +
      `${m.provider_utilization_pct.toFixed(1)}%`.padEnd(8) +
      `${(m.attach_rate * 100).toFixed(0)}%`
    );
  }

  console.log("\n=== KEY METRICS ===\n");
  console.log(`Gross Margin (avg):      ${result.metrics.gross_margin_pct_avg.toFixed(1)}%`);
  console.log(`60-Day Retention:        ${result.metrics.retention_60d_pct.toFixed(1)}%`);
  console.log(`Provider Utilization:    ${result.metrics.provider_utilization_avg.toFixed(1)}%`);
  console.log(`Attach Rate (90d):       ${result.metrics.attach_rate_90d.toFixed(1)}%`);
  console.log(`Weeks to 15 Customers:   ${result.metrics.weeks_to_15_customers}`);
  console.log(`Break-Even Month:        ${result.metrics.break_even_month ?? "Never (in 12 months)"}`);
  console.log(`Peak Customers:          ${result.metrics.peak_customers}`);
  console.log(`Final Customers (M12):   ${result.metrics.final_customers}`);
  console.log(`Total Revenue (12mo):    $${(result.metrics.total_revenue_cents / 100).toFixed(0)}`);

  console.log(`\n=== COMPOSITE SCORE: ${result.score.toFixed(1)} ===\n`);
}
