# Lessons Learned & Suggestions

> **Last updated:** 2026-03-30

Accumulated across all projects and sessions. Read at the start of every session.

This file serves two purposes:
1. **Lessons learned** — What went well, what broke, and what to do differently next time.
2. **Suggestions** — Product ideas, UX improvements, workflow improvements, and agent signals surfaced during development.

---

## How to Add Entries

### Lessons
Add under the appropriate session heading with a category (Workflow, Architecture, Security, etc.). Each entry is a bold rule followed by a 1-2 sentence explanation with specific data.

### Suggestions
Add under the Suggestions section. Three types:
- **Product** — Feature ideas, UX gaps, optimization opportunities
- **Workflow** — Process improvements, review system changes, tooling ideas
- **Agent Signals** — Observations about lane effectiveness, scoring calibration, context consumption (include numbers)

Format:
```markdown
### [YYYY-MM-DD] Short title
**Source:** Where/when the idea came from (batch N, phase review, audit, etc.)
**Type:** Product / Workflow / Agent Signal
**Impact:** What business or user outcome this improves
**Effort:** Small / Medium / Large
```

---

## Rules (baseline — derived from prior projects)

1. Every batch spec must declare `## Review: Quality` or `## Review: Speed`
2. Every migration must be applied or documented as blocked before the next batch
3. Never put third-party API keys in VITE_ variables — use Edge Functions
4. Decompose components at 300 lines, not after they hit 1,000
5. Take a screenshot after every UI-changing batch
6. Pull and review the full Lovable diff before starting work
7. Default unauthenticated users to null, never to a permissioned role
8. Create DEPLOYMENT.md and a real README in the first full pass
9. Run code reviews on every batch — never skip, never defer
10. Always pass actual diffs to reviewers, not pseudocode summaries
11. Grep for all links to old targets when changing primary CTAs
12. Audit dark mode colors explicitly — light-mode values are invisible on dark backgrounds
13. Make hooks resilient to external type removal with `as any` + error fallback
14. Restart sessions at full pass boundaries, not phase boundaries
15. Full Pass Cleanup gets skipped even when documented — use a post-pass verification step

---

## Baseline Lessons (from prior projects — universally applicable)

### Workflow
- **Never skip code reviews.** Retroactive reviews found MUST-FIX security bugs every time. Every review pass caught at least one real issue.
- **Apply migrations immediately.** Unapplied migrations cause Lovable to stub working code. Apply or document as blocked in TODO.md before the next batch.
- **Declare review mode in the batch spec.** No implicit assumptions about Quality vs Speed mode.
- **Take screenshots after every UI batch.** Light-mode colors, text truncation, and wrong CTAs accumulate silently without visual verification.
- **Hardening passes are as valuable as feature passes.** Dedicated code health and ship-readiness passes find security bugs and fix infrastructure gaps.
- **The first pass should include DEPLOYMENT.md, README, and .env.example.** Don't wait until the end.
- **Restart sessions at full pass boundaries, not phase boundaries.** Sessions can span 1-2 full passes before context becomes a concern.

### Code Reviews
- **Reviews found real bugs every single time.** RBAC bypass, missing role gates, XSS in emails, orphaned nav links, missing event handlers — all caught by the review system.
- **Synthesis agents (Lane 4) correctly downgrade false positives.** Lane 2 findings scored 80+ get dropped to 10-15 when synthesis adds context.
- **Always pass actual diffs to reviewers, not pseudocode summaries.** Summaries produce false positives.
- **Retroactive reviews are expensive.** Reviewing skipped PRDs in bulk consumes ~15% context at once. Better to review per-batch.
- **Sub-agent reviews save main context.** Each review lane runs as a sub-agent — only the final report enters the main window.

### Lovable Coordination
- **Lovable stubs working code when tables don't exist.** Apply migrations before Lovable touches the codebase.
- **Lovable regenerates types.ts and removes manually added tables.** Make hooks resilient with `as any` + error fallbacks.
- **Tell Lovable explicitly what not to change.** Be specific and direct — vague instructions get ignored.
- **Pull and review the full diff after Lovable changes,** not individual commits. Lovable often makes 5+ small commits for one logical change.
- **Not all Lovable changes are destructive.** Evaluate each diff on its merits.

