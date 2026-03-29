# Plan: PRD-001 — Edge Function Security Hardening

> **PRD:** `docs/working/prd.md`
> **Execution mode:** Quality
> **Branch:** `feat/001-edge-function-security`

---

## Session Handoff
- **Branch:** feat/001-edge-function-security
- **Last completed:** None (plan created)
- **Next up:** Batch 1 — Shared utilities (`_shared/`)
- **Context at exit:** —
- **Blockers:** None
- **PRD queue:** 11 PRDs remaining in docs/upcoming/FULL-IMPLEMENTATION-PLAN.md

---

## Phase 1: Edge Function Security Hardening

All batches are in a single phase — this is a security hardening pass, not a feature build.

### Batch Breakdown

| Batch | Title | Size | Status | Context |
|-------|-------|------|--------|---------|
| B1 | Create shared `_shared/` utilities (auth, CORS, deps) | S | ✅ | |
| B2 | Fix Stripe webhook signature bypass | S | ✅ | |
| B3 | Add CRON_SECRET to 19 unauthed scheduled functions | L | ⬜ | |
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
