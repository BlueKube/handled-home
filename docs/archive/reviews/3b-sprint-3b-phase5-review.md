# Sprint 3B Phase 5 Review — Personalization API + Level Default + Category Eligibility

**Reviewer:** Claude (automated spec reviewer)
**Date:** 2026-03-01
**Scope:** `get_property_profile_context` RPC, `usePropertyProfileContext`, `useLevelDefault`, `useCategoryEligibility`, `AddServicesSheet` integration
**Spec:** 3B-10, 3B-11, 3B-12

---

## Verdict: 2 CRITICAL, 2 MEDIUM, 1 LOW findings

Phase 5 has real bugs that will cause runtime failures.

---

## P5-F1 (CRITICAL): `EntitlementSku` has no `category` field — `(s as any).category` is always `undefined`, so category filtering is silently broken

`AddServicesSheet.tsx:79`

```ts
.filter((s) => isEligible((s as any).category)) // Suppress NA categories
```

The `EntitlementSku` interface (`useEntitlements.ts:18-26`) contains only: `sku_id`, `sku_name`, `status`, `provider_only`, `reason`, `ui_badge`, `ui_explainer`. There is no `category` field.

The `useEntitlements` hook builds SKU objects at line 136-156 by selecting only `id, name` from `service_skus` (line 111). The `category` column exists on the `service_skus` table but is never fetched or mapped.

So `(s as any).category` evaluates to `undefined`, and `isEligible(undefined)` returns `true` (line 16-17 of `useCategoryEligibility.ts`: `if (!category) return true`). **Every SKU passes the filter. NA suppression does nothing.**

The `as any` cast is a red flag that the developer knew the type didn't match.

**Fix:**
1. Add `category` to the `service_skus` select in `useEntitlements.ts:111`: `.select("id, name, category")`
2. Add `category: string | null` to the `EntitlementSku` interface
3. Map it in the SKU builder at line 142: `category: sku.category ?? null`
4. Remove the `as any` cast in `AddServicesSheet.tsx:79`

---

## P5-F2 (CRITICAL): `useLevelDefault` is imported but never wired — `useDefaultLevelId` still returns the first active level (ignoring sizing)

`AddServicesSheet.tsx:19-23`

```ts
/** Returns the sizing-aware default level ID for a SKU, or null */
function useDefaultLevelId(skuId: string | null) {
  const { data: levels } = useSkuLevels(skuId);
  const activeLevels = (levels ?? []).filter((l) => l.is_active);
  return activeLevels.length > 0 ? activeLevels[0].id : null;
}
```

The JSDoc comment was updated to say "sizing-aware" but the implementation is unchanged — it just returns `activeLevels[0].id`. The `useLevelDefault` hook was created but never imported or called in `AddServicesSheet`. The level-default engine (3B-11) is dead code.

**Fix:** Replace `useDefaultLevelId` with a call to `useLevelDefault`, or integrate `useLevelDefault` into the existing function. Note: this also requires passing a `category` to `useLevelDefault`, which ties back to P5-F1 — SKUs need their category field.

---

## P5-F3 (MEDIUM): Spec says `yard_tier: "MED"` but RPC and code use `"MEDIUM"` — potential mismatch if spec-aligned consumers expect `"MED"`

Spec section 8.1 example shows:
```json
"yard_tier": "MED"
```

But `usePropertySignals.ts:39` defines:
```ts
export const YARD_OPTIONS: { value: YardTier; label: string }[] = [
  { value: "NONE", label: "None" },
  { value: "SMALL", label: "Small" },
  { value: "MEDIUM", label: "Medium" },
  { value: "LARGE", label: "Large" },
];
```

And the level-default engine (`useLevelDefault.ts`) doesn't reference `MEDIUM` at all — it only checks for `LARGE` and `NONE`. So this inconsistency doesn't cause a bug *today*, but if a future consumer follows the spec and checks for `"MED"` it will silently fail.

**Recommendation:** Update the spec example to match the code (`"MEDIUM"`), or add a comment documenting the canonical values.

---

## P5-F4 (MEDIUM): RPC returns `STABLE` but the `has_role` call reads `user_roles` which may change — should be `SECURITY DEFINER` + `STABLE` is semantically incorrect if role-check reads mutable data

