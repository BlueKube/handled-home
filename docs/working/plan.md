# Round 64.5 — Supabase Self-Host Migration (Unblocker)

> **Branch:** `claude/supabase-self-host-migration`
> **Scope doc:** `/root/.claude/plans/i-used-the-new-nifty-avalanche.md` (approved plan)
> **Reason:** Lovable Cloud lost the GitHub connection to this repo and can no longer apply migrations. Migrating Supabase onto the user's own account so Claude Code can apply migrations directly via the Supabase CLI. Unblocks Round 64 Phases 2–8.
> **Status:** Phase B-1 done (CLI installed). Blocked on user-supplied credentials (Phase A).

---

## Round 64.5 Progress

| Phase | Title | Owner | Status | Notes |
|-------|-------|-------|--------|-------|
| A | User prereqs — 5 credentials + dashboard config | User | ⬜ blocked | See `docs/upcoming/TODO.md` "Round 64.5" section |
| B-1 | Install Supabase CLI in sandbox | Claude | ✅ | v2.90.0 at `/usr/local/bin/supabase` |
| B-2 | `supabase login --token` + `supabase link` | Claude | ⬜ | Needs `SUPABASE_ACCESS_TOKEN` + project ref from Phase A |
| C-1 | Apply all 198 migrations to new project | Claude | ⬜ | `supabase db push` |
| C-2 | Full data migration (pg_dump or CSV fallback) | Claude | ⬜ | Needs Lovable direct conn string; CSV fallback if blocked |
| C-3 | Deploy 39 edge functions | Claude | ⬜ | Batch loop, honors config.toml verify_jwt blocks |
| C-4 | Re-add secrets to new project | Claude | ⬜ | `supabase secrets set` — needs Phase A values |
| C-5 | Verify storage buckets (job-photos, provider-documents) | Claude | ⬜ | Should come from migrations; confirm |
| C-6 | pg_cron repoint migration (new URLs + service key) | Claude | ⬜ | New migration file; `supabase db push` |
| C-7 | Regenerate `src/integrations/supabase/types.ts` | Claude | ⬜ | `supabase gen types typescript --project-id` |
| D-1 | Anthropic swap in `predict-services` + `support-ai-classify` | Claude | ⬜ | New `_shared/anthropic.ts` helper; model `claude-haiku-4-5-20251001` |
| D-2 | Stripe webhook URL update | User | ⬜ | User updates Stripe dashboard at cutover |
| D-3 | Prepare `.env` swap (don't commit yet) | Claude | ⬜ | Stage locally only |
| E | Smoke test via `.env.local` against new project | Claude + user | ⬜ | Sign-in flow needs user browser |
| F | Commit `.env` flip + user updates Stripe/Google | Both | ⬜ | Single commit + dashboard work |
| G | Unblock Round 64 Phase 2 (tighten `as any`, kick off Batch 2.1) | Claude | ⬜ | Last step of 64.5, first step of Round 64 Phase 2 |

---

## Session Handoff

- **Branch:** `claude/supabase-self-host-migration` (off Round 64 Phase 1 tip `27c31c7`).
- **Last completed:** Phase B-1 — Supabase CLI v2.90.0 downloaded from GitHub releases, unpacked to `/usr/local/bin/supabase`. New branch created.
- **Next up:** Phase B-2 (`supabase login` + `supabase link`). Requires the 5 credentials listed in Phase A (see `docs/upcoming/TODO.md` Round 64.5 section).
- **Context at exit:** ~55% — continuing on plan checkpoint.
- **Blockers:** **Phase A user prereqs.** Claude Code cannot create a Supabase project, generate PATs, or paste secrets into dashboards. User hand-off required before Phase B-2.
- **Round progress:** 1 / 15 phase-steps complete.

---

## Overrides

*None yet for 64.5.*

---

## Round 64 (paused)

Round 64 Phase 1 is complete (commits `38662b9` through `27c31c7`). Phases 2–8 are paused pending this migration. On 64.5 completion (Phase G), Round 64 resumes at Batch 2.1 per `docs/upcoming/FULL-IMPLEMENTATION-PLAN.md`.
