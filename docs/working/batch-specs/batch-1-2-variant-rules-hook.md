# Batch 1.2 — TS types + `usePlanVariantRules` hook + `usePlans` extensions

> **Phase:** 1 — Schema: size_tier on plans + variant selection RPC
> **Size:** S (Small) — 2 file changes (one extension, one new hook).
> **Review tier:** Small — 2 agents (combined reviewer + synthesis).

---

## Problem

Batch 1.1 landed the schema and RPC. TypeScript code still has no awareness of `plan_family`, `size_tier`, the new `plan_variant_rules` table, or the `pick_plan_variant` RPC. Phase 2 (onboarding variant resolution) and Batch 1.3 (admin UI) both block on typed access.

## Goals

1. Extend `Plan` interface in `src/hooks/usePlans.ts` to expose `plan_family` + `size_tier`. Existing queries keep working.
2. Add `PlanVariantRule` interface + query/mutation hooks in a new file `src/hooks/usePlanVariantRules.ts`.
3. Add `usePickPlanVariant(propertyId, planFamily)` hook wrapping the RPC — used by onboarding in Phase 2.

## Scope

### `src/hooks/usePlans.ts` — extend `Plan` interface

Add nullable fields:
```ts
plan_family: string | null;   // 'legacy' | 'basic' | 'full' | 'premier'
size_tier: number | null;     // 10 | 20 | 30 | 40 | null (legacy)
```

No other changes to this file. Downstream consumers (Plans.tsx, PlanCard.tsx) are touched in later phases, not this batch.

### `src/hooks/usePlanVariantRules.ts` — new file

Following the `usePlans.ts` style (own interface, direct supabase-client queries, `as any` on writes):

- `export interface PlanVariantRule` — id, plan_family, target_size_tier, sqft_tiers[], yard_tiers[], windows_tiers[], stories_tiers[], priority, notes, created_at, updated_at.
- `export function usePlanVariantRules(planFamily?: string)` — lists rules, optionally filtered by family, ordered by priority DESC + created_at ASC.
- `export function useCreateVariantRule()` — insert, invalidate on success.
- `export function useUpdateVariantRule()` — update by id, invalidate.
- `export function useDeleteVariantRule()` — delete by id, invalidate.
- `export function usePickPlanVariant()` — mutation hook (not query — RPC call with args) that calls `supabase.rpc('pick_plan_variant', { p_property_id, p_plan_family })` and returns a plan id string.

### Acceptance criteria

- [ ] `Plan` interface exposes `plan_family` and `size_tier`.
- [ ] `usePlanVariantRules(undefined)` returns all rules; `usePlanVariantRules('basic')` returns only basic rules.
- [ ] Create / update / delete mutations invalidate `["plan_variant_rules"]` query key.
- [ ] `usePickPlanVariant` calls the RPC with both params and returns the resolved plan id string (or null if RPC returns null).
- [ ] `npx tsc --noEmit` passes. (Skipping `npm run build` — 30s cost, no vite-specific concerns in TS-only batch.)

### Out of scope

- No UI consumers (Batch 1.3 onwards).
- No changes to `usePlans` call sites (Plan interface is additive).
- No changes to `integrations/supabase/types.ts` (auto-generated; hooks define their own interface).

### Files touched

- **Edit:** `src/hooks/usePlans.ts` — two lines into `Plan` interface.
- **New:** `src/hooks/usePlanVariantRules.ts`.

### Review prompt notes

Combined reviewer covers both spec completeness and bug scan. Watch for:
- `Plan` interface changes that might break consumers (shouldn't — fields are nullable additive).
- `supabase.rpc` return type — is it unknown/any? Cast correctly.
- Query invalidation keys match across hooks.
- Mutation error handling parity with the rest of `usePlans.ts`.
