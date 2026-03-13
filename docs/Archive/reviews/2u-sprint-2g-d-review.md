# Sprint 2G-D Part 1 Review — Pricing Engine + Schema

**Status:** CONDITIONAL PASS — 2 HIGH, 3 MEDIUM, 3 LOW findings

## Prior-review remediation check

| Finding | Status |
|---------|--------|
| C-F3 (MEDIUM) — audit log missing `actor_admin_role` | **NOT REMEDIATED** — new migration does not add column or update `log_admin_action`. Remains OPEN. |

## 2G-D1 — Schema (migration `20260228000336`)

**6 tables created:**

| Table | Spec ref | Columns match | RLS | Indexes |
|-------|----------|---------------|-----|---------|
| `sku_pricing_base` | §9.1 | sku_id, base_price_cents, currency, active_from, version, changed_by, reason | Admin SELECT, Superuser ALL | (sku_id, active_from DESC) |
| `sku_pricing_zone_overrides` | §9.1 | zone_id, sku_id, price_multiplier, override_price_cents, active_from, active_to, version, changed_by, reason | Admin SELECT, Superuser ALL | (zone_id, sku_id, active_from DESC) |
| `provider_payout_base` | §9.2 | sku_id, base_payout_cents, active_from, version, changed_by, reason | Admin SELECT, Superuser ALL | (sku_id, active_from DESC) |
| `provider_payout_zone_overrides` | §9.2 | zone_id, sku_id, payout_multiplier, override_payout_cents, active_from, active_to, version, changed_by, reason | Admin SELECT, Superuser ALL | (zone_id, sku_id, active_from DESC) |
| `provider_org_contracts` | §9.2 | provider_org_id, contract_type (enum: partner_flat/partner_time_guarded/contractor_time_based), category, active_from, active_to, version, changed_by, reason | Admin SELECT, Superuser ALL | (provider_org_id, active_from DESC) |
| `payout_overtime_rules` | §9.2 | zone_id, sku_id, category, expected_minutes, overtime_rate_cents_per_min, overtime_start_after_minutes, overtime_cap_cents, version, changed_by, reason, active_from, active_to | Admin SELECT, Superuser ALL | (zone_id, active_from DESC) |

**Spec compliance:** All 6 tables match spec §9.1 and §9.2. All versioned with `version`, `changed_by`, `reason`, `active_from/active_to`. Contract type enum matches spec §5.1 exactly.

**RLS pattern:** Consistent across all 6 tables — `is_admin_member` for SELECT, `is_superuser` for ALL (insert/update/delete). Correct per spec §8 ("Superuser-only write access").

## 2G-D1 — RPCs

**`get_effective_sku_price(zone_id, sku_id)`:**
- Resolves latest active base price + latest active zone override
- Priority: override_price_cents > (base × multiplier) > base alone
- `LANGUAGE sql STABLE SECURITY DEFINER` — pure query, correct stability marker
- Issue: SECURITY DEFINER bypasses table RLS, meaning any authenticated user (including providers) can call this. See D-F6.

**`get_effective_provider_payout(zone_id, sku_id)`:**
- Same resolution pattern for payout side
- Same SECURITY DEFINER concern as above

**`rollback_pricing_override(override_id, reason)`:**
- Superuser check: `IF NOT is_superuser(auth.uid()) THEN RAISE EXCEPTION`
- Expires current active override for same zone+sku
- Inserts new row copying previous version's values with `version + 1`
- Calls `log_admin_action` — only pricing operation that produces an audit trail
- Correct: "rollback = create new version" per spec §2.3 in governance doc

## 2G-D1 — UI

**`useZonePricing.ts` (184 lines) — 6 hooks:**
- `useSkuPricingBase()` — fetches all base prices, ordered by created_at DESC
- `useZonePricingOverrides(zoneId)` — fetches active overrides (active_to IS NULL) for selected zone
- `useSetBasePriceMutation()` — direct INSERT into sku_pricing_base
- `useSetZoneOverrideMutation()` — expire old + INSERT new override (two separate requests, NOT transactional)
- `useBulkSetMultiplierMutation()` — loop expire + batch INSERT for all SKUs in zone
- `useRollbackPricingMutation()` — calls `rollback_pricing_override` RPC

