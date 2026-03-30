# Sprint D4 — Plan Self-Service Review

**Migration reviewed:** `20260227042219_d29ebdc8` (RPCs + schema)
**UI files:** `usePlanSelfService.ts`, `PlanChangePanel.tsx`, `CancellationFlow.tsx`, `PausePanel.tsx`, `Subscription.tsx`
**Reviewed by:** Claude (spec-compliance reviewer)
**Date:** 2026-02-27

---

## Verdict: PASS with 1 HIGH, 2 MEDIUM findings

All three spec tasks (2D-10, 2D-11, 2D-12) are implemented with correct RPC structure, auth checks, and UI flows. Two bugs need fixing before the retention and pause paths will work.

---

## Findings

### D4-F1 (HIGH) — Retention offer insert uses `'bonus'` txn_type, rejected by trigger

**Location:** Migration `20260227042219`, line 140: `txn_type, 'bonus'`

**Issue:** The `cancel_subscription_with_reason` RPC inserts a `handle_transactions` row with `txn_type = 'bonus'`. However, migration `20260227020503` (D0 fixes) added a validation trigger:

```sql
IF NEW.txn_type NOT IN ('grant', 'spend', 'expire', 'rollover', 'refund') THEN
  RAISE EXCEPTION 'Invalid txn_type: %...';
END IF;
```

`'bonus'` is not in the allowed list. When a customer accepts the retention offer, the RPC will **throw an exception and roll back** — the handles won't be added and the customer will see an error.

**Fix:** Either:
1. Use `txn_type = 'grant'` with `metadata` distinguishing it as a retention bonus, OR
2. Update the trigger to also allow `'bonus'`

Option 1 is simpler and consistent with the existing ledger pattern.

### D4-F2 (MEDIUM) — `useCustomerSubscription` excludes `'paused'` status

**Location:** `src/hooks/useSubscription.ts`, line 48: `.in("status", ["active", "trialing", "past_due", "canceling"])`

**Issue:** The `pause_subscription` RPC sets `status = 'paused'`. But `useCustomerSubscription` doesn't include `'paused'` in its status filter. After pausing, the subscription page will show "No Active Subscription" instead of the PausePanel with resume controls. The customer cannot resume.

**Fix:** Add `'paused'` to the status filter:
```ts
.in("status", ["active", "trialing", "past_due", "canceling", "paused"])
```

### D4-F3 (MEDIUM) — Subscription interface missing D4 columns

**Location:** `src/hooks/useSubscription.ts`, lines 5-35

**Issue:** The `Subscription` TypeScript interface does not include the new D4 columns: `paused_at`, `resume_at`, `pause_weeks`, `cancel_reason`, `cancel_feedback`, `retention_offer_accepted`. The `PausePanel` component works around this with `(subscription as any).paused_at`, which is fragile and loses type safety.

**Fix:** Add the missing fields to the interface:
```ts
paused_at: string | null;
resume_at: string | null;
pause_weeks: number | null;
cancel_reason: string | null;
cancel_feedback: string | null;
retention_offer_accepted: boolean;
```

---

## What Passed

### 2D-10: Plan Upgrade/Downgrade — PASS

- `schedule_plan_change` RPC: Auth check, validates subscription state (not paused/canceling/already-same-plan), detects direction via `recommended_rank`, schedules for `billing_cycle_end_at`, emits notification. All correct.
- `cancel_pending_plan_change` RPC: Auth check, clears `pending_plan_id`/`pending_effective_at`. Correct.
- `PlanChangePanel`: Shows pending banner with cancel option, or plan selector with directional badge. Clean UI. Correct.

### 2D-11: Cancellation Flow — PASS (except D4-F1)

- `cancel_subscription_with_reason` RPC: Auth check, 6-option reason survey, optional feedback text, retention offer branch (5 bonus handles), sets `cancel_at_period_end = true` and `status = 'canceling'`, emits notification. Structure is correct — only the txn_type value is wrong (D4-F1).
- `CancellationFlow`: 3-step dialog (reason → offer → confirm) with proper back/cancel flows. Clean implementation.

### 2D-12: Subscription Pause — PASS (except D4-F2)

- `pause_subscription` RPC: Validates 1-4 weeks, checks auth/state, sets `paused_at`/`resume_at`/`pause_weeks`/`status='paused'`. Correct.
- `resume_subscription` RPC: Auth check, clears pause fields, sets `status = 'active'`. Correct.
- `PausePanel`: Shows paused state with resume button, or pause selector. Correct — except the user can't reach this view due to D4-F2.
- Notification templates for all 5 events seeded correctly.

### General Quality

- All 5 RPCs have proper auth checks (`auth.uid()` + admin fallback).
- All RPCs validate subscription state before acting.
- Notification templates seeded for all events.
- UI components properly handle loading/disabled states.
- Hooks correctly invalidate `["subscription"]` query on success.

---

## Summary

| Finding | Severity | Description |
|---------|----------|-------------|
| D4-F1 | **HIGH** | `'bonus'` txn_type rejected by trigger — retention offer will crash |
| D4-F2 | **MEDIUM** | `'paused'` missing from subscription query — paused users can't see or resume |
| D4-F3 | **MEDIUM** | Subscription interface missing D4 columns — `(as any)` casts lose type safety |