### Architecture
- **Decompose components at 300 lines, not 1,000.** Extract in the same batch, not a future PRD.
- **Consolidate constants from first use.** New shared values go in `src/constants/` immediately.
- **`as any` is a signal, not a solution.** Fix the types when possible. When Lovable keeps removing types, use `as any` + error fallback and document why.

### Security
- **Never put API keys in VITE_ variables.** Client-side env vars are bundled into the browser. Any third-party API call with a secret goes in an Edge Function.
- **Default unauthenticated users to null, not a permissioned role.** Returning a permissioned role for no-session users bypasses role gates.
- **Escape user-supplied content in email templates.** Never interpolate user input directly into HTML.

### Testing
- **Pure-logic tests are high-value and low-effort.** No mocking needed, catches real bugs.
- **Create a `src/test/mocks/` directory upfront** with standard mocks for Supabase client, hooks, etc.
- **E2E tests need env vars documented.** Don't discover this when tests fail.

### Screenshots
- **Playwright CLI often fails in sandboxed environments.** Use the raw Chromium binary with `--headless --no-sandbox --virtual-time-budget=8000`.
- **React SPAs need `--virtual-time-budget` flag** to give JavaScript time to render before capture.
- **Supabase env vars must be set** or React won't mount (Supabase client constructor fails silently).

### UX / Visual
- **Hero CTA must match the primary user action.** All CTAs must point to the same primary action.
- **Dark mode colors need explicit audit.** Light-mode Tailwind values are invisible on dark backgrounds.
- **Mobile text truncation happens at large font sizes on small screens.** Use responsive text sizing.
- **Orphaned legacy pages cause split user flows.** When you change the primary CTA, grep for all links to the old target.

### Infrastructure
- **Supabase Edge Functions for any API key.** All third-party API calls with secrets go server-side.
- **Realtime subscriptions need status callbacks.** Handle SUBSCRIBED, CLOSED, CHANNEL_ERROR, TIMED_OUT.

### Cleanup
- **Full Pass Cleanup gets skipped even when documented.** Use a post-pass verification step: "ls docs/working/batch-specs/ — if files exist, archive them."

### Context Management
- **65% context at session end is ideal.**
- **5 full passes in one project is viable** when each pass has a clear theme.

---

## 2026-03-29 — Handled Home (Session 1: Security + Core Loops)

### Audits
- **Screenshot-based audits overstate problems when seed data is empty.** ~5 of 12 "critical" UI/UX findings were data-state artifacts, not code deficiencies. Photo Timeline, Activity screen, Provider Dashboard, Performance screen, and Cancel button were all correctly implemented. Future audits should distinguish "code is missing this" from "test data doesn't populate this."
- **Multi-agent audits produce high volume but need synthesis.** 4 UI/UX agents + 5 gstack agents = 9 agent reports. The synthesis step (Lane 4) is essential — without it, duplicate and contradictory findings pile up.
- **gstack framework is effective for structured critique.** The 6 Forcing Questions, CEO Review scope analysis, and CSO audit all produced actionable findings. The CSO audit found 3 genuine critical vulnerabilities that needed immediate fixing.

### Security
- **Edge Functions with `verify_jwt = false` need explicit auth guards.** 19 functions were publicly callable. The `_shared/auth.ts` pattern (requireCronSecret, requireServiceRole, requireUserJwt, requireAdminOrCron) standardizes auth across all functions.
- **Stripe webhook must fail closed.** The original code accepted unsigned events as fallback. Always throw if `STRIPE_WEBHOOK_SECRET` is not configured.
- **requireCronSecret must be inside try/catch.** If it throws outside the catch block, the error becomes a generic 500 instead of a meaningful 401. The reviewer caught this.
- **previewRole should never persist in localStorage.** In-memory only prevents XSS escalation.

