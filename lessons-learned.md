# Lessons Learned

> **Last updated:** 2026-03-28

Accumulated across all projects and sessions. Read at the start of every session.

---

## 2026-03-28 — Creator Briefs Hub (Session 1: V2 + V3)

### Workflow
- **Never skip code reviews.** Retroactive reviews on V4 found 3 MUST-FIX security bugs (RBAC bypass, missing RoleGate, Suspense layout teardown). Every review pass caught at least one real issue.
- **Apply migrations immediately.** Writing 17 migrations without applying them caused Lovable to stub 4,500 lines of working code. Rule: apply migrations or document them as blocked in TODO.md before moving to the next batch.
- **Declare review mode in the batch spec.** Add `## Review: Quality` or `## Review: Speed` to every batch spec. No implicit assumptions.
- **Take screenshots after every UI batch.** We went 4 full passes without visual verification. Light-mode colors, text truncation, and wrong CTAs accumulated silently.

### Lovable Coordination
- **Lovable stubs working code when tables don't exist.** Prevent by applying migrations before Lovable touches the codebase.
- **Lovable regenerates types.ts and removes manually added tables.** Make hooks resilient with `as any` + error fallbacks on table names rather than depending on types.ts being complete.
- **Tell Lovable explicitly what not to change.** "Don't remove the admin_roles query" had to be said 3 times. Be specific and direct.
- **Pull and review the full diff after Lovable changes,** not individual commits. Lovable often makes 5+ small commits for one logical change.

### Architecture
- **Decompose components at 300 lines, not 1,000.** AdminCreatorProfile hit 1,139 lines before we split it. Extract in the same batch, not a future PRD.
- **Consolidate constants from first use.** PLATFORM_LABELS was duplicated in 7 files. New shared values go in `src/constants/` immediately.
- **`as any` is a signal, not a solution.** Every `as any` was because types.ts was out of sync with the database. Fix the types, not the cast.

### Security
- **Never put API keys in VITE_ variables.** Client-side env vars are bundled into the browser. Any third-party API call with a secret goes in an Edge Function.
- **Default unauthenticated users to null, not a permissioned role.** Returning "operator" for no-session users bypassed every RoleGate in the app.
- **Escape user-supplied content in email templates.** The rejection reason and content URL were interpolated directly into HTML without escaping.

### Testing
- **Pure-logic tests are high-value and low-effort.** CSV export, pagination, analytics computation — no mocking needed, catches real bugs.
- **Create a `src/test/mocks/` directory upfront** with standard mocks for Supabase client, hooks, etc.
- **E2E tests need env vars documented.** Don't discover this when tests fail.

### Screenshots
- **Playwright CLI often fails in sandboxed environments.** Use the raw Chromium binary: `find / -name "chrome" 2>/dev/null` to locate it, then call directly with `--headless --no-sandbox --virtual-time-budget=8000`.
- **React SPAs need `--virtual-time-budget` flag** to give JavaScript time to render before capture.
- **Supabase env vars must be set** or React won't mount (Supabase client constructor fails silently).

### Documentation
- **Create DEPLOYMENT.md from V1.** Don't wait until V5 when everyone is confused about env vars.
- **Build the operator guide in-app** (Help page), not a separate doc. It's version-controlled and always accessible.
- **Replace placeholder READMEs immediately.** A generic README wastes every developer's first 5 minutes.

---

## 2026-03-28 — Creator Briefs Hub (Session 2: V4 + V5 + UX Polish)

### Multi-Pass Execution
- **5 full passes in one project is viable.** V1 (32 features), V2 (23), V3 (15), V4 (code health, 8 PRDs), V5 (ship readiness, 4 PRDs). Each pass had a clear theme that prevented scope confusion.
- **Hardening passes (V4, V5) are as valuable as feature passes.** V4 found 3 security bugs via retroactive reviews. V5 moved an API key from client to server.
- **The first pass should include DEPLOYMENT.md, README, and .env.example.** We created these in V5. Every developer between V1 and V5 was confused about env vars.
- **Sessions can span 1-2 full passes.** Don't restart at phase boundaries — restart at full pass boundaries or when context hits 60%.

### Code Review Findings (aggregated)
- **Reviews found real bugs every single time.** Across ~20 review cycles: RBAC bypass, missing RoleGate, Suspense teardown, XSS in emails, stale hero copy, orphaned nav links, popup blocker on mailto, missing CLOSED handler on Realtime.
- **Synthesis agents (Lane 4) correctly downgrade false positives.** Multiple Lane 2 findings scored 80+ but synthesis dropped them to 10-15 when context showed standard React behavior.
- **Lane 2 reviewers working from pseudocode summaries produce false positives.** Always pass actual diffs, not summaries.

### Lovable Coordination (extended)
- **Lovable re-stubs the same code repeatedly.** useUserRole was restored 3 times. Make hooks resilient with `as any` + error fallback.
- **Lovable's OAuth upgrade was good.** They moved Shopify from static token to Client Credentials OAuth. Not all Lovable changes are destructive.
- **Always verify Shopify store URL format.** `https://your-store.myshopify.com` (API endpoint), not `https://admin.shopify.com/store/your-store` (dashboard URL).

### UX / Visual
- **Hero CTA must match the primary user action.** All CTAs must point to the same primary action.
- **Dark mode colors need explicit audit.** `bg-green-100`, `text-green-600` are invisible on dark backgrounds. Use `bg-green-900/40`, `text-green-400`.
- **Mobile text truncation happens at `text-4xl` on 375px.** Use `text-2xl sm:text-3xl md:text-5xl` for responsive headings.
- **Orphaned legacy pages cause split user flows.** When you change the primary CTA, grep for all links to the old target.

### Cross-Repo Workflow
- **The MCP GitHub tool is scoped per session.** Multi-repo sessions need both repos configured in the task setup.
- **lessons-learned.md should live in the project root** for easy access. Keep a copy in the shared AI-workflow repo for cross-project sync.

### Context Management
- **65% context at session end is ideal.** This session covered V4+V5+UX audit+README+operator guide in one session.
- **Retroactive reviews are expensive.** Reviewing 6 skipped PRDs consumed ~15% context at once. Better to review per-batch.
- **Sub-agent reviews save main context.** Each review lane runs as a sub-agent — only the final report enters the main window.

### Infrastructure
- **Supabase Edge Functions for any API key.** Email (Resend), Shopify (OAuth) — both moved server-side.
- **Sentry init should be conditional.** No-op in development, full reporting in production.
- **Realtime subscriptions need status callbacks.** Handle SUBSCRIBED, CLOSED, CHANNEL_ERROR, TIMED_OUT.
- **`as any` on table names is acceptable when Lovable keeps removing types.** Add error fallback. Document why.

---

## Rules (derived from all lessons)

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

---

## 2026-03-28 — Creator Briefs Hub (Session 2: Late Addition)

### Cleanup
- **Full Pass Cleanup gets skipped even when documented.** 32 batch spec files sat in `docs/working/batch-specs/` through V2, V3, V4, and V5 completions. The cleanup procedure exists in both CLAUDE.md and WORKFLOW.md. It was still missed every time. The procedure needs a checklist format that's harder to skip, or a post-pass verification step: "ls docs/working/batch-specs/ — if files exist, archive them."
