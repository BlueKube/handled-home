# Sprint 2G-D Part 1 Review — Pricing Engine + Schema

**Status:** CONDITIONAL PASS — 1 HIGH (new), 3 LOW open. Prior HIGH/MEDIUM findings remediated with 1 regression.

---

## Remediation verification (migration `20260228001439`)

| Finding | Fix applied | Verified |
|---------|------------|----------|
| D-F1 (HIGH) | All pricing writes now via server-side RPCs (`set_sku_base_price`, `set_zone_pricing_override`, `bulk_set_zone_multiplier`). Each calls `log_admin_action` with before/after state. | **YES** — all 3 RPCs include `PERFORM public.log_admin_action(...)` with correct 7-arg new signature |
| D-F2 (HIGH) | Expire + insert now atomic inside single PL/pgSQL function body. | **YES** — `set_zone_pricing_override` does UPDATE then INSERT in same function (implicit transaction). `bulk_set_zone_multiplier` loops inside single function. |
| D-F3 (MEDIUM) | Each RPC computes `COALESCE(MAX(version), 0) + 1` before insert. | **YES** — `set_sku_base_price` line 146, `set_zone_pricing_override` line 192, `bulk_set_zone_multiplier` line 236 |
| D-F4 (MEDIUM) | Reason enforced server-side: `IF p_reason IS NULL OR trim(p_reason) = '' THEN RAISE EXCEPTION 'Reason is required'`. Client-side: `toast.error("Reason is required")` + early return. | **YES** — dual enforcement in all 3 RPCs + all 3 UI handlers |
| D-F5 (MEDIUM) | `get_effective_sku_price` and `get_effective_provider_payout` rewritten to plpgsql with `IF NOT public.is_admin_member(auth.uid()) THEN RAISE EXCEPTION`. | **YES** — old functions DROPped, new ones created with admin check at top |
| C-F3 (MEDIUM) | `ALTER TABLE admin_audit_log ADD COLUMN IF NOT EXISTS actor_admin_role text`. `log_admin_action` now looks up role: `SELECT admin_role::text INTO v_role FROM admin_memberships WHERE user_id = p_admin_user_id AND is_active = true LIMIT 1`. | **YES** — column added, role auto-resolved at insert time |

All 6 findings verified as fixed. **D-F1 through D-F5 and C-F3: CLOSED.**

---

## New finding from remediation

| ID | Severity | Issue |
|----|----------|-------|
| D-F9 | HIGH | **`rollback_pricing_override` broken by `log_admin_action` signature change.** The `rollback_pricing_override` function (migration `20260228000336`, line 266) still calls `log_admin_action` with the OLD signature: `log_admin_action('rollback_pricing', 'sku_pricing_zone_overrides', v_new_id::text, p_reason, to_jsonb(v_prev), jsonb_build_object(...))`. The NEW `log_admin_action` (migration `20260228001439`) expects `(p_admin_user_id uuid, p_action text, p_entity_type text, p_entity_id text, p_before jsonb, p_after jsonb, p_reason text)`. The first argument `'rollback_pricing'` (text) will fail to cast to `uuid`, crashing at runtime. **Fix:** Update `rollback_pricing_override` to call `log_admin_action(auth.uid(), 'rollback_pricing', 'sku_pricing_zone_overrides', v_new_id::text, to_jsonb(v_prev), jsonb_build_object('rolled_back_to_version', v_prev.version), p_reason)`. |

---

## Original review (retained for context)

### 2G-D1 — Schema (migration `20260228000336`)

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

### 2G-D1 — RPCs (post-remediation)

**`set_sku_base_price(sku_id, base_price_cents, reason)`:**
- Superuser check + reason validation
- Auto-increments version per sku_id
- Inserts new base price row
- Audit logs with after-state snapshot

**`set_zone_pricing_override(zone_id, sku_id, multiplier, override_cents, reason, active_from)`:**
- Superuser check + reason validation
- Expires current active override (atomic — same transaction)
- Auto-increments version per zone+sku
- Inserts new override with specified or default active_from
- Audit logs with expired_id in before-state

**`bulk_set_zone_multiplier(zone_id, sku_ids[], multiplier, reason)`:**
- Superuser check + reason validation
- Loops over sku_ids: expire + version + insert for each
- Single audit log entry with sku_count summary
- Entire loop is atomic (single function = single transaction)