### Workflow
- **Never skip code reviews.** I cut corners on B2-B5 and PRD-002/003 to move fast. The retroactive review found a MUST-FIX bug (Exceptions filter rendering unfiltered list) and a SHOULD-FIX security issue (open redirect on auth page). Per-batch reviews catch these before they compound.
- **Investigate before implementing.** Reading the actual code before writing PRD fixes saved ~5 PRDs worth of unnecessary work. The audit said "rebuild Activity screen" — the code already had it built correctly.
- **OVERRIDE documentation is valuable.** Tagging skipped PRDs with `[OVERRIDE: reason]` creates a clear audit trail of scope decisions.

### Architecture
- **React.lazy code splitting is a one-line-per-import change with outsized impact.** 145 imports converted, Vite handles chunking automatically.
- **QueryClient defaults matter.** `staleTime: 0` (the default) means every navigation re-fetches everything. `staleTime: 60_000` dramatically reduces DB load with negligible UX impact.
- **Supabase joins work via PostgREST hint syntax.** `select("*, provider_orgs:provider_org_id(name)")` enriches payouts with provider names in a single query.

### Market Simulation
- **Single zones don't break even.** Fixed overhead ($1850/month) dominates revenue at <40 customers. Multi-zone amortization is the path to profitability.
- **Provider payout is the #1 economic lever.** The spread between subscription price and provider payout determines everything. At $55/job with $99 Essential plan, the spread is negative.
- **Optimized configuration: $129/$179/$279 pricing + $45/job payout + 4 zones.** Reaches -4% margin by month 12, break-even ~month 14. Total launch investment ~$21K.
- **Handle-limited job calculation matters.** Assuming 4 jobs/customer/month (unlimited) produces wildly different economics than handle-limited consumption (~2-7 jobs depending on tier).
- **The autoresearch loop works for business model optimization.** 100 experiments in <30 seconds, surfacing which assumptions matter most. Pricing sensitivity was the top finding.

## Session 3 Lessons (2026-03-30)

### [2026-03-30] Content work benefits from structured review even more than code does
**Source:** PRD-043 (Academy Content Cleanup), post-hoc editorial + fact-checker review
**Type:** Workflow
15 Academy training modules were written in a single continuous session, skipping the PRD → Plan → Batch → Review process. Two post-hoc reviews (Senior Editor + Fact Checker) caught 8 SHOULD-FIX issues that would have actively misled operators:
- **Nonexistent UI elements:** "Retry Payout" button referenced in provider-payouts.ts doesn't exist in the codebase — operators would hunt for it.
- **Factual contradictions:** Dunning Step 1 described as "auto-retry in 2 days" in exception-management.ts but "immediate retry (Day 0)" in customer-billing.ts. Probation triggers described as count-based in provider-lifecycle.ts but the codebase uses a points-based system.
- **Wrong navigation paths:** BYOP recommendations described as appearing in the Applications queue, but they live in the Growth page's BYOP Recommendation Tracker. Exception Analytics described as accessible from Ops Cockpit, but it's only reachable via the sidebar menu.
- **Incorrect terminology:** Stripe Connect account status labels used NOT_STARTED/IN_PROGRESS/ACTIVE/RESTRICTED but the codebase uses "READY".
- **Thin modules:** support-operations.ts (105 lines) and sops-playbooks.ts (97 lines) were too sparse for their topic importance — expanded by 75% and 100% respectively after review.
The cleanup PRD (PRD-043, 3 batches) took less effort than the original build but caught errors that would have trained operators on incorrect workflows. Rule: always run structured reviews on training content — the cost of a factual error in training is higher than in code because operators internalize it as truth.

### [2026-03-30] Custom review lanes work well for non-code content
**Source:** PRD-043 review configuration
**Type:** Agent Signal
Replacing standard code-review lanes (Spec Completeness / Bug Scan / Historical Context) with content-appropriate lanes (Senior Editor / Fact Checker / Synthesis) produced higher-quality findings. The Fact Checker lane caught 5 of 8 issues by cross-referencing training content against the actual codebase — something a standard Bug Scan lane wouldn't attempt on `.ts` content files. Custom lanes should be considered for any batch where the content type doesn't match the default lane focus.

