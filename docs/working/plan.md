# Round 30: Routing Engine Sprint 4–6 (Features 286–305)

> **Round:** 30 of 61
> **Branch:** `claude/polish-round-12-auth-nlfDe`
> **Phase:** Single phase — Features 286–305
> **Execution mode:** Quality

---

## Audit Findings

### Issues Found (Actionable)

| # | Feature | Issue | Fix |
|---|---------|-------|-----|
| 1 | F293 | assignment_confidence and assignment_reasons stored but never rendered in admin UI | Add explainability display to visit detail (MUST-FIX) |
| 2 | F293 | useVisitAssignmentLog hook defined but unused — no page consumes it | Wire into visit detail page (MUST-FIX) |
| 3 | F305 | Duration guardrails (max_piggyback_added_minutes/percent) loaded but never enforced | Enforce at piggybacking write point (MUST-FIX — but no write point exists, see #4) |
| 4 | F305 | No code path creates a piggybacked visit (sets piggybacked_onto_visit_id) | Feature is structurally wired but non-functional (MUST-FIX — new feature, defer) |
| 5 | F301 | window_at_risk detection does NOT emit CUSTOMER_ETA_UPDATED notification | Add auto-notification on window_at_risk (MUST-FIX) |
| 6 | F296 | getCoarseBlock() splits ISO timestamp on ":" instead of using Date.getHours() — AM/PM broken | Fix to use `new Date(etaStart).getUTCHours()` |
| 7 | F294 | bg-amber-50 text-amber-700 dark-mode violation in OpsExceptionDetailPanel.tsx:131 | Replace with bg-warning/10 text-warning |
| 8 | F294 | No isError handling on OpsExceptions.tsx and Exceptions.tsx | Add QueryErrorCard with retry |
| 9 | F303 | isError never extracted from useAppointmentWindows — failures show "slots full" not error | Add isError + error card |
| 10 | F300 | isError not destructured from useProviderJobs — silent failure looks like empty state | Add isError handling |
| 11 | F287 | usePlanRunDetail imported but never called in PlannerDashboard.tsx:18 | Remove dead import |
| 12 | F286 | PlannerHorizonGrid grid-cols-7 not mobile-responsive | Add overflow-x-auto wrapper |
| 13 | F299 | DIAL_META imported but unused in Availability.tsx:17 | Remove dead import |
| 14 | F299 | Availability.tsx 566 lines — needs decomposition | Extract BlockedWindowsCard, AvailabilityHealthCard, FragmentationWarningsCard |
| 15 | F302 | SkuFormSheet.tsx 425 lines — needs decomposition | Extract PhotoRequirementsEditor, ChecklistEditor |
| 16 | F295 | Jobs.tsx 429 lines with 5 components | Extract into separate files |
| 17 | F298 | piggybacked_onto_visit_id never written by any backend function | Bundling detection missing (new feature, defer) |
| 18 | F298 | useProviderDayPlan isError not surfaced | Add error handling |
| 19 | F304 | Misleading comment on simulateRoute re: late grace | Fix comment |
| 20 | F304 | Local-vs-UTC date inconsistency in route-sequence:587 | Use setUTCHours consistently |
| 21 | F301 | proposeAction network error has no toast.error fallback in JobDetail | Add catch-path toast |
| 22 | F303 | Dead config dials (max_piggyback_*) in offer-appointment-windows | Remove unused dials |
| 23 | F297 | TodayLoadout silently returns null when no equipment | Add "No equipment needed" note |

### Already Solid (9/10+)
- F289 (9/10), F291 (9/10), F292 (9/10), F296 (9/10 except coarse block bug)

### Deferred (not polish scope — new features)
- F298: Bundling detection logic that writes piggybacked_onto_visit_id (new feature)
- F305: Piggybacking write path (new feature — no sender exists)
- F293: Full explainability UI is a significant new UI surface (but should be attempted)
- F288: Equipment kit filter not enforced in candidate selection (acknowledged v1 gap)
- F290: Backup provider not rendered in admin or customer UI (new UI)
- F294: Unassigned visit prioritization bump in queue sort (spec gap)
- F299/F302/F295: Component decomposition (>300 lines) — can do if time allows
- F301: Automated customer notification on window_at_risk (new backend feature)

---

## Batch Breakdown

| Batch | Title | Size | Files | Status | Context |
|-------|-------|------|-------|--------|---------|
| B1 | Error states + dark mode fixes | S | ~8 files | ⬜ | |
| B2 | Dead code + comment fixes | S | ~5 files | ⬜ | |
| B3 | Bug fix: getCoarseBlock ISO parsing | S | 2 files | ⬜ | |

---

## Session Handoff
- **Branch:** `claude/polish-round-12-auth-nlfDe`
- **Last completed:** Round 29. Round 30 audits complete, fixes not yet started.
- **Next up:** Implement B1 (error states + dark mode), B2 (dead code), B3 (coarse block bug)
- **Context at exit:** Early exit (user handoff). Audits completed by background agents.
- **Blockers:** None
- **Round progress:** Round 30 audits done, 0/3 fix batches complete

### What the next session should do
1. `git checkout claude/polish-round-12-auth-nlfDe && git pull`
2. Read this plan.md — all audit findings are documented above
3. Implement fixes in order: B3 (bug fix), B1 (error states + dark mode), B2 (dead code)
4. Skip deferred items (new features, decomposition unless time allows)
5. Commit, push, update feature-list.md scores, continue to Round 31

### Branch chaining note
Continue on this same branch (`claude/polish-round-12-auth-nlfDe`). All rounds chain on this single branch — do NOT create a new branch per round.

### Tooling available
- `/start-round` — Entry point, reads context and sets up round
- `/polish-round` — Batch audit command (preferred over per-feature calls)
- `/polish-feature <num> "<desc>"` — Individual feature audit (for debugging)
- `/commit-push` — Pre-validates tsc+build, commits, pushes
- `/review-batch` — Code review per CLAUDE.md Section 5
- PostToolUse hook auto-runs `tsc --noEmit` on .ts/.tsx edits