**`get_effective_sku_price(zone_id, sku_id)` (updated):**
- Now plpgsql with `is_admin_member` check before query
- Returns `sku_id, base_price_cents, price_multiplier, override_price_cents, effective_price_cents`
- Resolution: override > (base × multiplier) > base

**`get_effective_provider_payout(zone_id, sku_id)` (updated):**
- Same pattern with admin check

**`rollback_pricing_override(override_id, reason)` (NOT updated — see D-F9):**
- Still calls old `log_admin_action` signature — will crash at runtime

### 2G-D1 — UI (post-remediation)

**`useZonePricing.ts` (now 184 lines):**
- `useSetBasePriceMutation` → `supabase.rpc("set_sku_base_price", ...)` (was direct INSERT)
- `useSetZoneOverrideMutation` → `supabase.rpc("set_zone_pricing_override", ...)` (was 2 separate calls)
- `useBulkSetMultiplierMutation` → `supabase.rpc("bulk_set_zone_multiplier", ...)` (was loop of client calls)
- No longer imports `useAuth` — RPCs use `auth.uid()` server-side

**`ControlPricing.tsx` (360 lines):**
- Reason validation added to all 3 handlers: `if (!reason.trim()) { toast.error("Reason is required"); return; }`
- `toast` imported from "sonner"
- No more fallback default reasons

**Spec §3.3 UI tools coverage:**

| Tool | Spec | Built |
|------|------|-------|
| Per-SKU base price editing | Yes | Yes |
| Zone multiplier per SKU | Yes | Yes |
| Zone absolute override per SKU | Yes | Yes |
| Bulk set multiplier for category | Yes | Partially — applies to ALL SKUs, not per category |
| Copy pricing from another zone | Yes | Yes |
| Schedule changes (effective date) | Yes | **No UI** — `active_from` param exists in RPC but no date picker |
| Rollback to last version | Yes | Yes (via RPC — but **broken**, see D-F9) |
| Max change per week guardrail | Yes | **Not implemented** |
| Emergency override toggle (72h auto-expire) | Yes | **Not implemented** |
| Reason required | Yes | **Now enforced** (server + client) |

**Route:** `/admin/control/pricing` wired in App.tsx.

## What passed well

- Schema design is clean: all 6 tables follow consistent versioning pattern with `active_from/active_to` temporal ranges
- `provider_contract_type` enum matches spec §5.1 exactly — forward-looking for payout engine UI
- `payout_overtime_rules` has all needed params from spec §7 (expected_minutes, overtime_start_after_minutes, overtime_rate_cents_per_min, overtime_cap_cents)
- Effective price resolution functions use correct priority: absolute override > multiplier × base > base
- UI is functional with proper superuser gating — non-superusers see read-only view
- Copy-from-zone feature is a thoughtful operational tool for zone launches
- Remediation quality was high: RPCs follow the exact pattern recommended, dual client+server validation is thorough
- `log_admin_action` now auto-resolves `actor_admin_role` from `admin_memberships` at insert time — excellent for audit trail integrity

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
| C-F2 | LOW | OPEN | `log_admin_action` has no admin caller check (regression: now accepts arbitrary user_id instead of using auth.uid()) |
| C-F3 | MEDIUM | CLOSED | Audit log `actor_admin_role` column added + auto-resolved |
| C-F4 | LOW | OPEN | `entity_id` type mismatch (UUID column vs text RPC param) |
| C-F5 | LOW | OPEN | `DecisionTraceCard` only on Job detail (spec wants 5 pages) |
| D-F1 | HIGH | CLOSED | Pricing mutations now via server-side RPCs with audit logging |
| D-F2 | HIGH | CLOSED | Expire + insert now atomic in single PL/pgSQL transaction |
| D-F3 | MEDIUM | CLOSED | Version auto-incremented by RPCs |
| D-F4 | MEDIUM | CLOSED | Reason enforced server-side + client-side |
| D-F5 | MEDIUM | CLOSED | `get_effective_sku_price` now requires admin membership |
| D-F6 | LOW | OPEN | Effective date scheduling not in UI |
| D-F7 | LOW | OPEN | "Last changed by" not shown (only timestamp) |
| D-F8 | LOW | OPEN | Bulk multiplier applies to all SKUs, not per category |
| D-F9 | HIGH | OPEN | `rollback_pricing_override` broken — calls old `log_admin_action` signature, will crash at runtime |
