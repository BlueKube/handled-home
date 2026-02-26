# 05-subscription-engine.md
> **Implementation Status:** ✅ Implemented in Round 1. Round 2B added service_weeks_used tracking, dunning automation.

**Handled Home — Module 05 PRD (Subscription Engine + Soft Onboarding)**  
**Mobile:** iOS + Android (Capacitor) — Customer + Provider  
**Admin Console:** Mobile-optimized but operationally usable  
**Last updated:** 2026-02-22  

---

## 0) Why this module exists

Handled Home is **not on-demand**. The business depends on:
- predictable routines  
- standardized services (Module 04 SKUs)  
- zone-based density + operational control (Module 03)  
- recurring revenue with low support overhead  

**Module 05 converts "curious users" into "committed subscribers"** by building confidence.

Core promise: **"Your home is handled."**

---

## 1) Dual-Clock Model

### 1.1 Billing Cadence (28-Day Cycles)
- Subscriptions bill every **28 days** for a "monthly feel" without calendar-month complexity.
- All billing language uses **"Billed every 4 weeks"** — never "monthly."
- `billing_cycle_start_at`, `billing_cycle_end_at`, `next_billing_at` track the cycle.
- `billing_cycle_length_days` defaults to 28.

### 1.2 Operational Rhythm (Weekly Service Weeks)
- Service weeks are **zone-anchored**, defined by `zone_service_week_config.anchor_day` (0=Sun, 1=Mon, ..., 6=Sat).
- Each service week is exactly **7 days**.
- `current_service_week_start_at/end_at` and `next_service_week_start_at/end_at` are stored on the subscription.
- Computed from the zone's anchor day at subscription activation.

### 1.3 No Rollover Policy
- Plan entitlements define `included_service_weeks_per_billing_cycle` (typically 1, 2, or 4).
- **Unused service weeks expire at `billing_cycle_end_at`.** No carry-over between cycles.
- `service_weeks_consumed_in_current_cycle` starts at 0 (future modules increment).
- `service_weeks_remaining_in_current_cycle = max(0, included - consumed)`.

---

## 2) Scope

### 2.1 Must implement
A) **Plan + Entitlements (internal source of truth)**  
- Plan lifecycle (draft/active/hidden/retired)  
- Zone availability toggles  
- Entitlements rules + service weeks per billing cycle  
- Stripe mapping fields (price/product ids), but entitlements are **not** Stripe-derived  

B) **Customer soft-onboarding mode**
- Browse plans, preview SKUs in plan context  
- Build + save **Draft Routine**  
- Clearly label included/extra/blocked  
- **Hard rule:** No operational obligation until subscription is active  

C) **Subscription checkout + state machine**
- Subscribe via Stripe  
- 28-day billing cycle initialized on checkout completion  
- Service week fields computed from zone anchor  

D) **Admin console**
- Plan builder with service weeks per billing cycle field  
- Zone service week config (anchor day, active toggle)  
- Subscription list + view detail  

E) **Entitlement resolution layer**
Returns: plan info, zone coverage, SKU entitlements, service week counts, and messaging.

### 2.2 Non-goals (do NOT implement)
- No scheduling, dispatch, route optimization, job execution  
- No provider payout logic  
- No complex proration (default: next billing cycle)  
- No rollover of unused service weeks  
- No service week consumption tracking (future modules)

---

## 3) Data Model

### Tables

#### `zone_service_week_config` (NEW)
- `id` uuid pk
- `zone_id` uuid FK -> zones (unique)
- `anchor_day` int (0-6, default 1 = Monday)
- `anchor_time_local` time (default '00:00')
- `cutoff_day_offset` int (default -1, reserved)
- `cutoff_time_local` time (default '18:00', reserved)
- `is_active` boolean (default true)
- `created_at`, `updated_at`

#### `subscriptions` (updated)
New columns:
- `access_activated_at` timestamptz
- `billing_cycle_start_at` timestamptz
- `billing_cycle_end_at` timestamptz
- `next_billing_at` timestamptz
- `billing_cycle_length_days` int (default 28)
- `current_service_week_start_at` timestamptz
- `current_service_week_end_at` timestamptz
- `next_service_week_start_at` timestamptz
- `next_service_week_end_at` timestamptz

#### `plan_entitlement_versions` (updated)
New column:
- `included_service_weeks_per_billing_cycle` int (default 4)

#### `customer_plan_selections` (updated)
New columns:
- `effective_billing_cycle_start_at` timestamptz
- `effective_service_week_start_at` timestamptz
- `is_locked_for_service_week` boolean (default false)
- `locked_at` timestamptz

---

## 4) Billing Language Requirements

- All plan cards: show "Billed every 4 weeks" below price
- Subscribe confirmation: "Billed every 4 weeks. Cancel anytime."
- Post-purchase success: "Access is active now. Next billing date: every 4 weeks from today."
- Subscription management: show billing cycle range, next billing date, current/next service week
- Plan change: "Changes take effect at the start of your next billing cycle (every 4 weeks)."
- Tooltip/explainer: "4-week billing keeps your routine predictable and avoids proration."

---

## 5) Plan Change Policy

- Default: changes effective **next billing cycle**
- `pending_plan_id` and `pending_effective_at` = `billing_cycle_end_at`
- UI shows: "Effective [date]" badge on pending changes

---

## 6) Stripe Integration Notes

- Stripe Price should use `interval: "day"`, `interval_count: 28` for true 28-day alignment.
- Stripe is **payment rail only**; entitlements live in Supabase.
- Webhook on `checkout.session.completed`:
  - Sets `access_activated_at`, billing cycle fields, service week fields
  - Computes service week from zone anchor day
- Webhook on `customer.subscription.updated/deleted`: updates status fields
- Webhook on `invoice.payment_failed/succeeded`: updates status

---

## 7) Acceptance Criteria

1. Subscribe mid-week → access active now, billing_end = start + 28 days, service week from zone anchor
2. Plans show "Billed every 4 weeks"
3. Entitlements show X service weeks per billing cycle with remaining count
4. At billing cycle end → remaining resets (no rollover)
5. Plan change mid-cycle → pending, effective next billing cycle
6. Soft onboarding still works (browse + draft routine without pay)
7. Admin can configure zone service week anchor day
8. Admin can set service weeks per billing cycle on entitlement versions
