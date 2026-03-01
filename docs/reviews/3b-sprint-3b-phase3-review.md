# Sprint 3B Phase 3 Review — Property Sizing + Home Setup Card

**Reviewer:** Claude (automated spec reviewer)
**Date:** 2026-03-01
**Scope:** `usePropertySignals.ts`, `PropertySizing.tsx`, `HomeSetupCard.tsx`, route wiring
**Spec:** 3B-06 Property Sizing screen, 3B-07 Progressive "Complete Home Setup" prompt card

---

## Verdict: 1 CRITICAL, 1 MEDIUM, 2 LOW findings

---

## P3-F1 (CRITICAL): Tier enum values mismatch between TypeScript and DB trigger — every save will fail

`usePropertySignals.ts` types vs `migration 20260301065411` trigger validation

The TypeScript hook defines tier enums that **do not match** the values the DB trigger accepts. Every `property_signals` upsert will be rejected with a trigger exception.

| Field | DB trigger accepts | TypeScript sends | Match? |
|-------|-------------------|-----------------|--------|
| `home_sqft_tier` | `lt_1500` | `UNDER_1500` | MISMATCH |
| `home_sqft_tier` | `5000_plus` | `OVER_5000` | MISMATCH |
| `yard_tier` | `MEDIUM` | `MED` | MISMATCH |
| `windows_tier` | `lt_15` | `UNDER_15` | MISMATCH |
| `windows_tier` | `30_plus` | `OVER_30` | MISMATCH |
| `stories_tier` | `3_plus` | `3_PLUS` | MISMATCH |

Only 7 of 16 total enum values match (`1500_2500`, `2500_3500`, `3500_5000`, `NONE`, `SMALL`, `LARGE`, `15_30`, `1`, `2`). The remaining 9 will cause `RAISE EXCEPTION` in the trigger.

**Fix:** Either update the TypeScript types to match the DB, or create a migration to update the trigger. Recommended: update TypeScript to match DB since the DB is the source of truth and changing the trigger requires a migration.

```ts
// Match DB trigger values:
export type SqftTier = "lt_1500" | "1500_2500" | "2500_3500" | "3500_5000" | "5000_plus";
export type YardTier = "NONE" | "SMALL" | "MEDIUM" | "LARGE";
export type WindowsTier = "lt_15" | "15_30" | "30_plus";
export type StoriesTier = "1" | "2" | "3_plus";

// Update labels to keep the UI display unchanged:
{ value: "lt_1500", label: "< 1,500" }
{ value: "5000_plus", label: "5,000+" }
{ value: "MEDIUM", label: "Medium" }
{ value: "lt_15", label: "< 15" }
{ value: "30_plus", label: "30+" }
{ value: "3_plus", label: "3+" }
```

---

## P3-F2 (MEDIUM): `HomeSetupCard` makes two independent hook calls on every dashboard render

`HomeSetupCard.tsx:14-15`

```ts
const { hasData: hasCoverage, isLoading: covLoading } = usePropertyCoverage();
const { hasData: hasSignals, isLoading: sigLoading } = usePropertySignals();
```

Every time the customer dashboard renders, `HomeSetupCard` triggers two Supabase queries (one for `property_coverage`, one for `property_signals`). If the dashboard is the primary landing page, these queries fire on every app open.

This isn't a correctness bug — both hooks use react-query caching, so subsequent renders within the cache window are free. But it means the dashboard cold-load makes 2 extra queries just to decide whether to show a card. If the card is dismissed (both complete), it still runs both queries before returning `null`.

**Fix (optional but recommended):** Consider a single lightweight query (e.g., a Supabase RPC or a combined query) that returns `{ hasCoverage: boolean, hasSignals: boolean }` to reduce cold-load query count. Alternatively, this is fine for v1 and can be optimized later when dashboard performance is tuned.

---

## P3-F3 (LOW): Spec says switch intent applies to "I have someone" (PROVIDER), implementation applies to SELF/NONE

**Spec section 4.2 (line 122):** "If user selects **I have someone**, immediately show a subtle sub-question"

**Implementation:** CoverageMap.tsx shows intent for `SELF` and `NONE`, and the P1-F1 trigger fix clears intent for `PROVIDER` and `NA`.

This was a deliberate divergence from the spec made during P1-F1 review — the implementation makes better business sense (you want to know if `SELF` users are open to switching, not `PROVIDER` users who already have someone). Documenting for traceability only. **No action needed.**

---

## P3-F4 (LOW): `HomeSetupCard` `hasCoverage` is true when *any* coverage row exists

`usePropertyCoverage.ts:114`

```ts
hasData: (query.data?.length ?? 0) > 0,
```

If a user saves the coverage map with just 1 category set (out of 10), `hasCoverage` is `true` and the card shows a checkmark for "Coverage map". But the coverage map upserts all 10 categories on save (line 81-88 of CoverageMap.tsx), so in practice this can only happen if someone bypasses the UI and inserts a single row via API.

In the current flow this is a non-issue since the save always writes all 10 categories. But for Phase 4 (edit screens), if partial saves become possible, this check should be tightened.

---

## Summary

| ID | Severity | Component | Issue |
|----|----------|-----------|-------|
| P3-F1 | CRITICAL | usePropertySignals | 9 of 16 tier enum values mismatch DB trigger — saves will fail |
| P3-F2 | MEDIUM | HomeSetupCard | Two extra Supabase queries on every dashboard render |
| P3-F3 | LOW | CoverageMap (spec divergence) | Intent shown for SELF/NONE, not PROVIDER per spec — deliberate, documented |
| P3-F4 | LOW | usePropertyCoverage | `hasData` true with any single row — only matters if partial saves exist |

**Recommendation:** P3-F1 is a **blocker** — the property sizing screen is completely non-functional until the enum values are aligned. Fix before any testing.
