# Batch Spec: R51-B1 — Simulator Engine Fix + PolicySimulator Error State

## Review: Quality (Small tier — 2 agents)

## Files
- `src/lib/simulation/simulate.ts`
- `src/pages/admin/PolicySimulator.tsx`

## Changes

### 1. Fix misleading `retention_60d_pct` metric (simulate.ts)
**Problem:** Lines 204-205 compute `month2Customers / month1Customers * 100`. This includes new customers acquired in month 2 (BYOC trickle, referral, organic), so the value can exceed 100% even with high churn. The metric name implies cohort retention but measures aggregate customer growth ratio.

**Fix:** Compute actual cohort retention: take month 1's active customer count, subtract month 2's churn (customers who churned from the month 1 cohort), and divide by month 1's count. The simulation already tracks churn per month, so use: `retention = (1 - month_1_churn_rate) * (1 - month_2_churn_rate) * 100`. This gives true 60-day survival probability.

**Impact:** Changes the composite score since `retention_60d_pct` has weight 25 in the score formula. Values will now correctly reflect retention, not growth.

### 2. Add `isError` handling to PolicySimulator (PolicySimulator.tsx)
**Problem:** `useSupportPolicies()` returns `isError` but the component only checks `isLoading`. On network failure, users see no feedback.

**Fix:** Destructure `isError` from the hook, add an error state render before the main content with an appropriate message and retry guidance.

## Acceptance Criteria
- [ ] `retention_60d_pct` computes from churn rates, not active customer ratio
- [ ] PolicySimulator shows error message when policy query fails
- [ ] `npm run build` passes
- [ ] `npx tsc --noEmit` passes
