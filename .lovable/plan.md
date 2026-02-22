

# Module 05 Upgrade: 28-Day Billing + Weekly Service Weeks (No Rollover)

## Overview
Upgrade the existing subscription engine to support a dual-clock model: 28-day billing cycles and zone-anchored weekly service weeks. No rollover of unused weeks. Stripe remains payment rail only; entitlements live in the database.

---

## Phase 1: Database Migration

### 1a. New table: `zone_service_week_config`
- id (uuid, pk, default gen_random_uuid())
- zone_id (uuid, FK to zones, unique)
- anchor_day (int, default 1 -- Monday)
- anchor_time_local (time, default '00:00')
- cutoff_day_offset (int, default -1)
- cutoff_time_local (time, default '18:00')
- is_active (boolean, default true)
- created_at, updated_at + trigger

RLS: Admins can manage all; authenticated can read.

### 1b. Add columns to `subscriptions`
- access_activated_at (timestamptz, nullable)
- billing_cycle_start_at (timestamptz, nullable)
- billing_cycle_end_at (timestamptz, nullable)
- next_billing_at (timestamptz, nullable)
- billing_cycle_length_days (int, default 28)
- current_service_week_start_at (timestamptz, nullable)
- current_service_week_end_at (timestamptz, nullable)
- next_service_week_start_at (timestamptz, nullable)
- next_service_week_end_at (timestamptz, nullable)

### 1c. Add column to `plan_entitlement_versions`
- included_service_weeks_per_billing_cycle (int, default 4)

### 1d. Add columns to `customer_plan_selections`
- effective_billing_cycle_start_at (timestamptz, nullable)
- effective_service_week_start_at (timestamptz, nullable)
- is_locked_for_service_week (boolean, default false)
- locked_at (timestamptz, nullable)

---

## Phase 2: Utility Functions (Client-Side)

### `src/lib/billing.ts` (new file)
Two pure utility functions:

```
computeBillingCycle(startUtc: Date, lengthDays = 28)
  -> { start, end, nextBillingAt }
```

```
computeServiceWeek(anchorDay: number, anchorTimeLocal: string, nowUtc: Date)
  -> { currentStart, currentEnd, nextStart, nextEnd }
```

These are used by the webhook (on activation) and by UI components to display dates.

---

## Phase 3: Update Entitlement Resolution

### `src/hooks/useEntitlements.ts`
Add to `EntitlementPayload`:
- `service_weeks.included_per_billing_cycle` (from version)
- `service_weeks.consumed_in_current_cycle` (init 0 -- future modules increment)
- `service_weeks.remaining_in_current_cycle` (included - consumed, min 0)

Update `messages.included_explainer` to say "X service weeks per billing cycle" when using service week model.
Update `messages.change_policy` to reference "next billing cycle (every 4 weeks)".

---

## Phase 4: Update Hooks

### `src/hooks/useSubscription.ts`
- Extend `Subscription` interface with the new billing/service week fields
- `useChangePlan` sets `pending_effective_billing_cycle_start_at` = current `billing_cycle_end_at`

### `src/hooks/usePlans.ts`
- Extend `PlanEntitlementVersion` interface with `included_service_weeks_per_billing_cycle`

### `src/hooks/useZoneServiceWeekConfig.ts` (new)
- `useZoneServiceWeekConfig(zoneId)` -- fetch config
- `useUpsertZoneServiceWeekConfig()` -- admin mutation

---

## Phase 5: Stripe Webhook Update

### `supabase/functions/stripe-webhook/index.ts`
On `checkout.session.completed`:
- Set `access_activated_at = now()`
- Set `billing_cycle_start_at = now()`, `billing_cycle_end_at = now + 28 days`, `next_billing_at = now + 28 days`
- Fetch zone service week config for the subscription's zone
- Compute and set service week fields using anchor day
- Change existing `current_period_end` from 30-day to 28-day calculation

### `supabase/functions/create-checkout-session/index.ts`
- When creating Stripe checkout, pass `subscription_data.billing_cycle_anchor` or use `recurring` interval config. Actually, Stripe natively supports day-based intervals via price configuration. The 28-day cycle should be set on the Stripe Price object (interval: "day", interval_count: 28). This is a Stripe Price configuration concern -- document it for the admin but no code change needed in the edge function itself.

---

## Phase 6: UI Updates

### 6a. Billing Language (Multiple Files)

