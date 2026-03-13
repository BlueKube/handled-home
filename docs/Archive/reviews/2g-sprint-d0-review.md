# Sprint D0 Review — Handles v0 Schema, RPCs & UI

**Reviewer:** Claude
**Date:** 2026-02-27
**Commits:** `4afe732` ("Implement handles v0 UI and backend hooks") on `origin/main`
**Migrations reviewed:**
- `20260227013203` — plan_handles table, handle_transactions ledger, 6 RPCs, subscriptions.handles_balance cache, service_skus.handle_cost
- `20260227013219` — Split plan_handles admin ALL policy into INSERT/UPDATE/DELETE

**Frontend reviewed:**
- `src/hooks/useHandles.ts` (new)
- `src/components/customer/HandleBalanceBar.tsx` (new)
- `src/pages/customer/Dashboard.tsx` (balance bar wired)
- `src/pages/customer/Plans.tsx` (DB-driven handles, recommended_rank)
- `src/pages/customer/PlanDetail.tsx` (DB-driven rollover cap)
- `src/pages/admin/Plans.tsx` (PlanHandlesEditor added)

---

## Summary

Sprint D0 implements the core handles currency system — a ledger-based design with cached balances, 6 RPCs covering the full lifecycle (grant, spend, expire, rollover, refund, recalc), and customer/admin UI for visibility and configuration.

The schema design is sound — append-only ledger with reconcilable cache, proper RLS, subscription-level locking for spend. However, there is **1 critical logic bug** in the expiry RPC that will cause expired handles to never actually be deducted.

---

## Critical Findings

### D0-F1 | CRITICAL | `expire_stale_handles` doesn't actually expire anything

**RPC:** `expire_stale_handles()` (migration `20260227013203`)

**Problem:** The function finds subscriptions with expired grant/refund transactions, then calls `recalc_handles_balance()`. But `recalc_handles_balance` simply sums ALL `amount` values from the ledger:

```sql
SELECT COALESCE(SUM(amount), 0) INTO v_balance
FROM handle_transactions
WHERE subscription_id = p_subscription_id;
```

This sum includes the expired grants (positive amounts). Since no 'expire' transaction (negative amount) is ever inserted to cancel them, the balance remains unchanged. Handles never actually expire.

The `NOT EXISTS` subquery checks for an 'expire' transaction with `reference_id = handle_transactions.id` and `reference_type = 'stale_expiry'`, but no code ever creates such a transaction.

**Fix:** Insert an 'expire' transaction for each expired grant to deduct the remaining value:

```sql
FOR v_rec IN
  SELECT id, subscription_id, customer_id, amount
  FROM handle_transactions
  WHERE txn_type IN ('grant', 'refund')
    AND expires_at IS NOT NULL
    AND expires_at < now()
    AND NOT EXISTS (
      SELECT 1 FROM handle_transactions t2
      WHERE t2.reference_id = handle_transactions.id
        AND t2.txn_type = 'expire'
        AND t2.reference_type = 'stale_expiry'
    )
LOOP
  -- Insert expire txn to cancel the remaining value of this grant
  INSERT INTO handle_transactions (
    subscription_id, customer_id, txn_type, amount, balance_after,
    reference_type, reference_id, metadata
  ) VALUES (
    v_rec.subscription_id, v_rec.customer_id, 'expire',
    -v_rec.amount, 0, -- balance_after recalculated below
    'stale_expiry', v_rec.id,
    jsonb_build_object('reason', 'expired_grant')
  );
  v_total_expired := v_total_expired + v_rec.amount;
END LOOP;

-- Then recalc each affected subscription
FOR v_sub IN SELECT DISTINCT subscription_id FROM ... LOOP
  PERFORM recalc_handles_balance(v_sub.subscription_id);
END LOOP;
```

**Impact:** Without this fix, handles never expire. Customers accumulate handles indefinitely, bypassing the rollover cap enforcement at grant time (since `grant_cycle_handles` only caps at grant time, not retroactively).

