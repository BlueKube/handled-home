# PRD — 2E-01 Founding Partner Program (BYOC)

**Purpose:** Make it a no-brainer for providers to bring their existing customers onto Handled Home by offering a simple, profitable incentive and a frictionless invite flow—while preserving platform rights to reassign for quality and availability.

**Positioning:** “Founding Partner Program” (prestige + partnership).

---

## 1) Goals

1. Providers invite existing customers to join Handled Home and pay through the app.
2. Providers receive a **flat CAC bonus** that is easy to understand and automatic.
3. Customers get a premium experience: card payments, receipts/photos, predictable scheduling.
4. The platform retains the right to reassign customers when needed (quality, availability, safety).
5. Fraud and abuse are prevented with clear eligibility rules.

---

## 2) Non-goals

- Permanent ownership of customers by providers
- Permanent increased payout share
- Public “review profiles” or customer-visible provider competition
- Complex multi-level marketing mechanics

---

## 3) Core Offer (finalized)

### 3.1 Provider incentive (flat CAC bonus)
- **$10 per completed service week**
- Duration: **90 days** (≈ 13 weeks)
- Applies per BYOC customer during the bonus window
- Same bonus across all categories (treat as CAC)

### 3.2 Eligibility definition: “Completed service week”
A BYOC bonus week counts if:
- Customer has **active paid membership** for that week, AND
- At least **one routine visit** is completed that week (any category)

Does NOT count if:
- subscription is paused/canceled or payment failed/dunning pause
- open fraud flag or chargeback
- no completed visit that week

### 3.3 Start trigger
Start the 90-day window at:
- **FIRST_COMPLETED_VISIT** (recommended for fraud resistance)

### 3.4 Platform rights (explicit)
- BYOC bonus does **not** grant ownership.
- Customer can request provider change.
- Platform may reassign for disqualifying events: quality band Orange/Red, repeated misses, safety issues, fraud, prolonged unavailability.
- Vacation coverage: backups cover; primary may resume if quality remains Green and availability returns.

---

## 4) Provider Flow

### 4.1 “Invite Customers” (provider app)
Provider sees a simple panel:
- “Bring your customers to Handled Home”
- CTA: **Invite via link / QR / text**
- Script suggestions (copy):
  - “Pay by card, get receipts/photos, and your service becomes more reliable because my routes are optimized.”

Provider can:
- generate invite link/QR (with provider attribution)
- see invite status funnel:
  - Invited → Installed → Signed up → Subscribed → First visit completed → Bonus weeks remaining

### 4.2 “Customers I Brought” dashboard
- count of active BYOC customers
- earned this week / month from BYOC bonuses
- each customer card:
  - bonus window remaining (Week 7 of 13)
  - status flags (paused, payment issue, churned)

---

## 5) Customer Flow

### 5.1 Invite landing
When customer opens invite link:
- “You’re joining through {Provider Org}”
- explain benefits:
  - card payments
  - receipts/photos
  - predictable schedule
- clear trust statement:
  - “You can request a different provider at any time.”

### 5.2 Onboarding
Customer completes normal onboarding:
- zone availability
- choose plan
- service day acceptance
- routine build

---

## 6) Data Model (proposed)

### 6.1 `byoc_attributions`
- id
- provider_org_id
- customer_id
- invite_code / referral_code
- invited_at
- installed_at (optional)
- subscribed_at (optional)
- first_completed_visit_at (start trigger)
- bonus_start_at
- bonus_end_at (bonus_start + 90 days)
- status: ACTIVE / ENDED / REVOKED
- revoked_reason (text)

**Constraints:**
- unique(customer_id) for active attribution (define precedence rules if multiple invites)

### 6.2 `provider_incentive_config`
- scope: GLOBAL / REGION / ZONE
- byoc_weekly_amount (default 10)
- byoc_duration_days (default 90)
- updated_at, updated_by, reason (audit)

---

## 7) Payout Logic

### 7.1 Weekly computation
A scheduled job calculates eligible BYOC bonuses each week:
- for each active attribution:
  - verify bonus window active
  - verify “completed service week” condition
  - if eligible → create provider earning event (BYOC_BONUS)

### 7.2 Transparency
Provider sees:
- “BYOC bonus earned: $10 (Week of Mar 3) — Customer active and visit completed.”

Admin sees:
- full ledger of BYOC bonuses
- anomalies and fraud flags

---

## 8) Anti-fraud & abuse controls

- Start trigger at first completed visit
- Detect duplicates:
  - same address/device patterns
  - unusually high invite volume
- Optional cap:
  - max BYOC bonuses per provider per month (configurable)
- Require membership + completed visit to count a bonus week

---

## 9) Acceptance Criteria

1. Provider can generate invite link/QR and track invites end-to-end.
2. Customer can join via link and complete onboarding.
3. Bonus weeks are computed correctly and automatically.
4. Provider dashboard clearly shows earned bonuses and remaining window.
5. Admin can revoke attribution with reason (fraud, abuse, policy).

---

## 10) Defaults
- Bonus continues during temporary vacation coverage **if** provider remains Primary and returns within policy.
- Bonus stops if customer switches provider (provider no longer Primary).
