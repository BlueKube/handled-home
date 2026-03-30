# Sprint 2G-C Review — Governance + Explainability

**Status:** PASS with 5 findings (1 MEDIUM, 4 LOW)

## Prior-review remediation (B-F1, B-F2)

| Finding | Fix | Verified |
|---------|-----|----------|
| B-F1 (HIGH) | `useDispatcherQueues` status filters rewritten to match DB CHECK constraint: At Risk → `['IN_PROGRESS', 'ISSUE_REPORTED']`, Missing Proof → `['COMPLETED']`, Unassigned → `['NOT_STARTED']` | Yes — all three queries now use correct uppercase values |
| B-F2 (HIGH) | "Follow Up" action no longer updates job status. Comment added: "tracked via job_event only — no job status change to avoid violating the CHECK constraint" | Yes — `status: "needs_follow_up" as any` removed entirely |

Both HIGH findings are **CLOSED**.

## 2G-C1 — Schema + RPC

Migration `20260227234557`:

**`decision_traces` table:**
- Columns: `decision_type`, `entity_type`, `entity_id`, `inputs` (jsonb), `candidates` (jsonb array), `scoring` (jsonb), `outcome` (jsonb), `override_event_id` (nullable FK for future admin override linking)
- Indexes: `(entity_type, entity_id)` for per-entity lookups, `(decision_type, created_at DESC)` for type-filtered chronological views
- RLS: SELECT-only for active `admin_memberships` — no INSERT/UPDATE/DELETE policies. Correct: only SECURITY DEFINER RPCs write traces, bypassing RLS

**`log_admin_action()` RPC:**
- SECURITY DEFINER, `search_path = 'public'`
- Inserts into `admin_audit_log` with `auth.uid()` as actor
- Parameters: `p_action`, `p_entity_type`, `p_entity_id`, `p_reason`, `p_before` (jsonb), `p_after` (jsonb)
- Returns the new audit log row's UUID

**Spec comparison (§2.1 and §4.1 of `docs/2G/02-governance-audit-and-implementation.md`):**
- `decision_traces` matches spec §4.1 exactly — all columns present
- `log_admin_action` is missing `actor_admin_role` — spec §2.1 says `admin_audit_log` should have this column. The existing table also lacks it (created in original migration). The role at action time matters because roles can change later. See C-F3.
- `entity_id` column is `UUID` type, but the RPC `p_entity_id` parameter is `text`. Postgres will auto-cast valid UUID strings, but non-UUID entity IDs (if any exist) would fail. See C-F4.

**Verdict:** Core schema matches spec. Two gaps related to audit log role tracking and entity_id type flexibility.

## 2G-C2 — UI Components

**`useDecisionTraces` hook** (`src/hooks/useDecisionTraces.ts`, 33 lines):
- Queries `decision_traces` by `entity_type` + `entity_id`
- Ordered by `created_at DESC`, limit 20
- Enabled only when `entityId` is defined
- Clean `DecisionTrace` interface exported

**`DecisionTraceCard` component** (`src/components/admin/DecisionTraceCard.tsx`, 118 lines):
- Reusable: takes `entityType` + `entityId` props
- Each trace row is collapsible (shadcn `Collapsible`)
- Sections: Outcome, Scoring, Candidates (with count), Inputs — all JSON-formatted in `<pre>` blocks
- Shows status badge from `trace.outcome.status`
- Returns `null` when no traces exist — clean conditional rendering
- Loading skeleton while fetching

**Admin JobDetail** (`src/pages/admin/JobDetail.tsx`):
- New "Trace" tab (6th tab) with Brain icon
- Renders `<DecisionTraceCard entityType="job" entityId={jobId} />`

**Admin Audit page** (`src/pages/admin/Audit.tsx`, 141 lines):
- Entity type filter dropdown with 8 types
- Table with expandable rows (Collapsible inside TableRow via `asChild`)
- Before/After diff blocks shown side-by-side when expanded
- `DiffBlock` helper renders JSON in `<pre>` with max-height scroll

**Spec comparison (§4.2 and §7.3):** Spec says `DecisionTraceCard` should be embedded in Job detail, Service day detail, Provider org detail, Payout/hold detail, and Exception detail. Currently only Job detail has it. Acceptable: only `auto_assign_job` emits traces so far. Other pages should wire it in as their decision-emitting RPCs are built (dunning, SLA evaluation, payout holds, etc.).

