# Sprint D2 — Ratings & Reviews Review

**Commit reviewed:** `b421402` ("Ratings & Reviews")
**Reviewed by:** Claude (spec-compliance reviewer)
**Date:** 2026-02-27

---

## Verdict: PASS with 2 findings (0 HIGH, 1 MEDIUM, 1 LOW)

The implementation is solid. The DB schema, RLS, suppression logic, and UI are all well-structured. Two findings below — neither blocks D3.

---

## What Was Built

1. **`visit_ratings` table** — stores 1-5 star ratings + optional comment per job+customer, with suppression fields (`is_suppressed`, `suppression_reason`)
2. **`provider_rating_summary` view** — aggregates non-suppressed ratings per provider (avg, count, positive/negative), uses `security_invoker = true`
3. **`VisitRatingCard` component** — star rating UI with hover labels (Poor→Excellent), optional comment, locked after submission
4. **`useVisitRating` hook** — loads existing rating, computes smart suppression (first visit or issue reported), upserts via Supabase
5. **`useProviderRatingSummary` hook** — admin-side query for the provider rating summary view
6. **VisitDetail integration** — rating card appears below work summary for COMPLETED jobs
7. **Admin ProviderDetail** — new "Ratings" tab showing avg rating, star display, total/positive/negative breakdown

---

## Detailed Analysis

### Migration (D2-OK)

**Table design:**
- `visit_ratings` has proper FK references (`jobs`, `auth.users`, `provider_orgs`) with `ON DELETE CASCADE`
- `CHECK (rating >= 1 AND rating <= 5)` enforces valid range
- `UNIQUE(job_id, customer_id)` prevents duplicate ratings per customer per job
- `updated_at` trigger via `set_updated_at()` — consistent with project convention
- Indexes on `provider_org_id` and `customer_id` cover the two main query paths

**RLS:**
- Customer SELECT/INSERT/UPDATE using `customer_id = auth.uid()` — correct
- Admin SELECT using `has_role(auth.uid(), 'admin')` — correct
- No DELETE policy — prevents accidental deletion. Appropriate.

**View:**
- Second migration correctly recreates with `security_invoker = true` — RLS is respected through the view
- Filters `WHERE NOT is_suppressed` — suppressed ratings excluded from aggregates as intended

### Smart Suppression (D2-OK)

`useVisitRating.ts:30-41` — `computeSuppression()` logic:
- First visit (`completedCount <= 1`): suppressed with reason `"first_visit"` — correct
- Issue reported on job (`issueCount > 0`): suppressed with reason `"issue_reported"` — correct
- Otherwise: not suppressed — correct

The suppression query (`useVisitRating.ts:64-90`) correctly checks:
- `jobs` table for total COMPLETED jobs by customer (for first-visit detection)
- `customer_issues` table for issues on this specific job

**Edge case handled well:** `suppressionQuery` is only enabled when `!ratingQuery.data` (no existing rating), avoiding unnecessary queries for already-rated visits.

### VisitRatingCard UI (D2-OK)

- Star hover + click interaction is clean
- `isEditing = !existingRating` — once rated, stars are locked (disabled buttons)
- Comment box appears on first star click, not prematurely
- Existing comment displayed in italics when viewing a past rating
- Submit button disabled when `selected === 0` or `isSubmitting` — prevents double-submit

### VisitDetail Integration (D2-OK)

- Rating card only rendered when `job.status === "COMPLETED"` (line 143) — correct receipt-anchored trigger
- `provider_org_id` is properly available from the job query (explicitly selected in `useCustomerVisitDetail.ts:69`)
- `submitRating.mutate()` passes all required fields including `providerOrgId`

### Admin ProviderDetail Ratings Tab (D2-OK)

- New "Ratings" tab positioned second (after Overview) — good placement
- Shows avg rating with filled star display, total/positive/negative breakdown
- Graceful empty state: "No ratings yet."

---

## Findings

### D2-F1 (MEDIUM) — Suppression computed client-side; can be bypassed

**Location:** `useVisitRating.ts:92-116`

**Issue:** Suppression logic runs entirely in the browser. A determined user could call the Supabase upsert directly with `is_suppressed: false` to bypass suppression. The RLS INSERT/UPDATE policies only check `customer_id = auth.uid()` — they don't enforce suppression rules.

**Impact:** A savvy user could submit an unsuppressed 1-star rating on their first visit or after reporting an issue, which would appear in the provider's aggregate score.

**Fix:** Move suppression computation to a DB trigger or RPC:

```sql
-- Option A: BEFORE INSERT OR UPDATE trigger
CREATE OR REPLACE FUNCTION enforce_visit_rating_suppression()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
DECLARE
  v_completed_count int;
  v_issue_count int;
BEGIN
  SELECT count(*) INTO v_completed_count
  FROM jobs WHERE customer_id = NEW.customer_id AND status = 'COMPLETED';

  SELECT count(*) INTO v_issue_count
  FROM customer_issues WHERE job_id = NEW.job_id AND customer_id = NEW.customer_id;

  IF v_completed_count <= 1 THEN
    NEW.is_suppressed := true;
    NEW.suppression_reason := 'first_visit';
  ELSIF v_issue_count > 0 THEN
    NEW.is_suppressed := true;
    NEW.suppression_reason := 'issue_reported';
  END IF;

  RETURN NEW;
END;
$$;
```

**Pragmatic note:** For an MVP with trusted users, the current approach works. Flag for hardening before public launch.

### D2-F2 (LOW) — Unnecessary `as any` cast on `provider_rating_summary` view query

**Location:** `useProviderRatingSummary.ts:18`

**Issue:** The hook casts `.from("provider_rating_summary" as any)`, but the generated Supabase types at `types.ts:5634` already include `provider_rating_summary` as a known view with proper row types. The cast is unnecessary and bypasses type safety.

**Fix:** Remove the `as any`:
```ts
const { data, error } = await supabase
  .from("provider_rating_summary")
  .select("*")
  .eq("provider_org_id", providerOrgId!)
  .maybeSingle();
```

---

## Summary

| ID | Severity | Description | Blocks D3? |
|----|----------|-------------|------------|
| D2-F1 | MEDIUM | Suppression computed client-side, bypassable via direct API | No |
| D2-F2 | LOW | Unnecessary `as any` on view query despite generated types | No |

**Sprint D2 is clear to proceed to D3 (Property Health Score).**
