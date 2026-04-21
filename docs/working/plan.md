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
| C-3 | Deploy 39 edge functions | Claude | ✅ | All 39 deployed via `supabase functions deploy --use-api --jobs 4`. Verified ACTIVE on new project: 27 `verify_jwt=false`, 12 `verify_jwt=true`. Config.toml `project_id` still points at old project — will flip at Phase F cutover. |
| C-4 | Re-add secrets to new project | Claude | ⬜ | Blocked — needs `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `RESEND_API_KEY`, `OPENWEATHER_API_KEY`, `CRON_SECRET` from user. |
| C-5 | Verify storage buckets (job-photos, provider-documents) | Claude | ✅ | Confirmed 4 buckets created by migrations: `job-photos`, `provider-documents`, `sku-images` (public), `support-attachments`. |
| C-6 | pg_cron repoint (DB settings, not a migration) | User | 🟡 | Discovered: existing 7 cron jobs already use `current_setting('app.settings.supabase_url')` + `current_setting('app.settings.service_role_key')` — no URLs baked in. Just need `ALTER DATABASE postgres SET app.settings.*` values on new project. Management API postgres role lacks `ALTER DATABASE` privilege — user must run in dashboard SQL editor. See TODO.md. |
| C-7 | Regenerate `src/integrations/supabase/types.ts` | Claude | ✅ | Regen via `supabase gen types typescript --project-id` (HTTPS path, works from sandbox). +254 lines: adds `plan_variant_rules` table + `pick_plan_variant` RPC types. PostgrestVersion 14.1 → 14.5. |
| D-1 | Anthropic swap in `predict-services` + `support-ai-classify` | Claude | ⬜ | New `_shared/anthropic.ts` helper; model `claude-haiku-4-5-20251001` |
| D-2 | Stripe webhook URL update | User | ⬜ | User updates Stripe dashboard at cutover |
| D-3 | Prepare `.env` swap (don't commit yet) | Claude | ⬜ | Stage locally only |
| E | Smoke test via `.env.local` against new project | Claude + user | ⬜ | Sign-in flow needs user browser |
| F | Commit `.env` flip + user updates Stripe/Google | Both | ⬜ | Single commit + dashboard work |
| G | Unblock Round 64 Phase 2 (tighten `as any`, kick off Batch 2.1) | Claude | ⬜ | Last step of 64.5, first step of Round 64 Phase 2 |

---

## Session Handoff

- **Branch:** `claude/supabase-self-host-migration`. Pushed tip: latest commit includes Phase C-1 + C-3 + C-7.
- **Last completed (2026-04-21 session):** Phases B-2, C-1, C-3, C-5, C-7. Partial C-6 (design-wise — only DB settings left to user).
  - B-2: Linked repo to `gwbwnetatpgnqgarkvht`.
  - C-1: All 198 migrations applied via Management API fallback (3 overrides documented).
  - C-3: All 39 edge functions deployed and ACTIVE on new project.
  - C-5: 4 storage buckets confirmed present from migrations.
  - C-7: `src/integrations/supabase/types.ts` regenerated (+254 lines for `plan_variant_rules` / `pick_plan_variant`).
- **Next up:**
  - **User actions (required before C-4/D-2/F can proceed):**
    1. Provide remaining Phase A secrets: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `RESEND_API_KEY`, `OPENWEATHER_API_KEY`, `CRON_SECRET`, `LOVABLE_DIRECT_DB_URL` (for C-2).
    2. Run in Supabase dashboard SQL editor (needed for C-6 cron jobs):
       ```sql
       ALTER DATABASE postgres SET app.settings.supabase_url = 'https://gwbwnetatpgnqgarkvht.supabase.co';
       ALTER DATABASE postgres SET app.settings.service_role_key = '<SUPABASE_SECRET_KEY>';
       ```
    3. Auth provider config in dashboard (see 64.5 TODO.md) before Phase E smoke test.
  - **Claude-side next (when credentials arrive):** C-4 (secrets), C-2 (data migration — Lovable pg_dump), D-1 (Anthropic swap in predict-services + support-ai-classify).
- **Context at exit:** Check `/context` — next session should start fresh at round boundary.
- **Blockers:** Remaining Phase A user secrets + dashboard SQL for pg_cron + auth provider config.
- **Round progress:** ~8 / 15 phase-steps complete (B-1, B-2, C-1, C-3, C-5, C-7, partial C-6; ~53%).
- **Sandbox notes (for next session):**
  - Supabase CLI at `/usr/local/bin/supabase` v2.90.0 — reinstall if missing (sandbox is ephemeral).
  - Secrets at `/root/.r64_5_secrets.env` may not persist — have user re-paste if absent.
  - Migration applier at `/tmp/apply_migrations.py` is ephemeral; will need rewrite if resuming migration work.
  - Pooler/direct DB still blocked from sandbox; continue using Management API for SQL.

---

## Overrides

- `[OVERRIDE: supabase db push — sandbox cannot reach Postgres pooler (port 5432/6543 blocked) or IPv6-only direct DB host; applying 198 migrations via Management API /database/query endpoint over HTTPS instead. User approved 2026-04-21.]`
- `[OVERRIDE: session_replication_role=replica during migration body — several seed-data migrations (e.g. 20260223032019, 20260223034117, 20260309080000_seed_demo_data) insert rows that reference zones/properties/users created only by the later 20260322000000_fix_test_users_and_seed_metro migration. Applying in strict chronological order violates FKs. Using SET LOCAL session_replication_role=replica inside each migration transaction to suppress FK/trigger enforcement during the migration body only; constraints remain defined. Safe here because (a) DDL migrations are unaffected, (b) seed data will be replaced by real data in Phase C-2, (c) live production inserts run under the default role. 2026-04-21.]`
- `[OVERRIDE: skip-execute for 20260309080000_seed_demo_data.sql — file header declares it is run via SQL editor for investor demos, contains jobs.status='CONFIRMED' which violates the CHECK constraint defined in 20260222090152 (values are NOT_STARTED/IN_PROGRESS/ISSUE_REPORTED/PARTIAL_COMPLETE/COMPLETED/CANCELED). Recorded in supabase_migrations.schema_migrations with an empty statements array so CLI history aligns. Real data comes from Phase C-2 import. 2026-04-21.]`
- `[OVERRIDE: bug-fix in 20260331200000_provider_accountability.sql — RLS policies referenced provider_members.org_id (column does not exist; it has been provider_org_id since 20260222083353). Patched two occurrences in place. Latent bug never previously exposed; migration could not have applied cleanly anywhere. 2026-04-21.]`

---

## Round 64 (paused)

Round 64 Phase 1 is complete (commits `38662b9` through `27c31c7`). Phases 2–8 are paused pending this migration. On 64.5 completion (Phase G), Round 64 resumes at Batch 2.1 per `docs/upcoming/FULL-IMPLEMENTATION-PLAN.md`.
