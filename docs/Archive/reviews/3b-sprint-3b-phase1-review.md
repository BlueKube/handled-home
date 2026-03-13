# Sprint 3B Phase 1 Review — Schema & RLS

**Reviewer:** Claude (automated spec reviewer)
**Date:** 2026-03-01
**Scope:** Migration `20260301065411`, tables: `property_coverage`, `property_signals`, `personalization_events`
**Spec:** Sprint 3B Phase 1 — Coverage map + property sizing + personalization events schema

---

## Verdict: 1 HIGH, 1 MEDIUM, 2 LOW findings

---

## P1-F1 (HIGH): `switch_intent` cleared for `SELF` — defeats its purpose

`migration:27-30`

```sql
IF NEW.coverage_status != 'PROVIDER' THEN
  NEW.switch_intent := NULL;
END IF;
```

The trigger clears `switch_intent` for any status other than `PROVIDER`. But the business purpose of `switch_intent` is to capture willingness to *switch to* a provider. The primary use case is:

- `coverage_status = 'SELF'` + `switch_intent = 'OPEN_NOW'` → "I handle lawn care myself but I'd like a provider"
- `coverage_status = 'SELF'` + `switch_intent = 'OPEN_LATER'` → "I handle it myself, maybe later"

If a customer marks `SELF` and sets `switch_intent = 'OPEN_NOW'`, the trigger immediately nullifies it. The `PROVIDER` status means they already have a provider — in that case `switch_intent` is moot.

The intent-clearing logic should be inverted: clear `switch_intent` when status IS `PROVIDER` (already have one) or `NA` (not applicable), but preserve it for `SELF` and `NONE`.

**Fix:**

```sql
IF NEW.coverage_status IN ('PROVIDER', 'NA') THEN
  NEW.switch_intent := NULL;
END IF;
```

This allows `switch_intent` for `SELF` ("doing it myself, open to switching") and `NONE` ("not getting this service, but might want it").

---

## P1-F2 (MEDIUM): `property_coverage` has no `created_at` column

`migration:7-15`

```sql
CREATE TABLE public.property_coverage (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  category_key text NOT NULL,
  coverage_status text NOT NULL DEFAULT 'NONE',
  switch_intent text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (property_id, category_key)
);
```

The table has `updated_at` but no `created_at`. The `personalization_events` table has `created_at` for analytics, but when Phase 6 (Admin Visibility) needs to show when a customer first filled out their coverage map, there's no timestamp for initial creation. The `updated_at` field is overwritten on every change by the trigger.

This is a standard column in every other table in the codebase. Adding it later requires a migration and backfilling with `updated_at` values (lossy).

**Fix:** Add `created_at timestamptz NOT NULL DEFAULT now()` to `property_coverage`. Don't update it in the trigger (only `updated_at` should be touched).

---

## P1-F3 (LOW): `category_key` is freeform text — no enum validation

`migration:10`

```sql
category_key text NOT NULL,
```

The `coverage_status` and `switch_intent` columns have trigger-based enum validation, but `category_key` accepts any string. The Phase 2 UI will presumably define ~10 categories (lawn, cleaning, pool, etc.), but nothing prevents typos or inconsistent keys from being inserted.

This isn't critical for Phase 1 since the UI will control the keys, but it means the database doesn't enforce the category vocabulary. If a future API or admin tool inserts rows with a typo (`"lawnn"` vs `"lawn"`), it silently creates orphaned data.

**Fix (optional):** Either add a CHECK constraint with the known categories, or add a `service_categories` reference table that Phase 2 can populate. Alternatively, accept this as a deliberate flexibility — just document the canonical keys somewhere.

---

## P1-F4 (LOW): `personalization_events` has no UPDATE/DELETE restriction in RLS

`migration:125-135`

The RLS policies grant `INSERT` and `SELECT` to customers, and `ALL` to admins. This is correct for append-only semantics. However, the absence of an explicit `UPDATE` or `DELETE` deny policy means if any future code accidentally issues an UPDATE or DELETE, it will silently fail (no matching policy = denied). This is actually the correct behavior — RLS defaults to deny. So this is fine as-is.

**Note:** Confirmed this is a non-issue. Just documenting for completeness — the append-only intent is correctly enforced by RLS.

---

## Summary

| ID | Severity | Component | Issue |
|----|----------|-----------|-------|
| P1-F1 | HIGH | validate_property_coverage | `switch_intent` cleared for `SELF` — defeats its purpose |
| P1-F2 | MEDIUM | property_coverage | Missing `created_at` column |
| P1-F3 | LOW | property_coverage | `category_key` has no enum validation |
| P1-F4 | LOW | personalization_events | Append-only correctly enforced (non-issue, documented) |

**Recommendation:** Fix P1-F1 before Phase 2 — the coverage map UI will need to save `switch_intent` for `SELF` categories, and the current trigger will silently discard it. P1-F2 should also be addressed now while the table is empty.