---

## High Findings

### D0-F2 | HIGH | `spend_handles` has no authorization check — any authenticated user can spend another user's handles

**RPC:** `spend_handles(p_subscription_id, p_customer_id, p_amount, p_reference_id)`

**Problem:** The function is `SECURITY DEFINER` but does not verify that the calling user owns the subscription:

```sql
SELECT handles_balance INTO v_current_balance
FROM subscriptions
WHERE id = p_subscription_id
FOR UPDATE;
```

Any authenticated user who knows another user's `subscription_id` can call `spend_handles` and deduct their handles. The `p_customer_id` parameter is used only for the ledger entry — it's not validated against the subscription's actual customer.

**Fix:** Add an ownership check:
```sql
IF NOT EXISTS (
  SELECT 1 FROM subscriptions
  WHERE id = p_subscription_id AND customer_id = auth.uid()
) AND NOT EXISTS (
  SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'
) THEN
  RETURN jsonb_build_object('success', false, 'error', 'unauthorized');
END IF;
```

This same issue applies to `grant_cycle_handles` and `refund_handles`, but those are intended to be called by admin/cron processes, so the risk is lower. `spend_handles` is the one most likely to be called from the frontend.

---

### D0-F3 | HIGH | `grant_cycle_handles` idempotency check scans all subscription transactions (no index)

**RPC:** `grant_cycle_handles`

**Problem:** The idempotency check queries:
```sql
SELECT 1 FROM handle_transactions
WHERE subscription_id = p_subscription_id AND metadata->>'idempotency_key' = p_idempotency_key
```

There's no GIN index on `metadata` or on `metadata->>'idempotency_key'`. This is a sequential scan of all transactions for the subscription. For year-old subscriptions with hundreds of transactions, this becomes slow.

**Fix:** Add a functional index:
```sql
CREATE INDEX idx_handle_txn_idempotency
  ON handle_transactions ((metadata->>'idempotency_key'))
  WHERE metadata->>'idempotency_key' IS NOT NULL;
```

Or better, add an `idempotency_key` column to `handle_transactions` with a unique partial index.

---

## Medium Findings

### D0-F4 | MEDIUM | `handle_transactions.txn_type` has no CHECK constraint

**Table:** `handle_transactions`

The `txn_type` column is `TEXT NOT NULL` with no CHECK constraint. The strategy doc defines 5 valid types: `grant`, `spend`, `expire`, `rollover`, `refund`. Without a constraint, typos or incorrect values can be inserted by the RPCs.

**Fix:**
```sql
ALTER TABLE handle_transactions ADD CONSTRAINT handle_txn_type_check
  CHECK (txn_type IN ('grant', 'spend', 'expire', 'rollover', 'refund'));
```

---

### D0-F5 | MEDIUM | `grant_cycle_handles` expires excess handles but `balance_after` on the expire txn may be inaccurate

In `grant_cycle_handles`, the expire transaction for rollover cap enforcement uses:
```sql
INSERT INTO handle_transactions (..., balance_after, ...)
VALUES (..., v_capped_balance, ...);
```

`v_capped_balance = LEAST(v_current_balance, v_rollover_cap)`. This is correct at the time of insertion. However, if another concurrent transaction modifies the balance between the `FOR UPDATE` lock and the insert, the `balance_after` could be stale. The `FOR UPDATE` lock on subscriptions mitigates this, so the risk is low but worth noting.

---

### D0-F6 | MEDIUM | `HandleBalanceBar` shows 0/0 when no plan_handles config exists

**File:** `src/pages/customer/Dashboard.tsx:150`

```typescript
{handleBalance != null && planHandles && (
  <HandleBalanceBar balance={handleBalance} perCycle={planHandles.handles_per_cycle} />
)}
```

