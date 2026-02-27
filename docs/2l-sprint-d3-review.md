# Sprint D3 — Property Health Score Review

**Commit reviewed:** `bb56ecb` (D3 implementation + D2-F1 fix)
**Reviewed by:** Claude (spec-compliance reviewer)
**Date:** 2026-02-27

---

## Verdict: PASS with 3 findings (1 HIGH, 1 MEDIUM, 1 LOW)

The health score algorithm, widget, and dashboard integration are well-built. One HIGH finding needs to be addressed before production.

---

## Bonus: D2-F1 Fix Shipped

Migration `20260227035416` adds a `BEFORE INSERT OR UPDATE` trigger (`trg_enforce_visit_rating_suppression`) that computes suppression server-side. This fully resolves D2-F1 — even if a client sends `is_suppressed: false`, the trigger overrides it. Clean fix.

---

## What Was Built

1. **`property_health_scores` table** — stores overall + 4 sub-scores per property, with `previous_overall_score` for trend tracking
2. **`compute_property_health_score` RPC** — SECURITY DEFINER function computing weighted score from regularity (40%), coverage (25%), seasonal (15%), issue (20%)
3. **`PropertyHealthWidget`** — SVG ring with color-coded score, sub-score breakdown (Reg/Cov/Sea/Iss), trend arrow showing delta
4. **Dashboard integration** — widget placed between HandleBalanceBar and stats row
5. **2D-09 (anxiety nudge)** — claimed as complete in tasks.md

---

## Detailed Analysis

### Migration — Table Design (D3-OK)

- `UNIQUE(property_id)` — one score per property, upsert-friendly
- FK to `properties` and `auth.users` with `ON DELETE CASCADE`
- `previous_overall_score` nullable — null on first computation, populated on subsequent ones
- `computed_at` separate from `updated_at` — allows tracking freshness independently
- RLS: customer SELECT own + admin SELECT all — correct
- Index on `customer_id` — covers the customer query path

### RPC Algorithm (D3-OK with caveats)

**Regularity (40%):** Counts COMPLETED jobs in last 90 days, expects ~13 (weekly for 13 weeks). Capped at 100.
- Reasonable baseline. The `scheduled_date >= (current_date - interval '90 days')::text` comparison casts date to text which works because ISO format sorts lexicographically. Not elegant but functionally correct.

**Coverage (25%):** Counts distinct SKUs in active/draft routines, caps at 4 for 100%.
- Good design — doesn't penalize customers for not subscribing to every SKU, just rewards breadth up to a threshold.

**Seasonal (15%):** Confirmed seasonal selections this year vs total active seasonal templates.
- `GREATEST(1, v_seasonal_total)` prevents division by zero. Good.

**Issue (20%):** Step function — 0 issues = 100, 1 = 75, 2 = 50, 3 = 25, 4+ = 0.
- Clear and predictable. 90-day window matches regularity.

**Upsert:** Reads previous score before upserting, stores as `previous_overall_score`. Clean pattern.

### PropertyHealthWidget (D3-OK)

- SVG ring rendering is correct: `strokeDasharray` + `strokeDashoffset` for circular progress
- Auto-compute via useEffect: fires when no score exists or score is >24h stale — good freshness strategy
- `compute.isPending` guard prevents duplicate computations
- Color coding consistent: ≥80 success, ≥60 accent, ≥40 warning, <40 destructive
- Sub-scores displayed with abbreviated labels (Reg/Cov/Sea/Iss) — compact and informative
- Trend arrow: up (success), down (destructive), flat (muted) with signed delta — clear

### Dashboard Integration (D3-OK)

Widget placed at `Dashboard.tsx:159` between HandleBalanceBar and stats row. Good visual hierarchy.

---

## Findings

### D3-F1 (HIGH) — `compute_property_health_score` RPC has no authorization check

**Location:** Migration `20260227035654`, line 36-129

**Issue:** The RPC is `SECURITY DEFINER` (bypasses RLS) but has **no check** that the caller owns the property or is an admin. Any authenticated user can call:

```sql
SELECT compute_property_health_score('any-property-id', 'any-customer-id');
```

This allows:
1. **Data exfiltration:** The function reads from `jobs`, `routine_items`, `customer_issues`, `customer_seasonal_selections` across all customers. While the return value is just score numbers (not raw data), the scores themselves leak information about a customer's service regularity and issue history.
2. **Score tampering:** An attacker could pass a wrong `p_customer_id` for a `p_property_id` — the upsert would overwrite the legitimate score with garbage data (0 regularity, 0 coverage, etc.) because the wrong customer has no jobs/routines for that property.

**Fix:** Add an ownership check at the top of the function:

```sql
IF p_customer_id != auth.uid() AND NOT has_role(auth.uid(), 'admin') THEN
  RAISE EXCEPTION 'Access denied';
END IF;
```

### D3-F2 (MEDIUM) — `CUSTOMER_HEALTH_SCORE_DROP` notification template not actually seeded

**Location:** tasks.md line 247 claims it's done; no migration seeds it

**Issue:** Task 2D-09 is marked complete with the claim "CUSTOMER_HEALTH_SCORE_DROP notification template seeded. Nudge triggers via notification event bus when score drops." However:
- No migration contains an INSERT into `notification_templates` with this template key
- No trigger or function emits a notification when the score drops
- The RPC upsert doesn't check `v_prev_score` vs `v_overall` for drop detection

**Impact:** The anxiety nudge feature is entirely missing despite being marked complete.

**Fix:** Add a migration that:
1. Seeds the notification template
2. Adds drop detection in the RPC (e.g., if `v_overall < v_prev_score - 5`, emit notification)

### D3-F3 (LOW) — Unnecessary `as any` cast on `property_health_scores` query

**Location:** `usePropertyHealth.ts:26`

**Issue:** The hook casts `.from("property_health_scores" as any)`, but the generated Supabase types at `types.ts:2486` already include `property_health_scores` with full row types. Same pattern as D2-F2.

**Fix:** Remove the `as any`:
```ts
const { data, error } = await supabase
  .from("property_health_scores")
  .select("*")
  .eq("property_id", propertyId!)
  .maybeSingle();
```

---

## Summary

| ID | Severity | Description | Blocks D4? |
|----|----------|-------------|------------|
| D3-F1 | **HIGH** | RPC has no auth check — any user can compute/overwrite scores for any property | Yes |
| D3-F2 | MEDIUM | Notification template for score-drop nudge not seeded despite tasks.md claiming complete | No |
| D3-F3 | LOW | Unnecessary `as any` on table query | No |

**D3-F1 must be fixed before proceeding to D4.** It's a one-line addition to the RPC body.
