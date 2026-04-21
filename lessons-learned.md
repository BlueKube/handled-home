# Lessons Learned & Suggestions

> **Last updated:** 2026-04-22

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

## Polish Session Lessons (2026-04-02)

### [2026-04-02] Parallel audit agents are the most efficient polish pattern
**Source:** Rounds 30-48 execution (22+ rounds, 72 fixes)
**Type:** Agent Signal
Launching 2-3 Sonnet audit agents in parallel per batch of features, then processing results sequentially, achieved ~220 features audited in one session at 55% context. Each agent costs ~0.5-1% main context (result notification only). The key efficiency: agents find the bugs, main thread just applies fixes and pushes.

### [2026-04-02] Silent data bugs are the highest-value finds in polish rounds
**Source:** Photo validation case mismatch, OpsJobs sentinel filters, PayoutRolloverCard wrong columns, HomeTimeline field names
**Type:** Workflow
4 of the top 10 bugs this session were silent data issues — queries returning 0 rows or wrong fields with no error, making UI appear empty/broken. These are invisible without reading the actual code and cross-referencing DB schema. Pattern: any Supabase query with `as any` cast should be verified against the types file.

### [2026-04-02] `isError` is the most common missing state across the codebase
**Source:** 25+ pages fixed
**Type:** Agent Signal
The single most common finding across all 22+ rounds was missing `isError` handling on `useQuery` results. Pages showed infinite loading skeletons or misleading empty states on network failure. A codebase-wide grep for `const { data, isLoading }` (without `isError`) would catch most remaining instances.

### [2026-04-02] Dark-mode violations cluster in admin pages and status badges
**Source:** 8 dark-mode fixes across CronHealth, OpsJobs, AiInsightsCard, ProviderAccountability, Apply, ApplicationDetail, OpsExceptionQueue, OpsExceptionDetailPanel
**Type:** Agent Signal
Customer-facing pages consistently use semantic tokens (`text-success`, `text-destructive`). Admin pages more often use raw Tailwind (`text-green-600`, `text-amber-600`, `bg-green-100`) because they were built faster with less design review. Future polish should grep for `text-green-|text-red-|text-amber-|bg-green-|bg-red-` in `src/pages/admin/`.

### [2026-04-02] Parallel audit agents + targeted error-state fixes are the most efficient polish pattern
**Source:** Rounds 51-60 polish session (38 fixes, 34 files, 12 batches)
**Type:** Agent Signal
Launching 4-5 audit agents in parallel (edge functions, platform infra, testing/legal, design/UX) while processing earlier results produced maximum throughput. The single most common finding across all audits was missing `isError` handling — 22 pages fixed in this session alone. A codebase-wide grep `grep -rl "isLoading" src/pages/ | while read f; do if ! grep -q "isError" "$f"; then echo "$f"; fi; done` is the fastest way to find remaining gaps.

### [2026-04-02] Browse page ZIP check was fake — always showed "expanding to new areas"
**Source:** Round 55 audit (testing & legal)
**Type:** Workflow
The Browse page's ZIP coverage check (`handleCheckZip`) was a no-op that always set `zipChecked = true` with no actual zone lookup. In-market users entering valid ZIPs were told "we're expanding" — potentially deterring signups. Fixed by querying `zone_zips` table. Lesson: public-facing pages need functional verification, not just visual audits.

### [2026-04-02] BundleSavingsCard parsed "$149/4 weeks" as $1494
**Source:** Round 57 audit (UX value proposition)
**Type:** Agent Signal
`parseInt(planDisplayPrice.replace(/[^0-9]/g, ""), 10)` strips ALL non-digits, so "$149/4 weeks" becomes "1494". Fixed with `/\$(\d+)/` regex match. Any price-parsing code should be reviewed for multi-digit format strings.

### [2026-04-03] Cross-referencing academy content against code catches operator-misleading errors
**Source:** Round 62 academy audit (12 modules fixed, 16 audited)
**Type:** Workflow
The most impactful errors found: dunning ladder had wrong day numbers (operators would tell customers "day 21" when the actual final step is day 14), zone health table described 5 columns that don't exist in the code (operators looking for NPS and Response Time columns that aren't there), payout threshold was $25 in training but $50 in code, and the first-week module described a navigation structure ("Dispatch, Providers, Zones, Reports, Settings") that bears no resemblance to the actual sidebar. Rule: always cross-reference training content against the actual codebase — errors in training are higher-cost than errors in code because operators internalize them as truth.