**`ControlPricing.tsx` (360 lines):**
- Zone selector dropdown + SKU pricing table
- Table columns: SKU, Base Price, Multiplier, Override, Effective, Last Changed, Reason, Actions
- Inline editing for base price and zone override (multiplier OR absolute override)
- Bulk Multiplier dialog — applies single multiplier to all SKUs in zone
- Copy From Zone dialog — copies overrides from source zone to target
- Rollback button per override row
- Non-superuser: read-only badge, action column hidden
- `effectivePrice()` calculation matches SQL resolution logic (override > multiplier × base > base)

**Spec §3.3 UI tools coverage:**

| Tool | Spec | Built |
|------|------|-------|
| Per-SKU base price editing | Yes | Yes |
| Zone multiplier per SKU | Yes | Yes |
| Zone absolute override per SKU | Yes | Yes |
| Bulk set multiplier for category | Yes | Partially — applies to ALL SKUs, not per category |
| Copy pricing from another zone | Yes | Yes |
| Schedule changes (effective date) | Yes | **No UI** — `active_from` param exists in mutation but no date picker |
| Rollback to last version | Yes | Yes (via RPC) |
| Max change per week guardrail | Yes | **Not implemented** |
| Emergency override toggle (72h auto-expire) | Yes | **Not implemented** |
| Reason required | Yes | **Not enforced** — falls back to defaults |

**Route:** `/admin/control/pricing` wired in App.tsx line 259. Import at line 121.

## Findings

| ID | Severity | Issue |
|----|----------|-------|
| D-F1 | HIGH | **Client-side mutations bypass audit logging.** `useSetBasePriceMutation`, `useSetZoneOverrideMutation`, and `useBulkSetMultiplierMutation` do direct inserts/updates via Supabase client without calling `log_admin_action`. Only `rollback_pricing_override` (server RPC) logs. Spec §9.3: "All writes to pricing/payout tables produce an audit record." Spec §10 acceptance: "Every pricing/payout change is audited and reversible." **Fix:** Create server-side RPCs for all pricing write operations that include `log_admin_action` calls, or add Postgres triggers on pricing tables to auto-log changes. |
| D-F2 | HIGH | **Race condition in expire-then-insert pattern.** `useSetZoneOverrideMutation` does (1) UPDATE active_to on existing override, then (2) INSERT new override as two separate Supabase client calls. If step 1 succeeds but step 2 fails (network error, RLS rejection, constraint violation), the zone ends up with NO active override — pricing falls back to base silently. `useBulkSetMultiplierMutation` has the same issue amplified across N SKUs. **Fix:** Wrap in a server-side RPC that does both operations in a single transaction (same pattern as `rollback_pricing_override`). |
| D-F3 | MEDIUM | **`version` column never incremented by client mutations.** All inserts via UI leave `version = 1` (table default). Only `rollback_pricing_override` increments version. Versions should be monotonically increasing per zone+sku pair for meaningful history/rollback. Without incrementing versions, the rollback RPC's `v_prev.version + 1` could produce duplicate version numbers. |
| D-F4 | MEDIUM | **Reason field not enforced.** UI label says "Reason (required)" but code uses fallback defaults: `editBaseReason \|\| "Updated base price"`, `editOverrideReason \|\| "Zone override"`, `bulkReason \|\| "Bulk multiplier"`. An empty reason passes and produces a generic audit trail. Spec §3.3: "reason required." |
| D-F5 | MEDIUM | **`get_effective_sku_price` leaks customer pricing to non-admins.** Both resolution functions are `SECURITY DEFINER`, bypassing table RLS. Any authenticated user (including providers) can call `SELECT * FROM get_effective_sku_price(zone_id, sku_id)` and see customer prices. Spec §4.1: "Providers do NOT see customer price." **Fix:** Either add `IF NOT is_admin_member(auth.uid())` check (requires rewriting to plpgsql), or remove `SECURITY DEFINER` so underlying table RLS applies. |
| D-F6 | LOW | **Effective date scheduling not in UI.** Spec §3.3 lists "Schedule changes (effective date)" as a tool. The `active_from` parameter exists in `useSetZoneOverrideMutation` but no date picker is exposed. All changes are immediate. |
| D-F7 | LOW | **"Last changed by" not shown.** Spec §3.3 table columns include "Last changed by." The UI shows only the timestamp. `changed_by` UUID is stored but not resolved to a user name/email. |
| D-F8 | LOW | **Bulk multiplier applies to all SKUs, not per category.** Spec §3.3 says "Bulk set multiplier for a category." The UI applies to ALL SKUs in the zone. Minor — category filtering can be added later. |

