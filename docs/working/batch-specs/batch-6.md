# Batch 6: Anti-gaming guards + evaluate() completion + final validation

## Phase
Phase 2 — D4–D7 + Anti-Gaming

## Why it matters
Anti-gaming guards prevent inflated scores from padded, duplicated, or boilerplate content. Without them, any document can score 100 by repeating keywords. The guards ensure the evaluator rewards genuine quality, not word stuffing.

## Scope
- 5 anti-gaming guards:
  1. Word-count bell curve — sweet spot 4k–10k words, penalty outside
  2. Duplicate screen detection — headings >80% similar get penalized
  3. Boilerplate detection — Jaccard >0.8 on 50+ word blocks
  4. Masterplan coherence — cross-reference provider promises in masterplan.md
  5. Flow completeness — all 10 expected flows (17–24, 34, 35) present
- `calculate_gaming_penalty(flows, all_text)` function
- Wire gaming penalty into evaluate()
- Run baseline, confirm score 55–65
- Calibrate if needed

## File targets
| Action | File |
|--------|------|
| Modify | `auto/evaluate-provider.py` |

## Acceptance criteria
- [ ] `calculate_gaming_penalty()` returns `tuple[float, list[Issue]]`
- [ ] All 5 guards implemented
- [ ] Gaming penalty wired into evaluate() composite score
- [ ] `python3 auto/evaluate-provider.py -v` produces baseline score 55–65
- [ ] Gaming penalty shows in verbose output when > 0

## Regression risks
- Must not modify D1-D7 scoring functions
