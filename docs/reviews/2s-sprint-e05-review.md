# Sprint E-05 Review — Tier System + Training Gates

**Status:** PASS with 4 findings

## E-04 Finding Remediation
Not addressed in E-05. All three E-04 findings remain open:
- E04-F1 (MEDIUM): `compute_byoc_bonuses` over-count — uses `ROW_COUNT` which may double-count
- E04-F2 (MEDIUM): `activate_byoc_attribution` no auth guard — any authenticated user can call
- E04-F3 (LOW): Trigger naming — should be `trg_byoc_attributions_set_updated_at`

## Findings

| ID | Severity | Issue |
|----|----------|-------|
| E05-F1 | MEDIUM | Training gates use allow-by-default model — if no `provider_training_gates` row exists for a provider+SKU pair, the provider passes (treated as trained). If certain SKUs should always require training, this needs a `requires_training_gate` flag on `service_skus` to enforce deny-by-default. |
| E05-F2 | LOW | `required_score_minimum` column is unused — the table stores it (default 70), the UI displays it, but nothing enforces it. No RPC auto-completes gates when the minimum is reached. Either wire it up or clarify it's admin-controlled. |
| E05-F3 | LOW | Tier modifier is cosmetic for primary path — fetched and logged but doesn't affect primary assignment decision. Only matters in backup ordering. Acceptable behavior but worth documenting. |
| E05-F4 | LOW | Overflow notification refactored to PERFORM...FROM — functionally equivalent, just a style change. No action needed. |

## What Passed Well
- Clean append-only tier history with composite index, FK to quality snapshots, and change-only inserts
- `auto_assign_job` now composes three filters cleanly: availability block → training gate → daily capacity
- Backup ordering correctly prioritizes `tier_mod DESC → priority_rank ASC → performance_score DESC`
- UI integrates tier badge, thresholds reference, training gates (pending/completed), and tier history timeline
- `useProviderTier` hook well-structured with `TIER_CONFIG` exported for UI consistency
- Training gate trigger uses existing `set_updated_at()` — consistent with E04-F3 feedback

## Open Findings Tracker (Cumulative)

| ID | Severity | Status | Description |
|----|----------|--------|-------------|
| E04-F1 | MEDIUM | OPEN | `compute_byoc_bonuses` over-count |
| E04-F2 | MEDIUM | OPEN | `activate_byoc_attribution` no auth guard |
| E04-F3 | LOW | OPEN | Trigger naming convention |
| E05-F1 | MEDIUM | OPEN | Allow-by-default training gates |
| E05-F2 | LOW | OPEN | Unused `required_score_minimum` |
