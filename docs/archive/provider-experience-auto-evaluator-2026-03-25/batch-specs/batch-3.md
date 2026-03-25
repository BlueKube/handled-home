# Batch 3: D3 (Fairness Signals) + evaluate() shell + output + CLI

## Phase
Phase 1 — Core Infrastructure + D1–D3

## Why it matters
D3 completes the high-weight dimensions. The evaluate() shell, print_results(), and CLI entry point make the evaluator runnable end-to-end, producing the first baseline score.

## Scope
- `score_d3_fairness_signals(flows, all_text)` with 5 sub-checks (2 points each):
  1. Guaranteed payout framing — predictable, guaranteed, per-job, set by SKU
  2. No-tip language — no-tip-dependency, no surprise adjustments
  3. Density messaging — route density, denser routes, less driving more earning
  4. Transparent modifiers — modifier breakdown, quality tier, rush, adjustment reasons
  5. Minimum earnings signals — minimum, floor, guaranteed minimum, base pay
- `evaluate(path, verbose)` function that:
  - Reads screen-flows.md
  - Parses flows
  - Scores D1–D3 (D4–D7 return 0.0 placeholder)
  - Computes weighted composite score (0–100)
  - Returns ScoreResult
- `print_results(result, verbose)` with YAML header + verbose bar chart + issues
- CLI entry point (`if __name__ == "__main__"`) with -v/--verbose and optional path arg
- Validate: `python3 auto/evaluate-provider.py -v` runs and produces baseline

## Non-goals
- No D4–D7 scoring (placeholder 0.0)
- No anti-gaming guards (placeholder 0.0)

## File targets
| Action | File |
|--------|------|
| Modify | `auto/evaluate-provider.py` |

## Acceptance criteria
- [ ] `score_d3_fairness_signals()` returns `tuple[float, list[Issue]]` with 5 sub-checks
- [ ] `evaluate()` reads file, parses, scores D1–D3, returns ScoreResult
- [ ] D4–D7 placeholder scores are 0.0 in ScoreResult
- [ ] `print_results()` outputs grep-friendly YAML header matching evaluate-design.py format
- [ ] Verbose mode shows bar chart and issue summary
- [ ] `python3 auto/evaluate-provider.py -v` runs without error and produces a score
- [ ] Score is partial (only D1–D3 active) — expected ~25–35 out of 100

## Regression risks
- Must not modify D1 or D2 scoring functions
