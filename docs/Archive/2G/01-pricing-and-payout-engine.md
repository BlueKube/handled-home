# Handled Home — Admin Controls: Zone Pricing + Provider Payout Engine (Spec)
This document defines the **profit control plane** and provider payout models discussed. It is designed for a subscription/credits customer model while keeping provider compensation simple and non-negotiated.

---

## 1. Intent and outcomes
### Intent
Give superusers the ability to keep the business profitable by zone while maintaining provider trust and predictable payouts, without per-job negotiation.

### Desired outcomes
- Zone-by-zone profitability control
- Providers see **only their payout**, not customer price (subscription credits obscure per-job price)
- Payouts are predictable and explainable
- Supports both flat and time-guarded models to reduce “provider got burned” edge cases
- All changes are audited, reversible, and bounded

---

## 2. Core decisions (from discussion)
1) **Zone-adjusted pricing** is required for profitability in high-cost areas.
2) Providers **do not see customer price**.
3) Providers are not negotiated with per job. They accept the offered payout or decline by not taking/covering that zone/service.
4) Support multiple payout models as **provider contract types**, assigned at provider-org level (default per zone/category).

---

## 3. Pricing model (customer-facing, admin-controlled)
### 3.1 Price inputs
- **Global Base Price** per SKU (default)
- **Zone Price Overlay** (optional) per SKU:
  - multiplier (preferred default)
  - absolute override (edge cases)

### 3.2 Recommendation
- Default: multiplier for most SKUs to reduce maintenance and allow bulk edits.
- Allow per-SKU absolute overrides for special cases.

### 3.3 Admin UI: Control Room → Pricing & Margin → Zone Pricing
**Superuser-only write access. Others read-only.**

Table columns:
- SKU
- Base Price
- Zone Multiplier
- Zone Effective Price
- Effective date
- Last changed by
- Notes / reason

Tools:
- Bulk set multiplier for a category
- Copy pricing from another zone
- Schedule changes (effective date)
- Rollback to last version

Guardrails:
- max change per week per zone/category (configurable)
- emergency override toggle (auto-expire 72h)
- reason required

---

## 4. Provider payout policy (provider-facing)
### 4.1 What providers see (and do NOT see)
Providers see:
- Guaranteed payout for this job
- Simple breakdown: base + modifiers + bonuses (if any)
- Expected time / difficulty
- Links to payout policy and disputes

Providers do NOT see:
- customer price
- take rate
- credit-to-dollar conversions

### 4.2 No negotiation
Provider compensation is “take it or leave it”:
- Providers choose to operate in zones/services where payout meets their expectations.
- Acceptance/coverage is the signal to adjust payout by zone, not negotiation.

---

## 5. Provider contract types (payout models)
Assign at **provider-org** level (optionally per category later). v1: provider-org-wide.

### 5.1 Contract types
- `partner_flat`
  - fixed payout per SKU + modifiers
- `partner_time_guarded`
  - fixed payout per SKU + modifiers
  - plus overtime kicker after expected duration threshold
  - capped overtime to prevent runaway costs
- `contractor_time_based` *(selective)*
  - base + $/minute with caps, for high-variance services

> Note: “employee-style” is not implemented as employment classification in v1; model it as time-based contractor logic if needed later.

### 5.2 Why time-guarded is preferred
Time-guarded handles edge cases (unexpectedly long jobs) without encouraging slow work across the board.

---

## 6. Modifiers, bonuses, holds (provider pay breakdown)
### 6.1 Modifiers (examples)
- Distance/drive add-on
- Complexity add-on (stairs, heavy lift)
- Same-day premium
- Special equipment

### 6.2 Bonuses (examples)
- BYOC / Founding Partner bonus
- Launch bonuses (new zone activation)
- Reliability/quality bonus tiers

### 6.3 Holds (trust)
- Holds may apply for fraud/anomaly, disputes, missing proof
- Providers see clear reason and estimated release rule

---

## 7. Time tracking and anti-gaming rules (for time-guarded/time-based)
### 7.1 Time definition
Time is measured from:
- provider “arrived” (geofenced) → job “completed” (proof step)
Optional:
- pause states allowed only with reason (blocked access, customer unavailable)

### 7.2 Guardrails
- Overtime begins after **expected duration** + grace window
- Overtime cap (per job) unless superuser escalation
- Anomaly detection:
  - repeated overtime outliers for a provider
  - time vs proof patterns
  - compare against zone/category averages

---

## 8. Admin UI: Control Room → Payout Engine
**Superuser-only write access. Others read-only.**

### 8.1 Pages
- Payout tables (by zone/category/SKU)
- Default contract type per zone/category
- Provider org override (set contract type)
- Overtime parameters (thresholds/rates/caps)
- Time-based rates (if enabled)
- Hold rules and thresholds
- Change log + rollback

### 8.2 “Market signal” panel (read-only analytics)
Show by zone/category:
- provider acceptance rate / coverage sufficiency
- churn signals (inactive providers)
- redo rate (quality cost)
- average duration vs expected
These are triggers for superuser adjustments.

---

## 9. Data model (recommended)
### 9.1 Pricing
- `sku_pricing_base`
  - sku_id, base_price_cents, currency, active_from
- `sku_pricing_zone_overrides`
  - zone_id, sku_id
  - price_multiplier (nullable)
  - override_price_cents (nullable)
  - active_from, active_to (nullable)
  - version
  - changed_by, reason

View:
- `v_effective_sku_price(zone_id, sku_id)` resolves override → base

### 9.2 Payout
- `provider_payout_base`
  - sku_id (or category), base_payout_cents, active_from
- `provider_payout_zone_overrides`
  - zone_id, sku_id/category
  - payout_multiplier or override payout
  - version, changed_by, reason, active_from/active_to

- `provider_org_contracts`
  - provider_org_id
  - contract_type
  - (optional) category overrides
  - active_from/active_to

- `payout_overtime_rules`
  - zone_id, category/sku_id
  - expected_minutes
  - overtime_rate_cents_per_min
  - overtime_start_after_minutes
  - overtime_cap_cents
  - version, changed_by, reason

### 9.3 Audit
All writes to pricing/payout tables produce an audit record (see admin governance doc).

---

## 10. Acceptance criteria
- Superuser can set zone multipliers and schedule effective dates.
- Superuser can set payout overlays and contract type defaults per zone/category.
- Providers only see payout and breakdown; no customer price is exposed.
- Time-guarded overtime applies automatically after threshold and is capped.
- Every pricing/payout change is audited and reversible.
