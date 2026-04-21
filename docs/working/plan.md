# Round 64.5 — Supabase Self-Host Migration (Unblocker)

> **Branch:** `claude/supabase-self-host-migration`
> **Scope doc:** `/root/.claude/plans/i-used-the-new-nifty-avalanche.md` (approved plan)
> **Reason:** Lovable Cloud lost the GitHub connection to this repo and can no longer apply migrations. Migrating Supabase onto the user's own account so Claude Code can apply migrations directly via the Supabase CLI. Unblocks Round 64 Phases 2–8.
> **Status:** Phases B-1, B-2, C-1, C-5 complete (schema on new project; storage buckets in place). Blocked on user-supplied credentials for C-2 (Lovable direct DB URL) and C-4 (Stripe/Resend/OpenWeather/CRON_SECRET).

---

## Round 64.5 Progress

| Phase | Title | Owner | Status | Notes |
|-------|-------|-------|--------|-------|
| A | User prereqs — 5 credentials + dashboard config | User | ⬜ blocked | See `docs/upcoming/TODO.md` "Round 64.5" section |
| B-1 | Install Supabase CLI in sandbox | Claude | ✅ | v2.90.0 at `/usr/local/bin/supabase` |
| B-2 | `supabase login --token` + `supabase link` | Claude | ✅ | Project linked to `gwbwnetatpgnqgarkvht` (Handled Home, us-west-1). `supabase/.temp/linked-project.json` created. |
| C-1 | Apply all 198 migrations to new project | Claude | ✅ | Applied via Management API fallback (see OVERRIDEs). 198/198 recorded in `supabase_migrations.schema_migrations`. 187 public tables, 368 functions, 438 RLS policies. |
| C-2 | Full data migration (pg_dump or CSV fallback) | Claude | ⬜ | Blocked — needs `LOVABLE_DIRECT_DB_URL` from user OR CSV export path. Not yet attempted. |
| C-3 | Deploy 39 edge functions | Claude | ⬜ | `supabase functions deploy` uses HTTPS Management API — should work from this sandbox. |
| C-4 | Re-add secrets to new project | Claude | ⬜ | Blocked — needs `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `RESEND_API_KEY`, `OPENWEATHER_API_KEY`, `CRON_SECRET` from user. |
| C-5 | Verify storage buckets (job-photos, provider-documents) | Claude | ✅ | Confirmed 4 buckets created by migrations: `job-photos`, `provider-documents`, `sku-images` (public), `support-attachments`. |
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

- `[OVERRIDE: supabase db push — sandbox cannot reach Postgres pooler (port 5432/6543 blocked) or IPv6-only direct DB host; applying 198 migrations via Management API /database/query endpoint over HTTPS instead. User approved 2026-04-21.]`
- `[OVERRIDE: session_replication_role=replica during migration body — several seed-data migrations (e.g. 20260223032019, 20260223034117, 20260309080000_seed_demo_data) insert rows that reference zones/properties/users created only by the later 20260322000000_fix_test_users_and_seed_metro migration. Applying in strict chronological order violates FKs. Using SET LOCAL session_replication_role=replica inside each migration transaction to suppress FK/trigger enforcement during the migration body only; constraints remain defined. Safe here because (a) DDL migrations are unaffected, (b) seed data will be replaced by real data in Phase C-2, (c) live production inserts run under the default role. 2026-04-21.]`
- `[OVERRIDE: skip-execute for 20260309080000_seed_demo_data.sql — file header declares it is run via SQL editor for investor demos, contains jobs.status='CONFIRMED' which violates the CHECK constraint defined in 20260222090152 (values are NOT_STARTED/IN_PROGRESS/ISSUE_REPORTED/PARTIAL_COMPLETE/COMPLETED/CANCELED). Recorded in supabase_migrations.schema_migrations with an empty statements array so CLI history aligns. Real data comes from Phase C-2 import. 2026-04-21.]`
- `[OVERRIDE: bug-fix in 20260331200000_provider_accountability.sql — RLS policies referenced provider_members.org_id (column does not exist; it has been provider_org_id since 20260222083353). Patched two occurrences in place. Latent bug never previously exposed; migration could not have applied cleanly anywhere. 2026-04-21.]`

---

## Round 64 (paused)

Round 64 Phase 1 is complete (commits `38662b9` through `27c31c7`). Phases 2–8 are paused pending this migration. On 64.5 completion (Phase G), Round 64 resumes at Batch 2.1 per `docs/upcoming/FULL-IMPLEMENTATION-PLAN.md`.
