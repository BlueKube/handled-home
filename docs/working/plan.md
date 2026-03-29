# Plan: PRD-001 — Edge Function Security Hardening

> **PRD:** `docs/working/prd.md`
> **Execution mode:** Quality
> **Branch:** `feat/001-edge-function-security`

---

## Session Handoff
- **Branch:** claude/add-documentation-workflow-OppGZ
- **Last completed:** PRD-006 (Customer Dashboard & Subscription UX — reviewed ✅)
- **Last completed (updated):** PRD-009 (Admin fixes — reviewed ✅)
- **Last completed (updated 2):** PRD-011 (Design System — previewRole fix, reviewed ✅)
- **Next up:** PRD-012 — Payment & Critical Path Test Coverage
- **Note on PRD-010:** Referrals page already has milestones, share code, credits summary. Social proof counter ("X neighbors") needs backend zone density data. Share pre-written text needs native platform integration. Deferred as enhancement. [OVERRIDE: deferred PRD-010 — page is functional, social proof and native sharing require backend/native work]
- **Note on PRD-008:** Provider Dashboard already uses first name greeting, Performance screen has correct hierarchy (score banner → streak → stats → metrics → SLA), null states follow correct convention (0 for counts, — for percentages). Audit findings were test-data artifacts. [OVERRIDE: skipped PRD-008 — implementation already correct, same pattern as PRD-004/005]
- **Note on PRD-007:** Services Catalog page already uses category icons, search, grouping, and sheet detail view — not the raw photo-tile grid the audit described. Adding plan context badges requires a data join not yet in useSkus hook. Deferred as enhancement. [OVERRIDE: deferred PRD-007 — page is functional, plan context badges require non-trivial data layer work]
- **Note:** PRD-004 (Photo Timeline) and PRD-005 (Activity Screen) were found to be already properly implemented during investigation. The audit findings were based on empty-data screenshots, not code deficiencies. Both have proper empty states, loading skeletons, stats pills, value cards, and tap-to-expand interactions. [OVERRIDE: skipped PRD-004 and PRD-005 — implementation already matches spec; audit findings were data-state artifacts, not code issues]
- **Context at exit:** 40% — user paused to handle Lovable/Supabase TODO items
- **Blockers:** Human setting CRON_SECRET + pg_cron config in Supabase (see TODO.md + DEPLOYMENT.md)
- **Retroactive review:** Complete — all MUST-FIX and SHOULD-FIX findings from 5-lane review resolved
- **PRD queue:** 11 PRDs remaining in docs/upcoming/FULL-IMPLEMENTATION-PLAN.md
- **Deferred from PRD-001:** Seed data extraction from migration 20260322 (complex, risk of breaking db push)
- **Strategic note from user:** Do NOT remove features for MVP. Fix and harden existing features rather than cutting scope. AI coding velocity makes feature completeness feasible. Focus on making everything work end-to-end and adding intelligence to reduce human ops burden.

---

## Phase 1: Edge Function Security Hardening

All batches are in a single phase — this is a security hardening pass, not a feature build.

### Batch Breakdown

| Batch | Title | Size | Status | Context |
|-------|-------|------|--------|---------|
| B1 | Create shared `_shared/` utilities (auth, CORS, deps) | S | ✅ | |
| B2 | Fix Stripe webhook signature bypass | S | ✅ | |
| B3 | Add CRON_SECRET to 19 unauthed scheduled functions | L | ✅ | |
| B4 | Restrict send-email + fix remaining auth issues | S | ✅ | |
| B5 | Fix BYOC enumeration + auth bootstrap + seed data | M | ✅ (seed extraction deferred) | |

### Dependencies
- B2, B3, B4 all depend on B1 (they import from `_shared/`)
- B5 is independent of B2-B4 (different files)
- B3 is the largest batch (19 functions to update)

### Risk Areas
- `CRON_SECRET` must be added to Supabase environment secrets before scheduled functions will work. Add to `docs/upcoming/TODO.md`.
- BYOC RLS change requires careful testing — the activation flow must still work for anonymous invite lookups via RPC.
- Seed data extraction from migration is a schema-level change — must not break `supabase db push`.

### Deferred Items
- Pinning all Edge Function dependency versions (Deno std, Stripe SDK, Supabase-js) — tracked but deferred to avoid scope creep. Note in `lessons-learned.md`.
- CORS origin allowlist specifics — will use a reasonable default; production origins TBD.

---

## Review Configuration

| Batch | Size | Review Agents |
|-------|------|--------------|
| B1 | S | 2 (1 combined reviewer + 1 synthesis) |
| B2 | S | 2 (1 combined reviewer + 1 synthesis) |
| B3 | L | 5 (3 parallel lanes + 1 Sonnet synthesis + 1 Haiku synthesis) |
| B4 | S | 2 (1 combined reviewer + 1 synthesis) |
| B5 | M | 4 (3 parallel lanes + 1 synthesis) |