### [2026-04-03] The single biggest billing bug was a status enum mismatch
**Source:** Round 62 Batch 8 — apply_referral_credits_to_invoice
**Type:** Architecture
`apply_referral_credits_to_invoice` checked for `status = 'PENDING'` but `generate_subscription_invoice` creates invoices as `'DUE'`. Credits were NEVER auto-applied — the entire credit system was silently broken. One SQL change (accept `DUE` invoices) unblocked both customer credits and referral reward application. Lesson: any function that filters by status enum should be verified against every caller that sets that status.

### [2026-04-03] Cron registration is the most commonly forgotten infrastructure step
**Source:** Round 62 Batch 5-7 — 7 edge functions deployed but never scheduled
**Type:** Architecture
All 7 automation engine functions (assign-visits, check-no-shows, check-weather, evaluate-provider-sla, run-billing-automation, run-dunning, weekly-payout) were fully implemented and deployed but had zero `cron.schedule()` calls. None of them would ever run autonomously. This is a pattern: deploying a function is not the same as scheduling it. Future edge functions should have cron registration as part of the deployment checklist.

### [2026-04-20] Lovable owns Supabase migrations — the agent writes files, not applied state
**Source:** Round 64 Phase 1 (user clarification during Batch 1.3)
**Type:** Workflow
The agent writing `supabase/migrations/*.sql` does not apply them to the live DB. Lovable handles the Supabase connection and must be asked explicitly to apply new migrations and regenerate `src/integrations/supabase/types.ts`. Without this step, the next phase's TS code can fall out of sync (hooks using `as any` won't get tightened types, new RPCs aren't callable in types even if the codegen is deferred). Always add Lovable-migration-apply items to `docs/upcoming/TODO.md` at the end of each phase that writes migrations, listing the exact migration filenames and a "why it blocks the next phase" note.

### [2026-04-20] Stream idle timeouts on single Write calls over ~400 lines
**Source:** Round 64 FULL-IMPLEMENTATION-PLAN.md authoring
**Type:** Agent Signal
A single `Write` tool call producing ~500+ lines of content hit `Stream idle timeout - partial response received` twice before I chunked it. Breaking into an initial Write (~80 lines) plus 7 sequential `Edit` passes with unique trailing-context anchors succeeded every time. Rule: for any output expected to exceed 300 lines, plan for an append pattern (Write skeleton → Edit sentinel → Edit sentinel → …). Saves a retry loop and avoids partial-file states between a failed stream and a fresh attempt.

### [2026-04-20] Context usage is overestimated by ~2× in Claude Code UI — confirmed empirically
**Source:** Round 64 Phase 1 session tracking
**Type:** Agent Signal
CLAUDE.md §8b flags this. Verified: during Round 64 Phase 1 I felt near capacity but `/context` showed 48% actual; after another full batch + review agents it was 53%. Tentative calibration: when I self-estimate "~65% reported," actual is closer to 30–35%. Rely on `/context` before session-boundary decisions, not on self-assessment. Particular pitfalls: large user pastes (~100k tokens each) feel small mid-turn but dominate the total.

### [2026-04-20] Tailwind token typos don't fail the build — silent no-op classes
**Source:** Round 64 Batch 1.3 Lane 2 review
**Type:** Agent Signal
`bg-warn/10 text-warn` rendered with no background and no foreground color — the "catch-all" badge was invisible. Tailwind's JIT silently drops unknown class names rather than erroring. The project uses `warning`, not `warn`. `npm run build` passes either way. Lesson: visual-regression screenshots are the only reliable catch; a quick grep for `bg-[a-z]+/\d+` and cross-check against `tailwind.config.ts` tokens is a cheap pre-commit check worth adding.

### [2026-04-20] Radix Select + null state needs a sentinel value, not empty string
**Source:** Round 64 Batch 1.3 Lane 2 review
**Type:** Agent Signal
Radix UI's Select rejects `""` as a SelectItem value but will accept it on the root Select (triggering placeholder render). The `size_tier` select used `__none__` sentinel mapped to null on change; the `plan_family` select used `""`. Works in both cases but inconsistent. Review found it; aligning to `__none__` throughout is cleaner. Pattern for any nullable enum-select: always define a reserved sentinel string and map it to null in the onChange handler. Document the pattern once in `design-guidelines.md` and the drift disappears.