**Verdict:** Well-structured. The `DecisionTraceCard` is properly reusable for future entity types (subscriptions, providers, etc.).

## 2G-C3 — auto_assign_job trace wiring

Migration `20260227234815` — full rewrite of `auto_assign_job`:

**New variables:**
- `v_candidates jsonb := '[]'::jsonb` — accumulates all evaluated providers
- `v_inputs jsonb` — snapshot of job context (zone, category, date, max_daily)
- `v_result jsonb` — final outcome passed to trace

**Trace emission at all 3 exit points:**

1. **Primary assigned** (line 175): Inserts trace with single selected candidate, scoring breakdown, `status: 'assigned'` outcome
2. **Backup assigned** (line 303): Inserts trace with all evaluated candidates (rejected primary + rejected-at-capacity backups + selected backup), scoring, outcome
3. **Overflow** (line 350): Inserts trace with all rejected candidates, zone/category scoring context, `status: 'overflow'` outcome

**Candidate tracking (rejected providers recorded with reasons):**
- Primary blocked by availability → `rejected_reason: 'availability_blocked'`
- Primary failed training gate → `rejected_reason: 'training_gate_failed'`
- Backup at capacity → `rejected_reason: 'at_capacity'`
- Each rejected candidate includes `selected: false`

**Verdict:** Comprehensive. Every decision path is traced with full context. The candidates array grows as the function evaluates options, giving admins a complete picture of why a specific provider was chosen.

## Findings

| ID | Severity | Issue |
|----|----------|-------|
| C-F1 | LOW | **Dead status value in skip check.** `auto_assign_job` line 36: `IF v_job.status NOT IN ('NOT_STARTED', 'assigned')` — `'assigned'` is not a valid job status per the CHECK constraint (`NOT_STARTED`, `IN_PROGRESS`, `ISSUE_REPORTED`, `PARTIAL_COMPLETE`, `COMPLETED`, `CANCELED`). The condition is functionally equivalent to `NOT IN ('NOT_STARTED')`. Harmless but misleading. Pre-existing (not introduced in 2G-C). |
| C-F2 | LOW | **`log_admin_action` has no caller auth check.** The RPC is SECURITY DEFINER and records `auth.uid()`, but does not verify that the caller is an admin. Any authenticated user could insert audit log entries. Since audit logs are append-only and traceable, this is low risk, but consider adding `IF NOT is_admin_member(auth.uid()) THEN RAISE EXCEPTION...` to prevent non-admin pollution. |
| C-F3 | MEDIUM | **Audit log missing `actor_admin_role` per spec §2.1.** The `admin_audit_log` table has no `actor_admin_role` column. Spec explicitly requires it. The role at action time matters: if an ops user later becomes superuser, you need to know they were ops when they took the action. Fix: `ALTER TABLE admin_audit_log ADD COLUMN actor_admin_role text;` and update `log_admin_action` to call `get_admin_role(auth.uid())` at insert time. |
| C-F4 | LOW | **`entity_id` type mismatch.** `admin_audit_log.entity_id` is `UUID`, but `log_admin_action` accepts `p_entity_id text`. Postgres auto-casts valid UUID strings, but non-UUID entity IDs (if any future entities use text keys) would fail. Spec §2.1 says `entity_id (uuid/string)`. Low risk for now since all current entities use UUID PKs. |
| C-F5 | LOW | **`DecisionTraceCard` only on Job detail.** Spec §4.2 calls for it on 5 detail pages (Job, Service day, Provider org, Payout/hold, Exception). Currently only Job detail. Acceptable since only `auto_assign_job` emits traces. Other pages should wire it as decision-emitting RPCs are built. |

## What passed well

- Decision trace design is production-quality: jsonb columns allow flexible schemas per decision type without migrations
- Candidate tracking captures the full funnel (evaluated → rejected/selected) — essential for debugging assignment failures
- `override_event_id` column on `decision_traces` is forward-looking — ready for 2G-D admin override linking
- Audit page before/after diff is genuinely useful for diagnosing config changes
- `DecisionTraceCard` is entity-agnostic — will work for dunning, SLA, pricing decisions when those emit traces
- `log_admin_action` provides a standard audit interface that future admin actions can use consistently

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