## What passed well

- Schema design is clean: all 6 tables follow consistent versioning pattern with `active_from/active_to` temporal ranges
- `provider_contract_type` enum matches spec §5.1 exactly — forward-looking for payout engine UI
- `payout_overtime_rules` has all needed params from spec §7 (expected_minutes, overtime_start_after_minutes, overtime_rate_cents_per_min, overtime_cap_cents)
- `rollback_pricing_override` is the correct pattern: new-version-from-old, superuser-gated, audit-logged
- Effective price resolution functions use correct priority: absolute override > multiplier × base > base
- UI is functional with proper superuser gating — non-superusers see read-only view
- Copy-from-zone feature is a thoughtful operational tool for zone launches

## Recommendations before 2G-D Part 2

**D-F1 and D-F2 should be fixed before building the Payout Engine UI**, since the payout mutations will need the same pattern. Creating server-side RPCs now (e.g., `set_sku_base_price`, `set_zone_pricing_override`, `bulk_set_zone_multiplier`) that handle:
1. Transaction safety (expire + insert atomic)
2. Version incrementing
3. Audit logging via `log_admin_action`
4. Reason validation (non-empty)

This would fix D-F1, D-F2, D-F3, and D-F4 simultaneously, and establish the pattern for payout mutations.

## Open findings tracker (cumulative)

| ID | Severity | Status | Description |
|----|----------|--------|-------------|
| E05-F3 | LOW | OPEN | Tier modifier cosmetic for primary path |
| B-F1 | HIGH | CLOSED | Dispatcher queues wrong status values — fixed |
| B-F2 | HIGH | CLOSED | "Follow Up" invalid job status — removed |
| B-F3 | MEDIUM | OPEN | Search filter injection in `.or()` |
| B-F4 | MEDIUM | OPEN | Non-standard event types in job_events |
| B-F5 | LOW | OPEN | UUID regex too permissive |
| B-F6 | LOW | OPEN | Review file deletions |
| C-F1 | LOW | OPEN | Dead `'assigned'` value in auto_assign_job skip check |
| C-F2 | LOW | OPEN | `log_admin_action` has no admin caller check |
| C-F3 | MEDIUM | OPEN | Audit log missing `actor_admin_role` column per spec §2.1 |
| C-F4 | LOW | OPEN | `entity_id` type mismatch (UUID column vs text RPC param) |
| C-F5 | LOW | OPEN | `DecisionTraceCard` only on Job detail (spec wants 5 pages) |
| D-F1 | HIGH | OPEN | Client-side pricing mutations bypass audit logging |
| D-F2 | HIGH | OPEN | Race condition in expire-then-insert (no transaction) |
| D-F3 | MEDIUM | OPEN | `version` column never incremented by client mutations |
| D-F4 | MEDIUM | OPEN | Reason field says "required" but not enforced |
| D-F5 | MEDIUM | OPEN | `get_effective_sku_price` leaks pricing to non-admins |
| D-F6 | LOW | OPEN | Effective date scheduling not in UI |
| D-F7 | LOW | OPEN | "Last changed by" not shown (only timestamp) |
| D-F8 | LOW | OPEN | Bulk multiplier applies to all SKUs, not per category |
