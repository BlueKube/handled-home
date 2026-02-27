# Sprint E-05 Review — Tier System + Training Gates

**Status:** PASS with 4 findings

## E-04 Finding Remediation
Not addressed in E-05; remediated in subsequent fix migration alongside 2F schema.

## Findings

| ID | Severity | Issue |
|----|----------|-------|
| E05-F1 | MEDIUM | Training gates use allow-by-default model — if no provider_training_gates row exists for a provider+SKU pair, the provider passes. Fixed: added `requires_training_gate` flag on `service_skus` to enforce deny-by-default. |
| E05-F2 | LOW | `required_score_minimum` column unused — wired up via new `evaluate_training_gates` RPC that auto-completes gates when provider quality score meets minimum. |
| E05-F3 | LOW | Tier modifier cosmetic for primary path — documented as acceptable behavior. |
| E05-F4 | LOW | Overflow notification refactored to PERFORM...FROM — no action needed. |

## What Passed Well
- Clean append-only tier history with composite index
- `auto_assign_job` composes three filters: availability → training gate → capacity
- Backup ordering: `tier_mod DESC → priority_rank ASC → performance_score DESC`
- UI: tier badge, thresholds, training gates, tier history timeline
- `useProviderTier` hook with exported `TIER_CONFIG`

## Remediation Applied
- E04-F1: `compute_byoc_bonuses` uses `GET DIAGNOSTICS` for accurate count
- E04-F2: `activate_byoc_attribution` has auth guard (admin OR provider member)
- E04-F3: Trigger renamed to `trg_byoc_attributions_set_updated_at`
- E05-F1: `requires_training_gate` column on `service_skus`, assignment engine updated
- E05-F2: `evaluate_training_gates` RPC wired to `required_score_minimum`