`migration:8-9`

```sql
STABLE
SECURITY DEFINER
```

`STABLE` tells Postgres the function returns the same result for the same arguments within a single statement. But `has_role(v_caller_id, 'admin')` reads from the `user_roles` table, which is mutable. In practice, Postgres doesn't aggressively optimize `STABLE` functions in most usage patterns, so this won't cause wrong results in typical app usage. But it's semantically incorrect and could bite in edge cases (e.g., if the RPC is called multiple times in a single SQL statement after a role change).

**Recommendation:** Change to `VOLATILE` or accept the slight semantic incorrectness. Low risk in practice since this is always called as a standalone RPC.

---

## P5-F5 (LOW): `useLevelDefault` reason string references `selected.label` — correct per the DB schema, but Lovable's commit description said `selected.name`

`useLevelDefault.ts:85`

```ts
? `Homes your size typically use ${selected.label}`
```

The `sku_levels` table has a `label` column (confirmed in types.ts). The code is correct. However, Lovable's commit description mentioned "e.g. 'Homes your size typically use Standard'" which implies a `name` field. Since `label` is the correct field, this is just a documentation inconsistency — no code fix needed.

---

## Spec Compliance Checklist

| Spec Requirement | Status | Notes |
|-----------------|--------|-------|
| 3B-10: `get_property_profile_context` RPC | PASS | Returns coverage, sizing, computed eligibility |
| 3B-10: Auth check (owner or admin) | PASS | Checks `auth.uid()`, ownership, `has_role('admin')` |
| 3B-10: Coverage map in response | PASS | `jsonb_object_agg` over `property_coverage` |
| 3B-10: Sizing signals in response | PASS | Reads from `property_signals` |
| 3B-10: Computed eligible_categories | PASS | NONE + SELF(high-pain) + PROVIDER(switch intent) |
| 3B-10: Computed suppressed_categories | PASS | NA categories |
| 3B-10: Computed high_confidence_upsells | PASS | NONE/SELF + high-pain list |
| 3B-10: Computed switch_candidates | PASS | PROVIDER + OPEN_NOW/OPEN_LATER |
| 3B-10: `usePropertyProfileContext` hook | PASS | 5-min staleTime, correct RPC call |
| 3B-11: `useLevelDefault` hook | PARTIAL | Hook exists with correct rules, but **never integrated** (P5-F2) |
| 3B-11: Per-category rules | PASS | windows, gutters, cleanup, mowing, trimming, treatment, power_wash |
| 3B-11: Returns default_level_id + reason + confidence | PASS | Correct shape |
| 3B-12: `useCategoryEligibility` hook | PASS | Wraps profile context, exposes `isEligible` |
| 3B-12: AddServicesSheet filters NA categories | **FAIL** | `category` field missing from `EntitlementSku` (P5-F1) |
| Spec 10.1: Pool=NA suppresses pool services | **FAIL** | Dead due to P5-F1 |
| Spec 10.2: Level default engine accesses sizing | **FAIL** | Dead code due to P5-F2 |

---

## Summary

| ID | Severity | Component | Issue |
|----|----------|-----------|-------|
| P5-F1 | CRITICAL | AddServicesSheet | `category` not on `EntitlementSku` — `(s as any).category` is always `undefined`, NA suppression is a no-op |
| P5-F2 | CRITICAL | AddServicesSheet | `useLevelDefault` created but never wired — `useDefaultLevelId` still returns first active level |
| P5-F3 | MEDIUM | Spec vs code | Spec says `yard_tier: "MED"`, code uses `"MEDIUM"` |
| P5-F4 | MEDIUM | RPC migration | `STABLE` volatility is semantically incorrect with `has_role` reading mutable data |
| P5-F5 | LOW | useLevelDefault | `selected.label` is correct per schema; commit description said `name` |

**Recommendation:** Phase 5 needs fixes before it can ship. P5-F1 and P5-F2 mean two of the three features (category filtering and level defaults) are dead code — the hooks exist but are not actually connected to the UI. The RPC and hooks themselves are well-structured; the wiring is the problem.
