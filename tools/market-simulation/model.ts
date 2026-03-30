/**
 * Business Model Assumptions
 *
 * This is the ONLY file the optimizer mutates.
 * Each field has a current value, a min/max range for optimization,
 * and a description explaining what it controls.
 */

export interface ModelAssumptions {
  // === ZONE PARAMETERS ===
  zone_radius_miles: number;
  max_homes_per_day: number;
  max_drive_minutes_between_stops: number;
  min_customers_for_viability: number;

  // === DEMAND PARAMETERS ===
  homes_in_zone: number;
  home_ownership_rate: number;
  income_qualifying_rate: number;
  initial_conversion_rate: number;
  monthly_organic_growth_rate: number;

  // === BYOC PARAMETERS ===
  providers_at_launch: number;
  byoc_customers_per_provider: number;
  byoc_invite_send_rate: number;
  byoc_activation_rate: number;
  byoc_bonus_per_week_cents: number;
  byoc_bonus_duration_weeks: number;

  // === REFERRAL PARAMETERS ===
  referral_rate_per_customer_per_month: number;
  referral_conversion_rate: number;
  referral_credit_cents: number;

  // === SUBSCRIPTION PARAMETERS ===
  essential_price_cents: number;
  plus_price_cents: number;
  premium_price_cents: number;
  plan_mix_essential: number;
  plan_mix_plus: number;
  plan_mix_premium: number;
  billing_cycle_days: number;

  // === PROVIDER ECONOMICS ===
  provider_payout_per_job_cents: number;
  provider_stops_per_day: number;
  provider_working_days_per_week: number;
  provider_drive_minutes_per_stop: number;
  provider_service_minutes_per_stop: number;

  // === RETENTION & CHURN ===
  month_1_churn_rate: number;
  month_2_churn_rate: number;
  steady_state_monthly_churn: number;
  pause_rate_instead_of_cancel: number;
  pause_return_rate: number;

  // === ATTACH RATE (Bundle Expansion) ===
  second_service_attach_30d: number;
  second_service_attach_60d: number;
  second_service_attach_90d: number;
  avg_handles_per_addon: number;

  // === OPERATIONAL COSTS ===
  cac_per_customer_cents: number;
  monthly_ops_overhead_cents: number;
  monthly_tech_overhead_cents: number;
}

/**
 * Current best-guess assumptions.
 * These are the starting values for optimization.
 * Sources: provider interviews (TBD), Census data, industry benchmarks.
 */
export const assumptions: ModelAssumptions = {
  // Zone
  zone_radius_miles: 6,
  max_homes_per_day: 8,
  max_drive_minutes_between_stops: 15,
  min_customers_for_viability: 15,

  // Demand
  homes_in_zone: 5000,
  home_ownership_rate: 0.65,
  income_qualifying_rate: 0.40,
  initial_conversion_rate: 0.015,
  monthly_organic_growth_rate: 0.02,

  // BYOC
  providers_at_launch: 3,
  byoc_customers_per_provider: 15,
  byoc_invite_send_rate: 0.60,
  byoc_activation_rate: 0.30,
  byoc_bonus_per_week_cents: 1000,
  byoc_bonus_duration_weeks: 12,

  // Referrals
  referral_rate_per_customer_per_month: 0.05,
  referral_conversion_rate: 0.20,
  referral_credit_cents: 3000,

  // Subscription
  essential_price_cents: 9900,
  plus_price_cents: 14900,
  premium_price_cents: 24900,
  plan_mix_essential: 0.30,
  plan_mix_plus: 0.50,
  plan_mix_premium: 0.20,
  billing_cycle_days: 28,

  // Provider economics
  provider_payout_per_job_cents: 4500,
  provider_stops_per_day: 7,
  provider_working_days_per_week: 5,
  provider_drive_minutes_per_stop: 8,
  provider_service_minutes_per_stop: 45,

  // Retention
  month_1_churn_rate: 0.15,
  month_2_churn_rate: 0.08,
  steady_state_monthly_churn: 0.04,
  pause_rate_instead_of_cancel: 0.40,
  pause_return_rate: 0.60,

  // Attach rate
  second_service_attach_30d: 0.10,
  second_service_attach_60d: 0.20,
  second_service_attach_90d: 0.30,
  avg_handles_per_addon: 3,

  // Costs
  cac_per_customer_cents: 5000,
  monthly_ops_overhead_cents: 200000,
  monthly_tech_overhead_cents: 50000,
};

/**
 * Optimization bounds for each assumption.
 * The optimizer will only explore values within these ranges.
 */
export const bounds: Record<keyof ModelAssumptions, [number, number]> = {
  zone_radius_miles: [3, 12],
  max_homes_per_day: [5, 12],
  max_drive_minutes_between_stops: [8, 25],
  min_customers_for_viability: [8, 30],

  homes_in_zone: [2000, 15000],
  home_ownership_rate: [0.40, 0.85],
  income_qualifying_rate: [0.20, 0.70],
  initial_conversion_rate: [0.005, 0.05],
  monthly_organic_growth_rate: [0.01, 0.08],

  providers_at_launch: [1, 8],
  byoc_customers_per_provider: [5, 30],
  byoc_invite_send_rate: [0.20, 0.90],
  byoc_activation_rate: [0.10, 0.60],
  byoc_bonus_per_week_cents: [500, 2000],
  byoc_bonus_duration_weeks: [4, 24],

  referral_rate_per_customer_per_month: [0.01, 0.15],
  referral_conversion_rate: [0.05, 0.40],
  referral_credit_cents: [1000, 5000],

  essential_price_cents: [6900, 14900],
  plus_price_cents: [9900, 19900],
  premium_price_cents: [17900, 34900],
  plan_mix_essential: [0.15, 0.50],
  plan_mix_plus: [0.30, 0.60],
  plan_mix_premium: [0.05, 0.35],
  billing_cycle_days: [28, 28],

  provider_payout_per_job_cents: [2500, 7500],
  provider_stops_per_day: [4, 10],
  provider_working_days_per_week: [4, 6],
  provider_drive_minutes_per_stop: [3, 15],
  provider_service_minutes_per_stop: [25, 75],

  month_1_churn_rate: [0.05, 0.30],
  month_2_churn_rate: [0.03, 0.15],
  steady_state_monthly_churn: [0.02, 0.10],
  pause_rate_instead_of_cancel: [0.20, 0.70],
  pause_return_rate: [0.30, 0.80],

  second_service_attach_30d: [0.03, 0.25],
  second_service_attach_60d: [0.08, 0.40],
  second_service_attach_90d: [0.15, 0.55],
  avg_handles_per_addon: [2, 5],

  cac_per_customer_cents: [1000, 15000],
  monthly_ops_overhead_cents: [50000, 500000],
  monthly_tech_overhead_cents: [20000, 150000],
};
