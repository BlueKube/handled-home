# Batch 1.3 — Admin Plans UI + variant rule editor

> **Phase:** 1 — Schema: size_tier on plans + variant selection RPC
> **Size:** M (Medium)
> **Review tier:** Medium — 2 parallel lanes (Spec / Bug; Lane 3 skipped for prior-review-clean-slate) + Sonnet synthesis = 3 agents.

---

## Problem

Batch 1.1 seeded 12 new variant rows and 12 default rules. Admin has no UI to:
- See family grouping (current Plans page is a flat status-filtered list; 15 plans now = ugly).
- Set `plan_family` and `size_tier` on new or existing plans (only basics + Stripe fields editable today).
- Create / edit / delete `plan_variant_rules` rows that drive the `pick_plan_variant` RPC.

## Goals

1. PlanForm exposes `plan_family` + `size_tier` inputs so an admin can shape any plan row into a variant.
2. Plans list groups rows by family with a header row + plan count per family. Status filter still works.
3. New route `/admin/plan-variant-rules` — table of rules, filter by family, create/edit/delete in a side sheet.
4. Link the new page from Plans.tsx header ("Manage variant rules" button).

## Scope

### `src/components/admin/plans/PlanForm.tsx`

Add a new section between "Basics" and "Stripe":

```
Variant
  Plan family [select: legacy | basic | full | premier]
  Size tier   [select: — | 10 | 20 | 30 | 40]
  (help text) "Legacy plans keep Essential/Plus/Premium. Family + tier determine which variant the pick_plan_variant RPC returns."
```

Inputs bind to `plan.plan_family` and `plan.size_tier` via the existing `onChange` pattern.

### `src/pages/admin/Plans.tsx`

After filtering by status + search, group by `plan_family` (buckets: legacy, basic, full, premier, null). Render each non-empty group with a `<h3>` family header + plan count, then existing Card rendering unchanged. Empty groups collapsed. Keep the per-plan click-to-edit behavior.

Add a secondary button in the header next to "New Plan": "Variant Rules" → navigates to `/admin/plan-variant-rules`.

### `src/pages/admin/PlanVariantRules.tsx` (new)

Route: `/admin/plan-variant-rules` (register in `src/App.tsx`).

Layout:
- Header: "Variant Rules" + family filter tabs (all | basic | full | premier).
- Rule table (desktop) / stacked cards (mobile):
  - Family, target size tier, sqft tiers (pill list), priority, notes (truncated).
  - Edit / delete actions.
- "New rule" button opens a side sheet.

Sheet form fields:
- Plan family (select)
- Target size tier (select 10/20/30/40)
- Sqft tiers (multi-select: lt_1500, 1500_2500, 2500_3500, 3500_5000, 5000_plus) — empty = wildcard
- Yard tiers (multi-select: NONE, SMALL, MEDIUM, LARGE)
- Windows tiers (multi-select: lt_15, 15_30, 30_plus)
- Stories tiers (multi-select: 1, 2, 3_plus)
- Priority (number, default 10)
- Notes (text)

Uses `usePlanVariantRules`, `useCreateVariantRule`, `useUpdateVariantRule`, `useDeleteVariantRule` from Batch 1.2.

### Acceptance criteria

- [ ] PlanForm has Family + Size tier inputs; saving a plan with family='basic', size_tier=20 persists both.
- [ ] Plans.tsx groups rows by family: legacy / basic / full / premier / (unassigned).
- [ ] New admin page at `/admin/plan-variant-rules` lists all 12 seeded rules.
- [ ] Create rule → appears in list. Edit rule → persists. Delete rule → removes.
- [ ] Multi-selects allow empty = wildcard.
- [ ] "Variant Rules" button in Plans.tsx navigates correctly.
- [ ] `npx tsc --noEmit` + `npm run build` pass.

### Out of scope

- No bulk-edit or CSV import for rules.
- No simulator preview ("what would pick_plan_variant return for this property?") — Phase 2 task.
- No plan family or size_tier filter on the Plans list (status filter is enough for now).

### Files touched

- **Edit:** `src/components/admin/plans/PlanForm.tsx`
- **Edit:** `src/pages/admin/Plans.tsx`
- **Edit:** `src/App.tsx` (register new route)
- **New:** `src/pages/admin/PlanVariantRules.tsx`
- **New:** `src/components/admin/plans/VariantRuleForm.tsx` (if the form is big enough to split; inline otherwise)

### Review prompt notes

- **Lane 1 (spec):** every field wired; routing registered; group-by works with no plans in a family (empty-group handling).
- **Lane 2 (bugs):** multi-select empty-array semantics; form-state leakage between edit-different-rule sessions; invalidation keys after mutations; loading/error states.
- **Synthesis:** standard scoring.
