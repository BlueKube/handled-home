# Round 62: Feature Completion & Hardening — Working Plan

> **Last updated:** 2026-04-02
> **Branch:** `claude/polish-planned-features-l9XIY`
> **Plan:** `docs/upcoming/FULL-IMPLEMENTATION-PLAN.md`
> **Review tier:** Bumped +1 level (Small→Medium, Medium→Large)

---

## Progress Table

| Batch | Title | Size | Review | Status | Context |
|-------|-------|------|--------|--------|---------|
| B1 | Admin mobile hamburger menu + logout | S→M | 3L+S clean | ✅ | |
| B2 | Edge function auth hardening (4 functions) | S→M | | ✅ | |
| B3 | Wiring fixes: duplicate suppression, assignment log | S→M | | ✅ | |
| B3b | Guided Resolver + evidence replay | M→L | | ⬜ | |
| B4 | Policy engine + chargeback + dedup | M→L | | ⬜ | |
| B5 | Auto-assign + no-show detection | S→M | | ⬜ | |
| B6 | SLA enforcement + auto-flag/suspend | S→M | | ⬜ | |
| B7 | Auto-promote backup + weather mode | S→M | | ⬜ | |
| B8 | Invoice + dunning + payout automation | M→L | | ⬜ | |
| B9 | Customer credits | S→M | | ⬜ | |
| B10 | Business health gauges + risk alerts | M→L | | ⬜ | |
| B11 | SOPs → Academy consolidation | S→M | | ⬜ | |
| B12 | Push notification pipeline | S→M | | ⬜ | |
| B13 | WCAG AA + admin city launch | S→M | | ⬜ | |
| B14 | Deno integration tests | Mi→S | | ⬜ | |

---

## Session Handoff
- **Branch:** `claude/polish-planned-features-l9XIY`
- **Last completed:** B3 (Wiring fixes — duplicate suppression, assignment log union)
- **Next up:** B3b — Guided Resolver component + evidence replay in ticket detail
- **Context at exit:** ~27% (per user report)
- **Blockers:** None
- **Round progress:** Round 62 Phase 1-2 (3 batches done, audits complete for Phases 2-5)

### Audit Findings Summary (for next session)
Detailed audits completed for all remaining features. Key findings:
- **Support (#150-157):** Auto-resolve chain works but GuidedResolver component doesn't exist. Policy engine schema exists but dials never consulted at runtime. Duplicate detection writes to wrong table (fixed B3).
- **Automation (#250-257):** assign-visits and check-no-shows work but aren't scheduled in cron. Primary/backup role weighting not enforced in scoring.
- **Billing (#261,262,266):** Edge functions exist with correct logic but need cron registration verification.
- **Ops Cockpit (#235,239,240):** Business health uses fake cohort data. Loss leader tab is 100% mock data.
- **All details in audit agent outputs — re-run audits or read plan for specifics.**
