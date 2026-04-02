# Round 51: Market Simulator & Calibration — Polish Plan

> **Last updated:** 2026-04-02
> **Branch:** `claude/polish-planned-features-l9XIY`
> **Round scope:** Features 348b–348e (Market Simulator) + Feature 148 (Policy Simulator)

---

## Features in Scope

| # | Feature | Current | Target |
|---|---------|---------|--------|
| 348b | Zone-level market simulation engine | 8/10 | 9/10 |
| 348c | Multi-zone combined P&L with aggregate break-even | 8/10 | 9/10 |
| 348d | Seasonal revenue modeling with market presets | 8/10 | 9/10 |
| 348e | Interactive simulation UI: sliders, charts, tables | 8/10 | 9/10 |
| 148 | Policy preview simulator | 7/10 | 9/10 |

---

## Audit Findings

### Feature 348b–348e (Market Simulator)
1. **`retention_60d_pct` metric is misleading** — `simulate.ts:204-205` divides month 2 active customers by month 1 active customers. This includes new acquisitions (BYOC, referral, organic), so the ratio can exceed 100% even with high churn. The metric name implies cohort retention but measures aggregate growth. This feeds into the composite score formula at weight 25.
2. **No error boundary** — Pure client-side computation, so no network errors, but a malformed localStorage scenario could crash. Low risk.
3. **All components well under 300 lines** — largest is PolicySimulator at 264.
4. **Dark-mode colors correct** — Charts use dark-friendly hardcoded values (#1e293b tooltips, #334155 grid).
5. **No dead code or unused imports found.**

### Feature 148 (Policy Simulator)
1. **Missing `isError` handling** — `useSupportPolicies()` hook returns `isError` but PolicySimulator only checks `isLoading`. Network failure = no feedback.
2. **`as any` cast on `dials`** — `(policy?.dials ?? {}) as Record<string, any>` at line 49. Known pattern for dynamic policy config — acceptable with documentation.

---

## Batch Plan

| Batch | Title | Size | Files | Status | Context |
|-------|-------|------|-------|--------|---------|
| B1 | Simulator engine fix + PolicySimulator error state | S | simulate.ts, PolicySimulator.tsx | ⬜ | |

---

## Session Handoff
- **Branch:** `claude/polish-planned-features-l9XIY`
- **Last completed:** Setting up plan
- **Next up:** B1 — fix retention metric + add PolicySimulator error state
- **Context at exit:** —
- **Blockers:** None
- **Round progress:** Round 51 of 61
