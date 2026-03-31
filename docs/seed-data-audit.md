# Seed Data Audit — Handled Home

> **Created:** 2026-03-30
> **Purpose:** Map every seed/config value to its source. Identify which values are calibrated from research, which are reasonable estimates, and which need provider interviews before pilot launch.
>
> **Legend:**
> - **✅ Calibrated** — Based on market research, industry data, or intentional product decision
> - **🔸 Estimated** — Reasonable guess, directionally correct, but not validated with providers
> - **❓ Needs Interview** — Must be validated with real providers before pilot; wrong value could break unit economics or operations
> - **⚠️ High Impact** — Incorrect value directly affects margin, provider pay, or customer pricing

---

## 1. Service SKUs (Durations & Pricing)

**Source file:** `supabase/migrations/20260223032019_543e40f8-d9ca-4417-987f-516ca49fd766.sql`

| SKU | Category | Duration (min) | Base Price (cents) | Handle Cost | Source | Impact | Notes |
|-----|----------|---------------:|-------------------:|:-----------:|--------|--------|-------|
| Standard Mow | mowing | 30 | 4900 | 1 | 🔸 Estimated | ⚠️ High | Duration varies by lot size (15min for 1/8 acre vs 60min for 1/2 acre). Flat 30min is a placeholder. |
| Edge & Trim | mowing | 15 | 1500 | 1 | 🔸 Estimated | | Add-on; duration reasonable for small lots |
| Leaf Cleanup | mowing | 45 | 3500 | 1 | 🔸 Estimated | ⚠️ High | Highly seasonal; 45min may be low for heavy fall cleanup |
| Hedge Trimming | mowing | 30 | 2500 | 1 | 🔸 Estimated | | Depends on hedge count/height |
| Weed Treatment | mowing | 20 | 2000 | 1 | 🔸 Estimated | | Chemical vs. manual matters; 20min is optimistic for manual |
| Fertilization | mowing | 20 | 3000 | 1 | 🔸 Estimated | | Application time depends on lot size |
| Mulch Application | mowing | 45 | 4500 | 1 | ❓ Needs Interview | ⚠️ High | Material cost not included in base price; 45min may be low for large beds |
| Spring Prep | mowing | 60 | 7500 | 1 | ❓ Needs Interview | ⚠️ High | Compound task; scope undefined — what's included? |
| Window Cleaning | windows | 45 | 6500 | 1 | 🔸 Estimated | ⚠️ High | 45min for how many windows? Needs per-story-tier durations |
| Power Wash | power_wash | 60 | 8500 | 1 | ❓ Needs Interview | ⚠️ High | Equipment setup time? Surface area? Driveway vs. whole house? |
| Pool Service | pool | 30 | 5000 | 1 | ❓ Needs Interview | ⚠️ High | Chemical testing + cleaning varies; 30min may be tight |
| Pest Control | pest | 20 | 4000 | 1 | 🔸 Estimated | | Interior + exterior? 20min is reasonable for perimeter-only |
| Dog Poop Cleanup | pet_waste | 15 | 2500 | 1 | ✅ Calibrated | | Simple task, 15min is standard for weekly pickup |

**Key finding #1:** All durations are flat (not tiered by property size). The system supports property sizing tiers, but SKU seed data doesn't use them. This is the #1 calibration priority — a 30-minute mow on a 1/4 acre lot could take 60+ minutes on a 1/2 acre.

**Key finding #2:** Every SKU has handle_cost = 1 (the column default). This means a 15-minute Edge & Trim and a 60-minute Spring Prep both cost the same 1 handle — there is no economic differentiation. Handle costs must be calibrated per-SKU before launch (e.g., mow = 3 handles, edge & trim = 1, power wash = 5). This is tagged ❓ Needs Interview with ⚠️ High impact — flat handle costs break the entire subscription spread model.

---

## 2. Subscription Plans

**Source file:** `supabase/migrations/20260322000000_fix_test_users_and_seed_metro.sql`

| Plan | Display Price | Weeks/Cycle | Minutes/Cycle | Extra Allowed | Source | Impact | Notes |
|------|-------------:|:-----------:|:-------------:|:------------:|--------|--------|-------|
| Basic | $49/mo | 4 | 60 | No | 🔸 Estimated | ⚠️ High | 60 min/cycle = 1 standard mow + edge & trim. Very tight. |
| Standard | $85/mo | 4 | 120 | Yes | 🔸 Estimated | ⚠️ High | Most popular tier. 120 min allows ~2 services/week. |
| Premium | $149/mo | 4 | 240 | Yes | 🔸 Estimated | ⚠️ High | 240 min is generous but margin depends on provider payout. |

**vs. Session 1 simulation findings:** The market simulation optimized to $129/$179/$279 pricing with $45/job payout for near break-even at month 14. Current seed prices ($49/$85/$149) are significantly lower. **Plan pricing is the #1 revenue lever — these values must be reconciled with the simulation before launch.**