If `planHandles` is null (no config row), the bar is hidden. This is correct behavior. But if `handles_per_cycle` is 0 (admin set it to 0), the bar shows "0 of 0 remaining" with a 0% progress. Consider hiding when `perCycle === 0`.

---

### D0-F7 | MEDIUM | Admin `PlanHandlesEditor` uses `as any` casts for insert/update

**File:** `src/pages/admin/Plans.tsx` (PlanHandlesEditor)

The mutation uses `as any` casts:
```typescript
await supabase.from("plan_handles").insert({ ... } as any);
```

This bypasses TypeScript type checking. The Supabase types should include `plan_handles` since the migration added the table. Verify the types are generated correctly.

---

## Low Findings

### D0-F8 | LOW | `refund_handles` expiry lookup is fragile

The refund function tries to find the original grant's expiry by joining the spend transaction to the most recent prior grant:
```sql
JOIN handle_transactions t_grant ON ...
  AND t_grant.created_at <= t_spend.created_at
WHERE t_spend.reference_id = p_reference_id AND t_spend.txn_type = 'spend'
ORDER BY t_grant.created_at DESC LIMIT 1;
```

This assumes the most recent grant before the spend is the one that funded it. In practice, handles are fungible (the customer doesn't spend "from" a specific grant), so this is a best-effort heuristic. The fallback to 60 days is reasonable.

### D0-F9 | LOW | No `ON DELETE CASCADE` on `handle_transactions.customer_id`

`handle_transactions.customer_id` has no foreign key reference. If a user account is deleted, orphaned transactions remain. Since `subscription_id` has `ON DELETE CASCADE`, the transactions will be deleted when the subscription is deleted — but only if subscriptions cascade from user deletion too. Worth verifying the cascade chain.

---

## Structural Assessment

### What's Working Well
1. **Ledger + cache pattern** is the right architecture — `handle_transactions` is the source of truth, `handles_balance` on subscriptions is a fast cache reconcilable via `recalc_handles_balance`
2. **`spend_handles` locks the subscription row** — prevents double-spend race conditions
3. **`grant_cycle_handles` has idempotency** — prevents double-granting on cron retries
4. **`refund_handles` preserves original expiry** — aligns with strategy doc requirements
5. **RLS is well-structured** — customers see own transactions, admins see all, plan_handles is public-read
6. **Frontend gracefully degrades** — Plans page falls back to static highlights when no DB config, Dashboard hides balance bar when no config
7. **`isRecommended` now uses `recommended_rank`** — addresses D-Pre-N1

### What Needs Fixing Before D1
1. **D0-F1** (CRITICAL) — `expire_stale_handles` must insert 'expire' transactions, not just recalc
2. **D0-F2** (HIGH) — `spend_handles` needs auth check (caller must own subscription or be admin)

---

## Finding Tracker

| ID | Severity | Status | Description |
|----|----------|--------|-------------|
| D0-F1 | CRITICAL | Open | `expire_stale_handles` doesn't insert expire transactions — handles never expire |
| D0-F2 | HIGH | Open | `spend_handles` has no authorization — any user can spend another's handles |
| D0-F3 | HIGH | Open | Idempotency check has no index on metadata JSONB key |
| D0-F4 | MEDIUM | Open | No CHECK constraint on txn_type |
| D0-F5 | MEDIUM | Acceptable | balance_after accuracy under concurrency (mitigated by FOR UPDATE) |
| D0-F6 | MEDIUM | Open (minor) | Balance bar shows 0/0 when perCycle is 0 |
| D0-F7 | MEDIUM | Open (minor) | PlanHandlesEditor uses `as any` type casts |
| D0-F8 | LOW | Acceptable | Refund expiry lookup is best-effort heuristic |
| D0-F9 | LOW | Open (minor) | No FK on customer_id |

**Recommended next step:** Fix D0-F1 (expire logic) and D0-F2 (auth check on spend), then proceed to Sprint D1.