### [2026-04-20] npm run build gate is redundant on schema-only or TS-only batches
**Source:** Round 64 Phase 1 workflow friction
**Type:** Workflow
`npx tsc --noEmit` takes ~5s; `npm run build` takes ~30s and produces a bundle that gets thrown away. For batches that change only migrations or only hook types (no new Vite entries, no routing, no dynamic imports), tsc is sufficient. Reserve the full build for batches that change routes (`src/App.tsx`), lazy imports, vite config, or new components consumed via dynamic import. Documented as `[OVERRIDE: skipped npm run build — TS-only batch]` in commit messages.

## Round 64.5 Lessons (2026-04-21) — Supabase Self-Host Migration

### [2026-04-21] Supabase pooler is blocked from the Claude Code sandbox; Management API is the end-run
**Source:** Round 64.5 Phase C-1 (applying 198 migrations to the new project)
**Type:** Infrastructure
`supabase db push` requires a live connection to the session pooler on port 5432/6543. The sandbox allowlist permits `api.supabase.com` (HTTPS) but blocks `aws-*.pooler.supabase.com`. The workaround is POSTing SQL to `https://api.supabase.com/v1/projects/$REF/database/query` — it accepts arbitrary SQL including DDL and seed inserts, and returns structured results. Rule for migration work: if the CLI hangs on a network error, don't debug it — pivot to the REST endpoint or the Supabase MCP `apply_migration` tool, both of which are HTTPS. Also applies to pg_dump from legacy projects: the sandbox cannot reach any pooler, so data migration either goes through Management API `execute_sql` or happens on the user's local machine.

### [2026-04-21] Supabase Cloud locks `ALTER DATABASE` from the postgres role — use Vault for cron service_role_key
**Source:** Round 64.5 Phase C-6 (pg_cron repoint failed, rescoped mid-phase)
**Type:** Architecture
The original plan was `ALTER DATABASE postgres SET app.settings.service_role_key = ...` to mirror the old project's cron pattern. Supabase Cloud now returns `ERROR 42501: permission denied` from both the Management API AND the dashboard SQL editor — the `postgres` role lost this privilege sometime in 2024-2025. The working pattern is `vault.create_secret(<key>, 'service_role_key')` plus a SECURITY DEFINER helper (`cron_private.invoke_edge_function`) that reads from `vault.decrypted_secrets` at cron execution time. Works under the locked privilege model, keeps the secret out of migration files, and passes the URL in as a plain string (URLs aren't secrets). Any cron job registered today should go through the helper, not inline `current_setting('app.settings.*')`.

### [2026-04-21] Vite env var precedence: shell env > `.env.*` files
**Source:** Round 64.5 Phase D-3 / F reasoning
**Type:** Architecture
Vite loads `.env` files via `dotenv`, and dotenv does not overwrite already-set environment variables. That means Vercel's injected env vars (Production/Preview/Development scopes) always beat whatever's committed to `.env`. Practical consequence: the committed `.env` is a *fallback*, not a source of truth — production can target a completely different Supabase project than the committed `.env` says, and nothing will warn you. When cutting over projects, keep the committed `.env` aligned with Vercel's Production vars as a hygiene measure, even if the runtime is already correct. The drift otherwise bites the next developer who clones the repo and runs `npm run dev` without setting env vars.

### [2026-04-21] Sandbox network allowlist is narrow — plan tooling around it
**Source:** Round 64.5 Phase E (Vercel token test + weatherapi.com validation)
**Type:** Infrastructure
Confirmed reachable from sandbox: `api.supabase.com`, `api.anthropic.com`, `api.github.com` (via MCP). Confirmed blocked: `api.vercel.com`, `*.vercel.app`, `handledhome.app` (resolves to Vercel), `api.weatherapi.com`. Tokens for blocked hosts still get saved for when the user runs Claude Code locally, but the CLI or direct curl will fail with `HTTP 403 Host not in allowlist` from the sandbox. Design implication: treat Vercel-side operations (env vars, redeploys, logs) as user-escalated by default. Supabase-side operations are fully autonomous. Round out the autonomy gap by leaning on the GitHub↔Vercel auto-deploy — pushing to `main` is equivalent to triggering a Vercel deploy from the sandbox's perspective.