**`src/components/plans/PlanCard.tsx`**
- Below price text, add: "Billed every 4 weeks"

**`src/pages/customer/Subscribe.tsx`**
- Change "Billed monthly. Cancel anytime." to "Billed every 4 weeks. Cancel anytime."
- On success screen: replace bullet points with:
  - "Access is active now."
  - "Next billing date: [computed date] (every 4 weeks)"
  - "Your service weeks follow a predictable weekly rhythm."
  - CTA: "Build / Confirm Routine"

### 6b. Subscription Management (`src/pages/customer/Subscription.tsx`)
- Show billing cycle range: "Billing cycle: [start] -- [end]"
- Show next billing date
- Show current service week: "[start] -- [end]"
- Show next service week
- Pending plan change shows: "Effective [billing_cycle_end_at]"

### 6c. `src/components/plans/SubscriptionStatusPanel.tsx`
- Add billing cycle + service week date displays
- Show "Billed every 4 weeks" instead of generic renewal date

### 6d. Routine Builder Header (`src/pages/customer/Routine.tsx`)
- Add header text: "Includes X service weeks per billing cycle"
- Add: "Remaining this cycle: Y" (using entitlement data)
- No rollover messaging

### 6e. `src/components/plans/RoutineSummaryBar.tsx`
- Add optional `serviceWeeksIncluded` / `serviceWeeksRemaining` props
- Show service week info when provided

---

## Phase 7: Admin Updates

### 7a. Zone Service Week Config
Add a "Service Week" section to the zone detail/edit sheet (`src/components/admin/ZoneFormSheet.tsx` or `ZoneDetailSheet.tsx`):
- Anchor day dropdown (Mon-Sun)
- Anchor time input
- Active toggle

This is simpler than a separate route -- it fits naturally in the existing zone editing UI.

### 7b. Plan Builder Entitlement Field (`src/pages/admin/Plans.tsx`)
In `EntitlementEditor` and `CreateFirstVersion`:
- Add "Service Weeks per Billing Cycle" number input (1/2/4)
- This is saved to `included_service_weeks_per_billing_cycle` on the entitlement version

---

## Phase 8: Documentation

Update `docs/modules/05-subscription-engine.md` to document:
- Dual-clock model (28-day billing + weekly ops)
- No rollover policy
- Service week anchoring per zone
- Billing language requirements

---

## Files Impact

### New files (2)
- `src/lib/billing.ts` -- pure utility functions
- `src/hooks/useZoneServiceWeekConfig.ts` -- zone config hook

### Modified files (~10)
- `src/hooks/useEntitlements.ts` -- service week fields in payload
- `src/hooks/useSubscription.ts` -- extended interface + change plan logic
- `src/hooks/usePlans.ts` -- extended PlanEntitlementVersion interface
- `src/components/plans/PlanCard.tsx` -- billing language
- `src/components/plans/SubscriptionStatusPanel.tsx` -- cycle dates display
- `src/components/plans/RoutineSummaryBar.tsx` -- service week info
- `src/pages/customer/Subscribe.tsx` -- billing language + success screen
- `src/pages/customer/Subscription.tsx` -- cycle dates + service week display
- `src/pages/customer/Routine.tsx` -- service week header
- `src/pages/admin/Plans.tsx` -- service weeks field in entitlement editor
- `src/components/admin/ZoneFormSheet.tsx` or `ZoneDetailSheet.tsx` -- anchor config
- `supabase/functions/stripe-webhook/index.ts` -- billing cycle + service week init
- `docs/modules/05-subscription-engine.md` -- updated spec

### Database changes
- 1 new table (`zone_service_week_config`)
- 3 tables altered (add columns to `subscriptions`, `plan_entitlement_versions`, `customer_plan_selections`)

---

## Implementation Order

1. Database migration (all schema changes in one migration)
2. `src/lib/billing.ts` utility functions
3. `src/hooks/useZoneServiceWeekConfig.ts`
4. Update hooks (useSubscription, usePlans, useEntitlements)
5. Stripe webhook update
6. Admin UI (zone service week config + plan entitlement field)
7. Customer UI updates (billing language, subscription page, routine header, success screen)
8. Documentation update

---

## What This Does NOT Do (Per Spec)
- No scheduling/dispatch/service execution
- No proration
- No rollover logic
- No consumption tracking (service_weeks_consumed stays 0 until future modules)
- Stripe Price interval configuration (28-day) is an admin setup step, not automated