**Handle system interaction:** The seeded plans use a `minutes_per_cycle` model — the minutes/cycle value is the operational constraint. Handles are a parallel currency layer: plans grant handle allowances, and each SKU has a handle cost (currently all defaulting to 1). The relationship between minutes-based entitlements and handle-based consumption needs end-to-end validation to confirm which model is active at checkout and enforcement time.

---

## 3. Zone Configuration

**Source file:** `supabase/migrations/20260322000000_fix_test_users_and_seed_metro.sql`

| Zone | ZIP Codes | Max Stops/Day | Max Min/Day | Buffer % | Service Day | Source | Notes |
|------|-----------|:------------:|:-----------:|:--------:|:-----------:|--------|-------|
| Austin Central | 78701-78705 | 12 | 480 | 10% | Tuesday | 🔸 Estimated | Dense urban core; 12 stops/8hrs = 40min avg per stop |
| Austin South | 78745,78748,78749,78744,78747 | 10 | 420 | 15% | Wednesday | 🔸 Estimated | More spread out; 10 stops/7hrs |
| Austin East | 78721-78724,78741 | 10 | 420 | 15% | Thursday | 🔸 Estimated | Similar to South |
| Round Rock | 78664,78665,78681,78717 | 8 | 360 | 20% | Monday | 🔸 Estimated | Suburban; 8 stops/6hrs with higher buffer |
| Cedar Park | 78613,78641,78726 | 8 | 360 | 20% | Friday | 🔸 Estimated | Suburban |

**Key finding:** ZIP codes are real Austin area codes. Capacity parameters (stops/day, minutes/day) are reasonable estimates but haven't been validated against actual provider route data. Buffer percentages (10-20%) are sensible but arbitrary.

---

## 4. Assignment Algorithm Config

**Source file:** `supabase/migrations/20260322000000_fix_test_users_and_seed_metro.sql`

| Parameter | Value | Source | Impact | Notes |
|-----------|-------|--------|--------|-------|
| max_daily_capacity | 12 | 🔸 Estimated | ⚠️ High | Must match zone max stops |
| proximity_weight | 0.4 | 🔸 Estimated | | Highest weight — route density prioritized |
| quality_weight | 0.3 | 🔸 Estimated | | Second priority |
| availability_weight | 0.2 | 🔸 Estimated | | Third priority |
| cost_weight | 0.1 | 🔸 Estimated | | Lowest weight |
| auto_assign_enabled | true | ✅ Calibrated | | Product decision |
| fallback_expand_radius | 5 miles | 🔸 Estimated | | Reasonable for Austin metro |

**Notes:** Weight distribution (0.4/0.3/0.2/0.1) is a reasonable starting point but entirely untested. In practice, proximity should dominate early (sparse routes) and quality should matter more at density.

---

## 5. Billing & Payout Config

**Source file:** `supabase/migrations/20260322000000_fix_test_users_and_seed_metro.sql`

| Parameter | Value | Source | Impact | Notes |
|-----------|-------|--------|--------|-------|
| billing.auto_retry_days | 3 | ✅ Calibrated | | Industry standard |
| billing.dunning_max_steps | 4 | 🔸 Estimated | | Config says 4 but code implements a 5-step ladder — reconcile before launch |
| payout.weekly_day | Friday | ✅ Calibrated | | Product decision — providers paid end of week |
| payout.min_threshold_cents | 1000 ($10) | 🔸 Estimated | | Low threshold; may generate many small payouts |
| quality.probation_threshold | 65 | 🔸 Estimated | | Below this, provider enters probation |
| quality.excellent_threshold | 90 | 🔸 Estimated | | Above this, provider earns Gold tier |
| growth.byoc_bonus_cents | 1000 ($10/week) | ❓ Needs Interview | ⚠️ High | $10/week × 90 days = $130/customer. Is this sustainable? |
| growth.byoc_bonus_duration | 90 days | ❓ Needs Interview | ⚠️ High | 3 months of bonus per BYOC customer |
| scheduling.auto_assign | true | ✅ Calibrated | | Product decision |
| notifications.digest_hour | 8 (8 AM) | ✅ Calibrated | | Morning digest |

**Key finding:** BYOC bonus ($10/week for 90 days = $130/customer) is a significant acquisition cost. The simulation showed $45/job payout was optimal — need to verify BYOC bonuses don't push unit economics negative in early months.

---

## 6. Provider Tier System

**Source file:** `src/hooks/useProviderTier.ts`

| Tier | Hold Days | Priority Mod | Source | Notes |
|------|:---------:|:------------:|--------|-------|
| Gold | 2 | +2 | 🔸 Estimated | Fastest payout, highest job priority |
| Silver | 3 | +1 | 🔸 Estimated | Standard |
| Standard | 5 | 0 | 🔸 Estimated | Longest hold, base priority |

