# Lessons Learned & Suggestions

> **Last updated:** 2026-03-29

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

## Suggestions

### Pending

_No suggestions yet. Entries will accumulate as development continues._

### Promoted (moved to docs/upcoming/)

_None yet._

### Dismissed

_None yet._
