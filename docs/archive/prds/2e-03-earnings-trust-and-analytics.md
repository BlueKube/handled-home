# PRD — 2E-03 Earnings Trust & Analytics

**Purpose:** Providers stay when they trust pay. This PRD creates clear, auditable, and motivating earnings transparency.

---

## 1) Goals
- Daily/weekly/monthly earnings dashboards
- Per-job breakdown with SKU detail and modifiers
- Holds and release countdown
- “At current pace” projection based on scheduled jobs
- Reduce provider support tickets about pay

## 2) Non-goals
- Full tax filing automation (only summaries/exports)
- Complex commissions by customer cohort

---

## 3) Provider UI

### 3.1 Earnings Overview
- Today / Week / Month tabs
- Totals + trend
- Payout schedule + bank account status

### 3.2 Per-job Earnings Detail
For each job:
- Base pay
- Modifiers (quality bonus, rush, adjustment)
- Hold status + reason
- Net pay

### 3.3 Projection
- “At current pace, you’ll earn $X this month”
- Based on scheduled jobs and documented assumptions

---

## 4) Data & Logic (high level)
- `provider_earnings` as source ledger
- `provider_earnings_summary` as cached aggregates (day/week/month)
- Modifiers stored with reasons and references
- Hold reasons standardized and visible

---

## 5) Acceptance Criteria
- Provider can explain any payout line item from the app.
- Holds have explicit reasons and expected release time.
- Projections match scheduled work reasonably.