## Session 4 Lessons (2026-03-31)

### [2026-03-31] Per-handle margin is always negative by design — this is not a bug
**Source:** PRD-047 B1 (Simulator Validation)
**Type:** Workflow
Revenue per handle ($6.03) < cost per handle ($7.86) means every individual service visit is a net loss. The subscription model profits from handle underutilization (break-even at 72.2%). Initial validation scripts that flag "negative margin" on every SKU are correct but misleading — the flag logic needs to account for the underutilization model rather than treating each negative-margin SKU as a problem.

### [2026-03-31] Standalone validation tools benefit from review just like production code
**Source:** PRD-047 B1 review
**Type:** Agent Signal
The B1 review found 2 SHOULD-FIX issues in a tools/ script — display logic that silently suppressed warnings, and hardcoded values that would go stale. Even non-production tooling that generates reports needs review, because misleading tool output leads to bad business decisions.

### [2026-03-31] Fact-checking reasoning reports catches margin calculation errors that would mislead pricing decisions
**Source:** PRD-047 B2 review
**Type:** Agent Signal
The B2 fact-check review found 2 MUST-FIX issues: 4 of 6 margin percentages in the underutilization table were wrong (using mixed formulas), and the consumption scenarios table had a fabricated 55% scenario not present in simulator output. At 90% utilization, the report understated the loss by 7.4 points (-17.3% vs -24.7%). For any document that will inform business pricing decisions, run a dedicated fact-checker lane that cross-references claims against actual data sources.

### [2026-03-31] NULL-inheritance columns are clean and safe for level-specific overrides
**Source:** PRD-048 B1 (Schema Enhancements)
**Type:** Architecture
Adding nullable override columns to sku_levels (presence_required, access_mode, weather_sensitive) with NULL = "inherit from parent SKU" is a clean pattern that avoids duplicating data while supporting per-level behavioral differences. Only 4 of 54 levels needed overrides (Window Cleaning L2/L3, Pest Control L2/L3), validating that the inheritance default handles 93% of cases without explicit values.

### [2026-03-31] Workflow simplification: 6 planning levels → 4, "full pass" → "round"
**Source:** Post-round workflow retrospective
**Type:** Workflow
Eliminated separate PRD files and the `docs/working/prd.md` layer. Each phase section in `FULL-IMPLEMENTATION-PLAN.md` is now a self-contained PRD — no separate file needed. Renamed "full pass" to "round" for clarity. Renamed workflow procedure headings from "Phase 0-7" to "Step 0-8" to avoid collision with implementation phases. Added glossary to both CLAUDE.md and WORKFLOW.md defining Round, Phase, Batch, and Step. Added "micro" review tier (1 agent) for mechanical batches and fact-checker lane for business-critical documents.

### [2026-03-31] 7 phases in one session is achievable at ~50% context with small batches
**Source:** Round 5 execution (Phases 1-7)
**Type:** Agent Signal
Completed 22 batches across 7 phases in a single session, reaching ~55% context. Small batches (S/Micro) with focused scope average ~2-3% context each. Reviews run as background agents and cost effectively zero main context. The 60% threshold is conservative — 55% is a safe stopping point with room for doc sync.

### [2026-03-31] Porting tools/ code to src/ for admin UI is a clean pattern
**Source:** Phase 1 (Market Simulator)
**Type:** Architecture
Copying the simulation engine from `tools/market-simulation/` to `src/lib/simulation/` with Node.js code stripped worked cleanly. The browser port runs identically to the CLI version. Key: strip CLI runners, use `Record<string,...>` instead of `Record<keyof,...>` for bounds (needed for slider iteration), and add seasonal presets inline.

---

## Suggestions

### Pending

### [2026-03-29] Screenshot-based audits need data validation step
**Source:** Session 1, post-implementation discovery
**Type:** Workflow
**Impact:** Prevents wasted implementation effort on data artifacts
**Effort:** Small

### [2026-03-29] Add social proof counter ("X neighbors in your area")
**Source:** Growth audit, PRD-010 (deferred)
**Type:** Product
**Impact:** Most powerful trust signal for neighborhood-density home services
**Effort:** Medium (needs backend zone density query)