### [2026-04-21] Stripe's 2025 API retired `transfer.paid` and `transfer.failed` — use `transfer.created` + `transfer.reversed`
**Source:** Round 64.5 Stripe webhook destination setup (user couldn't find the events in the picker)
**Type:** Architecture
On Stripe API version `2025-08-27.basil` and later, transfers to connected accounts are atomic — the old `transfer.paid` (money landed) and `transfer.failed` (money bounced) events are gone. `transfer.created` carries the same terminal semantic as the old paid event; `transfer.reversed` replaces failed. Any handler listening on the retired names will never fire. Code fix is a 2-line case label rename, behavior identical. Whenever Stripe's event picker shows fewer events than the handler expects, check the changelog before assuming a UI bug — they consolidate events across API versions.

### [2026-04-21] Google Cloud "Authorized domains" only accepts domains you own; Supabase callback URL goes in the OAuth client, not the consent screen
**Source:** Round 64.5 Google OAuth setup
**Type:** Workflow
The OAuth Consent Screen's **Authorized domains** field is for "top private domains" you control — `supabase.co` is rejected because you don't own it. The Supabase auth callback (`https://<ref>.supabase.co/auth/v1/callback`) goes in the OAuth Client's **Authorized redirect URIs**, a separate page. Two fields, two purposes, same-looking UI. For the consent screen, add only your owned domains (e.g., `handledhome.app`); for the client, add localhost + prod domain + prod `www` as JavaScript origins, and Supabase callback as the redirect URI.

### [2026-04-21] Resend API keys can only be revealed at creation — no retrieval, no recovery
**Source:** Round 64.5 Phase C-4 (user couldn't view existing Resend key)
**Type:** Workflow
Resend's dashboard and API both hard-refuse to return stored key values once the creation modal closes. If the key wasn't saved immediately, the only path forward is delete + create new. Same pattern is standard for most modern SaaS API keys (Stripe live keys, Twilio auth tokens, etc.) — plan to capture keys at creation-time into a password manager or secrets file, don't count on retrieving them later. Worth putting into the user-facing TODO as an explicit instruction when asking for any API key.

### [2026-04-21] Claude.ai Connectors ≠ Claude Code MCP — different runtimes, different registration paths
**Source:** User confusion after seeing Claude.ai Directory listing
**Type:** Workflow
The "Connectors" Anthropic exposes in claude.ai Settings (Vercel, Supabase, GitHub, Gmail, etc.) run in Anthropic's infrastructure and only apply to web/desktop claude.ai conversations. Claude Code in the terminal does NOT see them. Claude Code's equivalent is MCP servers declared in `.mcp.json` (project-scoped) or `~/.claude.json` (user-scoped) — these get spawned as subprocesses by Claude Code and expose their tools in the current CLI session. Connecting both sides is fine (they're free and harmless) but they don't substitute for each other. Future sessions that need tool access should check `.mcp.json` first, not assume a Claude.ai Connector carries over.

### [2026-04-21] Supabase MCP > curl for structured operations, but CLI is the escape hatch for weird ops
**Source:** Round 64.5 MCP install + usage pattern
**Type:** Agent Signal
Added `@supabase/mcp-server-supabase` to `.mcp.json` mid-round. Across the remaining work, MCP tools (`execute_sql`, `apply_migration`, `get_advisors`) eliminated ~6 JSON-escape dances around `curl -d '{"query": ...}'`. CLI stayed useful for `functions deploy --use-api` (MCP version exists but CLI handles multi-file `_shared/` uploads more reliably) and for `secrets set` with many keys at once. Rule: install the MCP as soon as the project is stable enough to have a known project-ref; keep the CLI for bulk ops and anything the MCP doesn't expose.

### [2026-04-21] `.env` was tracked in git from Lovable import — gitignore rule applied after initial commit has no effect
**Source:** Round 64.5 Phase F pre-flight check
**Type:** Security
`.env` is in `.gitignore` but also in `git ls-files .env`, because the initial Lovable "Add files via upload" commit included it. Gitignore only applies to UNTRACKED files; once tracked, it keeps tracking. Not a live leak since the committed values are publishable keys only, but worth a `git rm --cached .env` + recommit at some point. Generalization: on any project imported from another platform, run `git ls-files | xargs git check-ignore 2>/dev/null | grep -v 'not ignored'` (or the inverse) to find this category of drift. The .env case here was caught by coincidence during the cutover commit — it could easily have sat unchecked for months.

### [2026-04-21] The `[object Object]` error message is a pre-existing JS `catch(err)` bug pattern
**Source:** `check-weather` smoke test after WEATHER_API_KEY was set
**Type:** Agent Signal
When an edge function catches an error and stringifies it via `JSON.stringify(err)` or `` `${err}` ``, Error instances serialize to `"[object Object]"` because their enumerable properties are empty. Needs `err instanceof Error ? err.message : JSON.stringify(err, Object.getOwnPropertyNames(err))`. Classic pattern worth a codebase-wide grep + fix sweep. Not blocking for the migration, but any function with this pattern loses useful diagnostics on every real error.

## Round 64 Phase 2+3 Lessons (2026-04-22) — Variant Pricing + Credits UX

### [2026-04-22] Shared react-query keys with drifting Map value shapes cross-contaminate silently
**Source:** Batch 2.2 Lane 2 review — MUST-FIX on `plan_handles_all`
**Type:** Architecture
Three screens (`PlanStep.tsx`, `Plans.tsx`, `PlanActivateStep.tsx`) all use `queryKey: ["plan_handles_all"]` but populated the Map with different value shapes: full row, partial row, or bare `handles_per_cycle` number. Because react-query shares the cache across screens, whichever one loads first wins — the second screen crashes on `.handles_per_cycle` against a number, or `.get(id)` returns a stripped object. Build passes in isolation; the crash only appears on navigation. Rule: when multiple files share a query key, the queryFn return shape is a public contract. Either align all producers to the richest shape (fix used here — match Plans.tsx's full row) or narrow the key (e.g., `["plan_handles_all", "numbers"]`). A project-wide grep for shared query keys at batch-review time catches this cheaply.

### [2026-04-22] Stripe webhook dedupe pre-commits the event → paid-but-no-credits is a real failure mode
**Source:** Batch 3.3 Lane 2 synthesis (real bug risk found before shipping)
**Type:** Architecture
`stripe-webhook/index.ts` inserts `payment_webhook_events` with `processed: false` *before* the switch runs. If the switch fails mid-case (RPC error, malformed metadata), Stripe retries — but the retry's insert hits `23505` on `processor_event_id` and returns `{duplicate: true}` status 200. Net result: the customer is charged, no credits granted, no retry possible. Fix pattern used for Batch 3.3: every terminal failure in a money-moving branch writes a `billing_exceptions` row (severity=HIGH) with a specific `type` tag so ops can reconcile manually. Fundamental fix would be making the dedupe transactional with the side effects, but that's a webhook-wide rewrite — the billing_exceptions escape valve is cheaper and equally safe.

### [2026-04-22] jsonb metadata bags need shallow-merge semantics, not replace
**Source:** Batch 2.2 `useOnboardingProgress` refactor
**Type:** Architecture
`customer_onboarding_progress.metadata` is jsonb — intentionally flexible, with multiple steps over time stashing their own fields (`plan_variant_selection`, later `autopay_credits`, etc.). The original `upsertProgress` mutation replaced metadata wholesale, which works when only one writer exists but silently clobbers every other writer's field the moment a second writer appears. Fixed proactively by making the mutation `{ ...(existing.metadata ?? {}), ...updates.metadata }` before any second writer existed. Same fix applied in `useAutopaySettings.save`. Generalization: any hook that writes to a jsonb bag should default to shallow-merge. Rule worth adding to new-hook code review — a grep-able signal is `metadata: (updates.metadata ?? existing.metadata)` in mutation code.

### [2026-04-22] Reuse Stripe customer id from the subscription row; don't look up by email
**Source:** Batch 3.3 Lane 2 MUST-FIX on `purchase-credit-pack/index.ts`
**Type:** Security
Looking up the Stripe customer by email (`stripe.customers.list({ email, limit: 1 })`) cross-links distinct Supabase users who share an email address to the same Stripe customer — and therefore the same saved payment methods. The canonical link is `subscriptions.stripe_customer_id`, pinned at subscription creation. Fix order used: `subscription.stripe_customer_id ?? emailLookup ?? stripe.customers.create(...)`. Same principle applies to any third-party customer lookup: if the local FK is present, use it. Email-as-key is a last-resort bootstrap, not a routine path.

### [2026-04-22] Large-batch 5-agent review can be overridden when 3-lane findings are unambiguous
**Source:** Batches 2.3 + 3.3 override decisions
**Type:** Workflow
Large batches (per CLAUDE.md §5) run 3 parallel lanes + Sonnet synthesis + Haiku second-opinion = 5 agents. I overrode Lanes 4+5 twice when the 3-lane output met all three of: (a) no contradictions between lanes, (b) every finding had file:line specificity, and (c) no finding straddled lane boundaries needing synthesis mediation. Documented as `[OVERRIDE]` in each fix commit with the reasoning. When those conditions hold, synthesis agents only restate; when they don't (contradiction, ambiguity, cross-cutting issues), run the full 5. This isn't a blanket shortcut — Batch 3.3 had a Lane 2 MUST-FIX I verified against schema myself before deciding it was a non-issue, which is exactly the kind of cross-lane reconciliation synthesis normally does. If you can't do that reconciliation inline with confidence, don't skip.

### [2026-04-22] Background agents unlock parallel review + forward work
**Source:** Batch 3.4 review ran in background while Batch 3.5 was implemented
**Type:** Agent Signal
Launched Batch 3.4's combined review as `run_in_background: true`, then started Batch 3.5 implementation (which touches different files) immediately. When 3.4's review returned, the 3.5 impl was ~60% done; I applied the 3.4 fix (AutopaySection useEffect resync), then continued 3.5. Saved ~10 minutes of serial latency. Constraint that made it safe: 3.5's touched files (Dashboard, copy-sweep files) had zero overlap with 3.4's (AutopaySection, process-credit-pack-autopay). Rule: when two adjacent batches are file-disjoint, run the earlier review in background and start the next impl. When files overlap, stay serial.

### [2026-04-22] Copy sweeps need a final project-wide grep, not spec enumeration
**Source:** Batch 3.5 Lane 1 MUST-FIX — missed `Use {N} Handles` string
**Type:** Workflow
The Batch 3.5 spec enumerated exact files + line numbers for the "handles → credits" sweep. Review's Lane 1 grep ran `\bhandles?\b` across `src/pages/customer/**/*.tsx src/components/customer/**/*.tsx src/components/plans/**/*.tsx` and caught `AddonSuggestionsCard.tsx:158` — a CTA label that wasn't in the spec's line enumeration. Lesson: for copy-sweep batches, the authoritative gate is the grep across the scope, not the spec's file list. Treat the spec as a starting inventory, run the grep once you think you're done, and let the grep generate the final fix list. Saved a re-review pass by making the grep itself part of the batch's acceptance criteria (explicit in 3.5's AC #1) so review ran it too.

### [2026-04-22] Local state derived from a TanStack query needs explicit resync
**Source:** Batch 3.4 Lane 2 SHOULD-FIX — AutopaySection stale defaults
**Type:** Architecture
`useState({ enabled: settings?.enabled ?? false, ... })` runs exactly once on mount — when the TanStack query resolves later and `settings` flips from `null` → `{enabled: true, ...}`, the local state stays on the defaults. The customer sees `enabled=false` even though the server has `enabled=true` saved. Fix: `useEffect(() => setLocal({...settings}), [settings?.enabled, settings?.pack_id, settings?.threshold])` so local resyncs when deps change. Alternative is to derive directly from `settings` without local state, but that's messier with optimistic form changes. Pattern to watch for: any `useState(() => query.data?.foo ?? default)` — almost always needs a resync effect.

### [2026-04-22] Stripe webhook branching needs BOTH `mode` and `metadata.origin`
**Source:** Batch 3.3 implementation decision
**Type:** Architecture
`checkout.session.completed` fires for both subscription-create (`mode: 'subscription'`) and credit-pack top-up (`mode: 'payment'` + `metadata.origin: 'credit_pack_topup'`). Branching only on `mode` is fragile: a future flow could also use `mode: 'payment'` for a different purpose (gift cards, one-off service add-ons) and silently route through the topup handler. Require both: `session.mode === 'payment' && session.metadata?.origin === 'credit_pack_topup'`. Off-session PaymentIntent flows (Batch 3.4's autopay) follow the same pattern — every new payment path gets a unique `origin` string so the handler can't be mistaken. Also covers SCA-required `requires_action` responses: check `pi.status !== 'succeeded'` explicitly rather than assuming non-error = success.

### [2026-04-22] Static marketing data with a TODO escape hatch is pragmatic, not debt
**Source:** Batch 2.3 Browse.tsx decision
**Type:** Workflow
`/browse` is public/unauthenticated but the `plans` table RLS requires auth — so live plan data can't flow through. Two options: (a) add a public RLS policy and flip the 12 draft variants to `active`, (b) keep a hardcoded `FAMILY_SUMMARIES` constant with a TODO.md entry pointing to the future RLS/RPC decision. Chose (b) because the RLS change is a product-level policy call that shouldn't happen in a frontend batch, and the drift risk is bounded (3 prices across 3 families, visible in any marketing review). Rule: static fallbacks with a visible TODO entry are acceptable when the "make it live" decision is cross-cutting. Drop an inline code comment next to the fallback pointing to the TODO item — reviewers should never have to hunt for the context.

### Dismissed

_None yet._
