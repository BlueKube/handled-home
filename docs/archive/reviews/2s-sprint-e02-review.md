# Sprint E-02 Review — Earnings & Payout Trust

**Status**: PASS with 3 findings (1 MEDIUM, 2 LOW)

## Scope delivered

| Task ID | Description | Verdict |
|---------|-------------|---------|
| 2E-E02-01 | Day/week/month period selector with filtered queries | PASS |
| 2E-E02-02 | "At current pace" monthly projection card | PASS |
| 2E-E02-03 | Expandable earning cards with modifier breakdown | PASS |

## Findings

### E02-F1 (MEDIUM) — Old earnings query had no provider_org_id filter
**Status**: Already fixed in sprint. Both earningsQuery and payoutsQuery now include `.eq("provider_org_id", org!.id)`.

### E02-F2 (LOW) — monthProjection only accurate when period = "month"
**Problem**: When user selects Today/Week, `monthEarned` dropped to 0.
**Fix**: Added dedicated MTD query that always computes month-to-date earnings independent of period selector.

### E02-F3 (LOW) — allEarningsQuery fetches unbounded data
**Problem**: Queried all historical earnings just for balance computation.
**Fix**: Replaced with `balanceQuery` filtered to `.in("status", ["ELIGIBLE", "HELD", "HELD_UNTIL_READY"])`.

## What passed well
- Period filtering with correct date-fns boundaries (Monday week start)
- Query keys properly scoped for React Query caching
- Projection logic matches PRD: remaining jobs × 30-day avg with $45 fallback
- Expandable earning cards with base/modifier/net/hold breakdown
- No migration needed — correct decision, operates on existing tables
- PRD compliance strong across all acceptance criteria