### [2026-03-29] Services catalog needs plan context badges
**Source:** Design audit, PRD-007 (deferred)
**Type:** Product
**Impact:** Differentiates from marketplace feel, shows subscription value
**Effort:** Medium (needs useSkus → subscription data join)
**Status:** ✅ Implemented in PRD-021 (Session 2, 2026-03-30)

---

## Session 2 Lessons (2026-03-30)

### [2026-03-30] Deno tests for edge functions can only validate auth guards without staging credentials
**Source:** PRD-023 (Payment & Billing Test Coverage)
**Type:** Workflow
Edge function integration tests hit a hard boundary: without valid service role keys, tests can only verify CORS and auth rejection. Business logic coverage requires a staging Supabase instance. Plan for this in CI setup.

### [2026-03-30] Tautological health checks are worse than no checks
**Source:** PRD-026 code review (Lane 1+2 cross-validated)
**Type:** Workflow
A `>= 0` condition on a count field always passes, giving operators false confidence. Review caught it at score 75 (MUST-FIX). Health check pages need careful threshold review — every check must be capable of failing.

### [2026-03-30] Lane 3 skip rule works well for first-batch-in-phase
**Source:** PRD-026 review setup
**Type:** Agent Signal
Skipping Lane 3 (historical context) when there's no prior review history on changed files saved an agent without losing signal. Lane 2 already covers pattern detection. All 6 reviews across Session 2 found real issues; zero false-positive MUST-FIX findings.

### Promoted (moved to docs/upcoming/)

_None yet._

## Rounds 8-9 Lessons (2026-04-01)

### [2026-04-01] Review agents catch real bugs even on migration-only batches
**Source:** B7 review (Round 9 Phase 4)
**Type:** Agent Signal
The B7 reviewer caught that `select("id", { count: "exact", head: true })` returns `null` for `data` — the `count` is on a separate response field. `data?.length` silently returned 0 for all users. This would have shipped a referral progress bar permanently stuck at zero. Database-only batches still benefit from review when they include UI components.

### [2026-04-01] Two rounds in one session is achievable at ~72% context
**Source:** Rounds 8-9 execution
**Type:** Agent Signal
Completed Round 8 (10 batches, 5 phases) + Round 9 (9 batches, 6 phases) in a single session, reaching ~72% context. Total: 19 batches, 11 phases, 25 features added (454 total). Background review agents are effectively free — main context only grows from implementation work. The 60% threshold per-round is conservative; two small rounds fit comfortably.

### [2026-04-02] RLS self-referencing policies cause infinite recursion in Postgres
**Source:** B3 review (Round 10 Phase 2 — household_members)
**Type:** Architecture
A SELECT policy on `household_members` that queries `household_members` to check membership causes `ERROR: infinite recursion detected in policy`. Fix: use SECURITY DEFINER helper functions (`get_user_household_property_ids`, `is_household_owner`) that bypass RLS. This is a known Supabase multi-tenant pattern. Any table where RLS needs to self-reference requires a helper function.

### [2026-04-02] Four rounds in one session at ~41% context (reported) / actual lower
**Source:** Rounds 8-11 execution
**Type:** Agent Signal
Completed 4 rounds (34 batches, 53 features, 482 total) in a single session. `/context` showed 41% at the reported estimate but actual was lower (~36%). Small batches (S/Micro) with background review agents remain extremely context-efficient. The session covered: provider funnel build → hardening → phone/household/moving → pipeline automation. Product-design conversations between rounds don't consume meaningful context.

### [2026-04-02] Review agents catch query key mismatches that cause stale UI
**Source:** B4+B5 review (Round 10 Phase 2)
**Type:** Agent Signal
The reviewer caught that `useHouseholdInvites` invalidated `["household-members"]` but PropertyGate's query key was `["isHouseholdMember"]`. New household members would pass the RPC acceptance but still be redirected to onboarding until a manual refresh. Query key alignment across hooks that affect the same state is a recurring review-surface area.

### Dismissed

_None yet._