**Notes:** Hold days (2/3/5) are reasonable but arbitrary. Providers will care deeply about payout speed — this is a retention lever. Standard tier 5-day hold may feel punitive to new providers.

---

## 7. Zone Builder Algorithm

**Source file:** `src/hooks/useZoneBuilderRun.ts`

| Parameter | Value | Source | Notes |
|-----------|-------|--------|-------|
| H3 resolution | 7 | ✅ Calibrated | ~5.16 km² per cell — appropriate for metro zones |
| seed_strategy | "auto" | ✅ Calibrated | Hybrid demand/supply optimization |
| target_workload_days | 4 | 🔸 Estimated | 4-day work weeks; leaves buffer day |
| max_spread_minutes | 15 | 🔸 Estimated | 15min max drive between stops; tight for suburban |
| min_density | 0.5 | 🔸 Estimated | Minimum customer density threshold |

---

## 8. Holiday Calendar

**Source file:** `supabase/migrations/20260225052108_*.sql`

| Status | Notes |
|--------|-------|
| ✅ Calibrated | US federal holidays for 2026-2027 with correct dates. All marked skip_jobs=true. |

**Minor issue:** Columbus Day included as non-federal. Some providers may want to work it. Consider making holiday observance configurable per provider.

---

## 9. Notification Templates

**Source file:** `supabase/migrations/20260329000001_seed_invite_scripts.sql` + notification template seeds

| Template Set | Count | Source | Notes |
|-------------|:-----:|--------|-------|
| BYOC invite scripts | 3 | ✅ Calibrated | Casual/Professional/Brief variants |
| Notification types | 13+ | ✅ Calibrated | Product decisions — event-driven notifications |
| Notification copy | 19 | ✅ Calibrated | "Calm concierge" voice per design guidelines |

---

## 10. Service Categories & Images

**Source files:** `src/lib/serviceCategories.ts`, `src/lib/serviceImages.ts`

| Data | Source | Notes |
|------|--------|-------|
| Category labels/icons | ✅ Calibrated | Product taxonomy decision |
| SKU→image mappings | ✅ Calibrated | Hardcoded Unsplash URLs |

---

## Priority Calibration Items (for Provider Interviews)

Ordered by economic impact:

| # | Item | Current Value | Why It Matters | Risk if Wrong |
|---|------|---------------|----------------|---------------|
| 1 | **Plan pricing** | $49/$85/$149 | Simulation says $129/$179/$279 needed for break-even | Revenue 40-60% below sustainability |
| 2 | **Per-SKU handle costs** | All = 1 (column default) | A 15-min trim and 60-min spring prep both cost 1 handle — no economic differentiation | Subscription spread model is meaningless |
| 3 | **SKU durations by property size** | Flat (not tiered) | A 30-min mow estimate on a large lot means provider loses money | Provider churn, margin collapse |
| 4 | **Provider payout per job** | Not seeded (simulation: $45) | The spread between sub price and payout = entire margin | Business viability |
| 5 | **BYOC bonus economics** | $10/wk × 90d = $130/customer | High if churn happens before month 4 | CAC exceeds LTV |
| 6 | **Window cleaning duration** | 45 min flat | Per-story matters: 1-story = 30min, 2-story = 60-90min | Under-scoping the hardest jobs |
| 7 | **Power wash scope** | 60 min flat | Driveway vs. whole house is 2-3× difference | Provider disputes, losses |
| 8 | **Pool service duration** | 30 min | Chemical testing adds 10-15 min; may need 45 | Under-serving customers |
| 9 | **Zone capacity limits** | 8-12 stops/day | If providers can only do 6, the whole schedule breaks | Overcommitment, missed visits |

---

## Summary Statistics

| Category | Total Values | ✅ Calibrated | 🔸 Estimated | ❓ Needs Interview |
|----------|:----------:|:------------:|:------------:|:-----------------:|
| SKU durations/pricing/handles | 14 | 1 | 8 | 5 |
| Plan pricing/entitlements | 3 | 0 | 3 | 0 |
| Zone configuration | 5 | 0 | 5 | 0 |
| Assignment algorithm | 7 | 1 | 6 | 0 |
| Billing/payout config | 10 | 4 | 4 | 2 |
| Provider tiers | 3 | 0 | 3 | 0 |
| Zone builder | 5 | 2 | 3 | 0 |
| Holidays | 1 set | 1 | 0 | 0 |
| Notification templates | 3 sets | 3 | 0 | 0 |
| **Totals** | **~51** | **12 (24%)** | **32 (63%)** | **7 (14%)** |

**Bottom line:** 76% of seed data values are estimated or need interviews. The 7 "Needs Interview" items are concentrated in SKU durations, handle costs, and BYOC economics — exactly where wrong values cause the most damage.

---

*This document should be used alongside the provider interview guide from the launch playbook (Session 1). Interview questions should specifically target the ❓ and ⚠️ items above.*
