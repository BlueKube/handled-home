/**
 * Market Simulation Engine — Browser-compatible port
 *
 * Ported from tools/market-simulation/simulate.ts for use in the admin simulator page.
 * Takes ModelAssumptions as input, produces SimulationResult as output.
 * No Node.js dependencies — runs entirely in the browser.
 */

import { assumptions as defaultAssumptions, type ModelAssumptions } from "./model";

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
  seasonal_multiplier: number;
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

  let weeksTo15 = activeCustomers >= m.min_customers_for_viability ? 0 : 52;

  for (let month = 1; month <= 12; month++) {
    // New customers
    const newByoc = month <= 3
      ? Math.round(
          m.providers_at_launch *
          m.byoc_customers_per_provider *
          m.byoc_invite_send_rate *
          m.byoc_activation_rate *
          (month === 1 ? 0.5 : month === 2 ? 0.3 : 0.2)
        )
      : 0;

    const newReferral = Math.round(
      activeCustomers * m.referral_rate_per_customer_per_month * m.referral_conversion_rate
    );

    const remainingPool = Math.max(0, organicPool - totalAcquired);
    const newOrganic = Math.round(
      remainingPool * m.initial_conversion_rate * m.monthly_organic_growth_rate * month
    );

    const totalNew = newByoc + newReferral + newOrganic;
    totalAcquired += totalNew;
    cumulativeCac += totalNew * m.cac_per_customer_cents;

    // Churn
    const churnRate = month === 1
      ? m.month_1_churn_rate
      : month === 2
        ? m.month_2_churn_rate
        : m.steady_state_monthly_churn;

    const potentialChurn = Math.round(activeCustomers * churnRate);
    const actualPaused = Math.round(potentialChurn * m.pause_rate_instead_of_cancel);
    const actualChurned = potentialChurn - actualPaused;
    const returning = Math.round(pausedCustomers * m.pause_return_rate * 0.25);

    pausedCustomers = pausedCustomers + actualPaused - returning;
    activeCustomers = Math.max(0, activeCustomers + totalNew - potentialChurn + returning);

    if (weeksTo15 === 52 && activeCustomers >= m.min_customers_for_viability) {
      weeksTo15 = month * 4;
    }

    // Attach rate
    const attachRate = month <= 1
      ? m.second_service_attach_30d
      : month <= 2
        ? m.second_service_attach_60d
        : m.second_service_attach_90d;
    customersWithSecondService = Math.round(activeCustomers * attachRate);

    // Seasonal adjustment
    const monthIdx = (month - 1) % 12;
    const seasonalMultiplier =
      m.seasonal_lawn[monthIdx] * m.seasonal_weight_lawn +
      m.seasonal_pest[monthIdx] * m.seasonal_weight_pest +
      m.seasonal_windows[monthIdx] * m.seasonal_weight_windows +
      m.seasonal_pool[monthIdx] * m.seasonal_weight_pool;

    // Jobs
    const handlesPerJobAvg = 7;
    const avgHandlesPerCycle =
      14 * m.plan_mix_essential +
      28 * m.plan_mix_plus +
      50 * m.plan_mix_premium;
    const jobsPerCustomerPerMonth = avgHandlesPerCycle / handlesPerJobAvg;
    const baseJobs = Math.round(activeCustomers * jobsPerCustomerPerMonth * seasonalMultiplier);
    const addonJobs = Math.round(customersWithSecondService * (m.avg_handles_per_addon / handlesPerJobAvg) * seasonalMultiplier);
    const totalJobs = baseJobs + addonJobs;

    // Revenue
    const avgSubscriptionCents =
      m.essential_price_cents * m.plan_mix_essential +
      m.plus_price_cents * m.plan_mix_plus +
      m.premium_price_cents * m.plan_mix_premium;

    const subscriptionRevenue = Math.round(activeCustomers * avgSubscriptionCents);
    const addonRevenue = Math.round(customersWithSecondService * m.avg_handles_per_addon * 500 * seasonalMultiplier);
    const totalRevenue = subscriptionRevenue + addonRevenue;

    // Costs
    const providerPayouts = Math.round(totalJobs * m.provider_payout_per_job_cents);

    const byocSurvivalRate = month === 1 ? (1 - m.month_1_churn_rate) : month === 2 ? (1 - m.month_1_churn_rate) * (1 - m.month_2_churn_rate) : (1 - m.month_1_churn_rate) * (1 - m.month_2_churn_rate) * Math.pow(1 - m.steady_state_monthly_churn, month - 2);
    const survivingByocCustomers = Math.round(byocCustomersAtLaunch * byocSurvivalRate);
    const byocBonuses = month <= Math.ceil(m.byoc_bonus_duration_weeks / 4)
      ? Math.round(survivingByocCustomers * m.byoc_bonus_per_week_cents * 4)
      : 0;

    const referralCredits = Math.round(newReferral * m.referral_credit_cents);

    const totalCosts = providerPayouts + byocBonuses + referralCredits +
      m.monthly_ops_overhead_cents + m.monthly_tech_overhead_cents;

    const grossMargin = totalRevenue - totalCosts;
    const grossMarginPct = totalRevenue > 0 ? (grossMargin / totalRevenue) * 100 : -100;

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
      seasonal_multiplier: seasonalMultiplier,
    });
  }

  // Aggregate metrics
  const avgMargin = months.reduce((s, m) => s + m.gross_margin_pct, 0) / 12;
  const avgUtilization = months.reduce((s, m) => s + m.provider_utilization_pct, 0) / 12;
  const totalRevenue = months.reduce((s, m) => s + m.revenue_cents, 0);
  const totalCost = months.reduce((s, m) => s + (m.revenue_cents - m.gross_margin_cents), 0);
  const peakCustomers = Math.max(...months.map(m => m.active_customers));
  const finalCustomers = months[11]?.active_customers ?? 0;

  const month1Customers = months[0]?.active_customers ?? 0;
  const month2Customers = months[1]?.active_customers ?? 0;
  const retention60d = month1Customers > 0 ? Math.min(100, (month2Customers / month1Customers) * 100) : 0;

  const attachRate90d = months[2]?.attach_rate ?? 0;

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

  const score =
    metrics.gross_margin_pct_avg * 30 +
    metrics.retention_60d_pct * 25 +
    metrics.provider_utilization_avg * 20 +
    metrics.attach_rate_90d * 15 +
    metrics.weeks_to_15_customers * -10;

  return { months, score, metrics };
}
