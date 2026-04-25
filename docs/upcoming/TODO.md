# Deferred Items — For Human Action

Items that require API keys, backend changes, or design decisions beyond frontend gap closure. These are left for the owner to complete after the automated batch work.

### 2026-04-25 — Activate `regen-types.yml` (Batch DX.1 follow-up) — 🟡 SECRET SET, RE-RUN PENDING (post-PR #37 fix)

- [x] **Add `SUPABASE_ACCESS_TOKEN` to GitHub Secrets.** ✅ Done 2026-04-25. The first activation run failed with bare `Process completed with exit code 1` (no readable stderr) — root-caused as the `npm install -g supabase@latest` install pattern. PR #37 (`4e7f58b`) replaces it with `supabase/setup-cli@v1` and adds stderr capture.
- [ ] **Re-trigger the workflow to verify PR #37's fix.** Go to https://github.com/BlueKube/handled-home/actions/workflows/regen-types.yml → `Run workflow` against `main`. Expected: ✅ success, either no PR (types already current) or auto-opened `chore/regen-supabase-types` PR (if drift exists). If still ❌, the new stderr capture surfaces the actual error via `::error::` annotation + the runner log will show `supabase --version` + the failing command's stderr inline.
  - **Why:** Future-batch ergonomics — until verified, agents may still pre-emptively write `as any` casts on new columns.
  - **Blocked:** Nothing blocked on the codebase side; just needs one manual workflow trigger.

### 2026-04-25 — Stale `supabase/config.toml` project_id (cleanup)

- [ ] **Update `supabase/config.toml:1` `project_id` from `yxhdschpeezawraqsmug` → `gwbwnetatpgnqgarkvht`.** The file still references the pre-Round-64.5 Lovable Cloud project. Per `DEPLOYMENT.md` + `.mcp.json`, the active self-hosted project is `gwbwnetatpgnqgarkvht`. Tools that read `config.toml` (CLI link, some MCP entrypoints) will target the wrong project — caught no real bug yet only because the agent has overridden via `--project-id` flags everywhere it matters.
  - **Why:** Hygiene — eliminates a foot-gun for any future `supabase link` / `supabase db pull` invocation that omits the explicit project flag.
  - **Blocked:** Nothing — one-line edit, ship in any near-future batch (or as a standalone Micro PR).
  - **Source:** Surfaced during PR #37 validation (verifying the workflow's hardcoded `PROJECT_REF: gwbwnetatpgnqgarkvht` was correct against the rest of the repo).

### 2026-04-25 — Revoke the Stitch bearer token (Batch DX.1 follow-up)

- [ ] **Revoke the Stitch token committed at `.mcp.json:7` in commits prior to DX.1.** Batch DX.1 removed the Stitch MCP entry (unused on this codebase) but the bearer token `AQ.Ab8RN6JAYVtwcil2zw5c5KSkFeelf6Q5WoLy_7FPH-S5v9_vGg` still lives in git history. Treat as burned: revoke at the Stitch console.
  - **Why:** Standard secret-hygiene per lessons-learned.md ("Resend (and most modern SaaS) API keys are revealed only at creation"). Token was in plaintext on a public/private repo for several months.
  - **Blocked:** Nothing — this codebase doesn't use Stitch, so the revocation has no functional impact.

### 2026-04-24 — Anthropic API credit balance — ✅ RESOLVED on 2026-04-24 (verified via PR #28 CI)

> **Final status:** Resolved. PR #28's CI (run `24877301683`, commit `76846df`) produced the first real Sarah-persona scores on this repo: Customer avgClarity 4.7, avgTrust 3.7, avgFriction 7.1 (all three advisory-flagged per the T.3 thresholds, consistent with the un-onboarded test-user state). Provider and Admin rows correctly stay at `—` until role-specific milestone captures land in future batches. The T.6 🛑 error banner did not fire — the graceful-degradation path correctly yielded to the happy path once credits were live.
>
> **Root cause:** The first credit top-up landed on a different Anthropic workspace than the one that issued `ANTHROPIC_API_KEY` in GH Secrets. After the key was rotated to match the funded workspace, the next CI run lit up. End-to-end Tier 5 loop validated across T.6 (model-ID fix + error surface), T.7 (diagnostic demotion), and T.3 (threshold advisory).

- [x] **Refill credits on the Anthropic account backing `ANTHROPIC_API_KEY` in GH Actions Secrets, or rotate to a funded key.** ✅

### 2026-04-23 — Demote T.6 diagnostic after first clean Tier 5 run (T.6 follow-up) — 🟡 SHIPPED in Batch T.7 (PR #26), awaiting CI confirmation

- [x] **Demote the T.6 diagnostic steps once PR #25 posts real Sarah scores.** Batch T.6's spec (Goals section) planned to demote the `ls -R test-results/` inventory + artifact round-trip from `if: always()` to `if: failure() || env.ACTIONS_STEP_DEBUG == 'true'` once the Tier 5 artifact flow is proven, keeping only a single "milestones present: yes / N files" summary line in the always-on path. The demotion didn't ship in T.6 itself (we needed the diagnostic loud to confirm the model-ID fix landed). Do this as a tiny follow-up batch (T.7 or fold into any near-future CI change) so the PR comment doesn't carry the 4 `<details>` blocks forever.
  - **Why:** Leaves the PR comment cleaner for day-to-day merges; the diagnostic stays available on-demand via `ACTIONS_STEP_DEBUG`.
  - **What to do:** flip `if: always()` → `if: failure() || env.ACTIONS_STEP_DEBUG == 'true'` on the `Tier 5 milestone-flow diagnostic` steps in both jobs; keep the artifact upload + `Collect T.6 diagnostic body` step for when `ACTIONS_STEP_DEBUG` is set; add a short 1-line summary ("milestones present: N/7 files") to the always-on path.
  - **Blocked:** Nothing blocked — wait for PR #25's CI to post non-`—` scores so we know the flow works, then demote in a separate small PR.
  - **Source:** T.6 reviewer flagged this as a SHOULD-FIX (score 30) because the spec promised the demotion and no persistent follow-up existed.

### 2026-04-23 — Tier 5 milestone artifact flow (T.4 follow-up) — 🟡 FIX SHIPPED in T.6 (PR #25), awaiting CI confirmation

- [ ] **Debug why captures don't reach the AI judge.** Root cause was NOT artifact-flow related — T.6's diagnostic (rendered directly into PR #25's status comment via `t6-diagnostic-*` artifacts) confirmed milestones reached ai-judge intact (7 PNGs + manifest.json post-download across all 3 matrix shards). The break was that `scripts/generate-synthetic-ux-report.ts` defaulted to the stale model ID `claude-sonnet-4-20250514`; every Anthropic call 404'd, the blanket try/catch silently fell back to scaffold mode that doesn't write `ux-review-scores-*.json`, and the PR comment's "no screenshots captured" footnote fired for this scenario as well as for the genuinely-empty case. Fix shipped in commit `0eba41f`: all three AI-eval scripts now default to `claude-haiku-4-5-20251001` (matches `supabase/functions/_shared/anthropic.ts`), plus the error surface is hardened so a future silent AI crash writes a visible `ux-review-report-${role}-error.json` and surfaces a 🛑 line in the PR comment with the exact model + error. Mark this item resolved once PR #25's CI posts non-`—` scores in the Customer row. Lessons captured in `lessons-learned.md` under § Workflow & process (silent try/catch; diagnostic routing; edit-in-place comment webhook trap).

### 2026-04-23 — Tier 5 milestone capture (T.3 follow-up) — 🟡 FIX SHIPPED in T.6 (PR #25), awaiting CI confirmation

- [ ] **Make the AI judge actually see our UI.** Same batch (T.6) closes this — once the model ID fix lands, the existing T.4 captures on `avatar-drawer.spec.ts` (6 screens) plus the BYOC invalid-invite fallback (1 screen) should produce real Sarah-persona scores on PR #25's next CI run. Per-flow capture additions continue as future polish batches (Batch 5.4 VisitDetail three-mode is the natural next landing spot).

### 2026-04-22 — Round 64 Phase 5 testing harness follow-ups

- [ ] **Seed a property profile for the three persistent test users on every Supabase branch.** Without a property, `CustomerPropertyGate` redirects all authenticated navigations to `/customer/onboarding`, which makes Tier 4 E2E specs brittle (they have to treat both the intended destination and `/customer/onboarding` as valid outcomes). Options: (a) add a seed migration that inserts a property row for `bkennington+{customer,provider,admin}@bluekube.com` at every preview branch, (b) provide a per-spec `test.beforeAll` that hits a Supabase RPC to idempotently seed. (a) is simpler but (b) is more isolated.
  - **Why:** Unblocks clean destination-URL assertions in Tier 4 specs and enables downstream flows (Credits, Billing, Settings) to be covered end-to-end.
  - **Blocked:** Nothing blocked — current tests work around the gap with relaxed assertions. This is a polish / precision improvement.
  - **Source:** PR #19 e2e run; AvatarDrawer tests 2 & 4 initially failed with `page.url() === /customer/onboarding` instead of the expected destination.

- [ ] **Rotate the Vercel Protection Bypass secret.** The current value was pasted in session chat (necessary for a one-off setup); chat transcripts are retained. Once PR #19's harness has logged a clean green run, regenerate in Vercel Dashboard → Project → Settings → Deployment Protection → Protection Bypass for Automation → "+ Add", delete the old one, and update `VERCEL_AUTOMATION_BYPASS_SECRET` in GH Secrets.
  - **Why:** Secret hygiene. Chat-exposed credentials should be considered burned.
  - **Blocked:** Nothing blocked — current secret works. Do it opportunistically, no urgency.



> **Last cleanup:** 2026-04-22 — marked resolved: Round 64.5 self-host migration (all phases), Round 64 Phase 1 migrations + types regen, variant-override decision (Phase 2). Active items are the Phase 3 deploy tasks (Stripe pack products + 2 edge function deploys + cron verification) and the Phase 2 follow-up bucket. Snap-a-Fix (Phase 4) is the next scheduled work.

## API Key / External Service Setup

- [x] **CRON_SECRET** — ✅ Resolved 2026-04-21. Rotated via `openssl rand -hex 32` during Round 64.5 self-host migration; stored in Supabase Edge Function Secrets on the new project `gwbwnetatpgnqgarkvht`. The old `MyLittleSecret` placeholder is gone.
- [x] **Mapbox GL API key** — ✅ Set as `VITE_MAPBOX_ACCESS_TOKEN` via Lovable secrets. Env var name standardized across `AdminReadOnlyMap`, `MapboxZoneSelector`, and `AddressLookupTool`.
- [x] **Stripe secret key** — ✅ Set as `STRIPE_SECRET_KEY` via Lovable secrets. Available to all edge functions (billing-automation, weekly-payout, dunning, etc.). Re-pushed to the self-hosted project during Round 64.5 cutover.
- [ ] **Stripe publishable key + backend `create-setup-intent` edge function** — F13 Billing uses Stripe Elements for card collection. The UI will be built but needs a working Stripe publishable key (VITE_STRIPE_PUBLISHABLE_KEY) and backend intent creation to actually collect cards.

## Design Decisions (Needs Human Input)

- [ ] **F22 Performance vs Quality page merge** — Screen-flows spec describes one combined screen, but the codebase has two separate pages (`ProviderPerformancePage` + `ProviderQualityPage`). Decide whether to merge into one page or update the spec.
- [ ] **F30 K-factor summary on Admin Support** — Requires analytics pipeline data (ticket resolution rates, NPS scores, etc.) that doesn't exist in the current schema. Decide whether to add the analytics backend or remove from spec.

## Backend / Schema Gaps

- [x] **Provider support ticket creation (F24)** — ✅ UI fully implemented in SupportNew.tsx. Inserts into support_tickets with provider_org_id.
- [ ] **Admin payout schedule (F29)** — UI will show a payout schedule view, but actual payout execution requires Stripe Connect integration on the backend.
- [ ] **Provider earnings/payout data (F21, F26)** — "Set Up Payout Account" button and admin Provider Detail earnings section will link to appropriate pages, but actual Stripe Connect onboarding flow is a backend concern.

## Session 2 Items (2026-03-30)

- [ ] **Edge function integration tests need staging credentials** — Current Deno tests for billing/payout/dunning/checkout only validate CORS and auth guard rejection. Testing actual business logic (billing cycle creation, payout processing) requires valid Supabase service role keys in a staging environment.
  - **Why:** Tests were scoped to what's possible without live credentials
  - **Blocked:** Full payment flow test coverage
- [ ] **SKU calibration values are still seed data** — The SKU Calibration admin page is built but no real provider interviews have been conducted. All duration/cost values remain "guessed" per the seed data audit.
  - **Why:** Requires human provider interviews using the launch playbook interview guide
  - **Blocked:** Accurate pricing and scheduling
- [x] **Simulation tool is standalone** — ✅ Now integrated into admin console at `/admin/simulator`. Standalone CLI tool remains in `tools/market-simulation/` for optimization runs.
  - **Why:** Designed as an offline planning tool, not a production feature
  - **Blocked:** Nothing — resolved in Round 5 Phase 1

## Low-Priority Cosmetic (Optional)

- [x] **ArrowLeft → ChevronLeft icon swap** — ✅ All pages now use ChevronLeft. Only ArrowLeft remaining is in carousel.tsx (intentional keyboard navigation).
- [x] **F5 Onboarding back button** — ✅ OnboardingWizard and ByocOnboardingWizard both use ChevronLeft.

## TestFlight Deployment (2026-04-01)

- [x] **Register bundle ID in Apple Developer portal** — `com.handledhome.app`
  - **Why:** Required for code signing and TestFlight upload

- [x] **Create app in App Store Connect** — Set up the app listing for TestFlight
  - **Why:** TestFlight builds are uploaded to App Store Connect

- [x] **Generate APNs key and upload to backend** — ✅ APNS_KEY, APNS_KEY_ID, and APNS_TEAM_ID stored as secrets. `process-notification-events` edge function updated to deliver push via APNs HTTP/2 for iOS tokens.
  - **Why:** Push notifications won't arrive on iOS without APNs configuration
  - **Blocked:** Nothing — resolved

- [x] **Add auth callback redirect URL** — Using universal link (`https://handled-home.lovable.app/auth/callback`) instead of custom scheme. Already in URI allow list via wildcard.

- [ ] **Archive and upload build from Xcode** — Product → Archive → Distribute → TestFlight
  - **Why:** Requires macOS with Xcode — cannot be done by agent
  - **Blocked:** TestFlight availability

- [ ] **Add TestFlight testers** — App Store Connect → TestFlight → add by email
  - **Why:** Only invited testers can install
  - **Blocked:** Nothing — do after upload

## App Store Review Submission (2026-04-01)

- [ ] **Create reviewer auth user** — Supabase Auth dashboard → create user `reviewer@handledhome.com` with a strong password, auto-confirm email
  - **Why:** Apple reviewers need a pre-populated test account to review the app
  - **Blocked:** App Store review

- [ ] **Run reviewer seed SQL** — Edit `supabase/seed-apple-reviewer.sql` (replace placeholder UUID with actual user ID), then run against production
  - **Why:** Seeds property, subscription, and role for the reviewer account
  - **Blocked:** App Store review

- [ ] **Fill out App Store Connect privacy labels** — Declare all data types collected (see table in DEPLOYMENT.md § 5b)
  - **Why:** Apple requires privacy nutrition labels for all apps
  - **Blocked:** App Store submission

- [ ] **Enter reviewer credentials in App Store Connect** — App Information → App Review Information → sign-in credentials + review notes
  - **Why:** Reviewers need credentials and context to test the app
  - **Blocked:** App Store review

- [ ] **Submit for App Store review** — After TestFlight testing is satisfactory
  - **Why:** Required for public App Store listing
  - **Blocked:** TestFlight testing complete

## Round 8: Provider Conversion Funnel (2026-04-01)

- [x] **Apply provider_leads and provider_referrals migrations** — ✅ Applied as consolidated migration via Lovable Cloud
  - **Why:** Browse page lead capture and referral form write to these tables
  - **Resolved:** Tables created with RLS policies

- [ ] **Configure email sending for zone launch notifications** — The `notify-zone-leads` edge function marks leads as "notified" but doesn't send actual emails. Need to configure Resend/SendGrid/etc. and wire into the function.
  - **Why:** Leads won't receive launch notification emails without email integration
  - **Blocked:** Nothing — leads are still tracked even without email

## Round 9: Provider Funnel Hardening (2026-04-01)

- [x] **Apply Round 9 migrations** — ✅ Applied as consolidated migration via Lovable Cloud
  - **Why:** All provider funnel automation depends on these triggers and functions
  - **Resolved:** Triggers and RPCs created

- [ ] **Decide referral incentive structure** — The "Refer 3 providers → priority review" messaging is implemented but the actual priority review logic is not enforced. Decide: should 3+ referrals flag the application for faster admin review, or is the messaging aspirational?
  - **Why:** Provider expectation set by UI needs to be backed by a real workflow
  - **Blocked:** Nothing — UI works regardless, but trust erodes if promise isn't kept

## Round 10: Phone Identity, Household Members & Moving Wizard (2026-04-01)

- [x] **Apply Round 10 migrations** — ✅ Applied as consolidated migration via Lovable Cloud
  - **Why:** Household members, moving wizard, and phone matching depend on these
  - **Resolved:** All tables, triggers, and RPCs created

- [ ] **Send actual household invite emails** — The invite flow creates a pending row in household_members but sends no email. Wire to an email service to send "You've been invited to manage [address] on Handled Home."
  - **Why:** Invitees don't know they've been invited without an email
  - **Blocked:** Nothing — invite still works if invitee logs in (auto-accepted)

- [x] **Wire moving wizard to subscription pause/cancel** — ✅ `process_move_date_transitions()` function + `process-move-transitions` edge function auto-cancels subscriptions on move date. Needs pg_cron scheduling.

- [x] **Customer lead zone launch notifications** — ✅ `auto_notify_customer_leads()` trigger mirrors provider lead pattern. Fires on zone launch.

- [ ] **Schedule pg_cron job for process-move-transitions** — The edge function exists but needs to be added to pg_cron to run daily.
  - **Why:** Without the cron job, move date transitions aren't processed automatically
  - **Blocked:** Needs Supabase dashboard access to schedule the cron

- [ ] **Send actual warm handoff emails to new homeowners** — process-new-homeowner-handoff creates the customer_lead but doesn't send emails. Need email service integration.
  - **Why:** New homeowners won't know about Handled Home without outreach
  - **Blocked:** Email service (Resend/SendGrid) not configured

- [x] **Apply billing automation fixes** — ✅ Fixed apply_referral_credits_to_invoice to accept DUE invoices, added advance_billing_cycle, added applied_cents columns

- [x] **Register pg_cron schedules** — ✅ 7 automation jobs registered (billing, dunning, assign-visits, check-no-shows, evaluate-provider-sla, check-weather, weekly-payout)

## Polish Rounds 28-29 Deferred Items (2026-04-02)

- [ ] **Feature 75: Confusion detector unimplemented** — Rated 1/10. "Inline help when a customer changes cadence 3+ times" — needs a per-session cadence change counter in Routine.tsx and a help banner. Not implemented at all.
  - **Why:** Not a polish fix — this is a new feature build
  - **Blocked:** Nothing — just needs implementation

- [ ] **Feature 263: WorkSetup.tsx 469 lines needs decomposition** — Over the 300-line limit. Extract LocationStep, ServicesStep, ScheduleStep into sub-components.
  - **Why:** Decomposition requires careful state management across extracted steps
  - **Blocked:** Nothing — can be done in a future polish round

- [ ] **Feature 263/264: Provider geo-indexes not computed on save** — WorkSetup.handleSave doesn't compute h3_index/home_geohash when lat/lng are provided. The h3-js library is available client-side.
  - **Why:** Provider spatial assignment queries return no results without geo-indexes
  - **Blocked:** Nothing — straightforward fix

- [ ] **Feature 272: ZoneBuilder.tsx 579 lines needs decomposition** — Extract StepRegion, StepSettings, StepPreview, StepEdit, StepCommit into sub-components.
  - **Why:** Major refactor, risk of introducing bugs in 5-step wizard
  - **Blocked:** Nothing — can be done in a future round

## Round 62: Feature Completion (2026-04-03)

### Push Notification Credentials (Feature #167)
- [ ] **FCM_SERVER_KEY** — Add as Supabase Edge Function secret. Get from Firebase Console.
  - **Why:** Without this, Android push notifications silently skip delivery
  - **Blocked:** Android push notifications
- [ ] **APNS_KEY, APNS_KEY_ID, APNS_TEAM_ID** — Add as Supabase Edge Function secrets
  - **Why:** iOS push delivery requires APNs credentials
  - **Blocked:** iOS push notifications (already noted in TestFlight section above)
- [ ] **google-services.json** — Download from Firebase Console, place in `android/app/`
  - **Why:** Capacitor needs this to generate device tokens on Android
  - **Blocked:** Android push registration
- [ ] **GoogleService-Info.plist** — Download from Firebase/Apple, place in `ios/App/App/`
  - **Why:** Capacitor needs this to generate device tokens on iOS
  - **Blocked:** iOS push registration

## Round 51–55 Polish (2026-04-02)

### Edge Function Auth Gaps (SECURITY)
- [x] **`offer-appointment-windows` had NO auth** — ✅ Fixed: added `requireUserJwt` (commit e86eb9b)
- [x] **`backfill-property-zones`, `commit-zones`, `generate-zones` missing admin role check** — ✅ Fixed: added `requireAdminJwt` (commit e86eb9b)
- [ ] **34 of 39 edge functions duplicate CORS headers inline** — Only 5 use the shared `_shared/cors.ts` module. Maintenance risk.

## Round 64: Tier Variants, Credits UX, Snap-a-Fix (2026-04-20)

### Lovable — Apply Supabase migrations
Round 64 writes new migrations into `supabase/migrations/`. Post-Round-64.5 these now auto-apply via the GitHub↔Supabase integration on push to main; the Lovable-apply step below is obsolete.

- [x] **Phase 1 migrations** — `20260420173758_plan_variants_schema.sql` + `20260420174801_plan_variants_review_fixes.sql` — ✅ Applied to the self-hosted project `gwbwnetatpgnqgarkvht` during Round 64.5. `plans.plan_family` + `plans.size_tier` + `plan_variant_rules` + 12 draft variants + `pick_plan_variant` RPC all live.
- [x] **Regenerate Supabase TS types after Phase 1 migrations apply** — ✅ `src/integrations/supabase/types.ts` regenerated with `pick_plan_variant` + `plan_variant_rules` typed. Round 64 Phase 2 uses the RPC directly without `as any` casts.

### Upcoming Phase TODOs (preview — will grow as phases land)

- [ ] **Stripe products for credit packs (Phase 3)** — Create Starter ($149 / 300 credits), Homeowner ($269 / 600 credits, recommended), Year-round ($479 / 1,200 credits) products in Stripe. **Add price ids to Supabase Edge Function Secrets (NOT frontend env vars)** as: `STRIPE_CREDIT_PACK_STARTER_PRICE_ID`, `STRIPE_CREDIT_PACK_HOMEOWNER_PRICE_ID`, `STRIPE_CREDIT_PACK_YEAR_ROUND_PRICE_ID`. Until the env vars are set, the `purchase-credit-pack` edge function returns `{url: null, message: ...}` and the frontend surfaces a "not available yet" toast. Also run `supabase functions deploy purchase-credit-pack` after Batch 3.3 merges to main (and the `20260421120000_grant_topup_credits` migration auto-applies via GitHub integration).

- [ ] **Deploy process-credit-pack-autopay + verify cron (Phase 3 Batch 3.4)** — After merging, run `supabase functions deploy process-credit-pack-autopay` and verify the `process-credit-pack-autopay` cron job is registered (`SELECT * FROM cron.job WHERE jobname = 'process-credit-pack-autopay'` should show a 07:00 daily schedule). Smoke test: manually invoke the function with `curl -H "Authorization: Bearer $CRON_SECRET" https://gwbwnetatpgnqgarkvht.supabase.co/functions/v1/process-credit-pack-autopay` and confirm it returns `{processed, granted, skipped, errors}`. Requires the three Stripe price-id env vars above to be set.
- [ ] **LOVABLE_API_KEY quota review (Phase 4)** — Snap-a-Fix AI classification will increase call volume vs. current support-ai-classify usage. Confirm the key can handle higher QPS or upgrade tier before Phase 4 rollout.

### Phase 4 Snap-a-Fix deploy tasks (2026-04-22)

- [ ] **Enable "Automatically delete head branches" in repo settings (2026-04-22)** — GitHub → Repo Settings → General → Pull Requests → toggle ON. The sandbox git proxy returns HTTP 403 on `git push --delete`, so the agent can't clean up merged branches itself. After enabling, every merged PR's branch is auto-deleted. One-time manual sweep needed for these 6 stale branches already on origin: `chore/assign-bkennington-test-user-roles`, `chore/auth-smoke-scripts`, `claude/phase-4-snap-a-fix-CJKXs`, `docs/session-handoff-post-phase-4`, `docs/settings-local-playwright-envs`, `docs/workflow-testing-harness-captures`.
  - **Why:** Stale remote branches clutter the Branches view and make it harder to see what's actually in flight.
  - **Blocked:** Nothing — cosmetic cleanup + future ergonomics.
- [ ] **Deploy snap-ai-classify (Phase 4 Batch 4.3)** — After PR #9 merged to main, run `supabase functions deploy snap-ai-classify`. Migration `20260422100000_ai_inference_runs_snap_support.sql` auto-applies via GitHub integration. Verify `ANTHROPIC_API_KEY` is already in project Edge Function Secrets (should be — `support-ai-classify` uses it).
- [ ] **Smoke-test Phase 4 routing RPCs in prod (Phase 4 Batch 4.4)** — After PR #10 merges, migration `20260422200000_snap_routing.sql` creates `dispatch_requests` + `handle_snap_routing(uuid)` + `resolve_snap(uuid, int, bool)`. Run in Supabase SQL editor:
  ```sql
  -- Sanity: both RPCs callable; dispatch_requests exists with RLS.
  SELECT proname, prosecdef FROM pg_proc WHERE proname IN ('handle_snap_routing','resolve_snap');
  SELECT tablename, rowsecurity FROM pg_tables WHERE tablename='dispatch_requests';
  ```
  Confirm `prosecdef=true` on both (SECURITY DEFINER) and `rowsecurity=true` on dispatch_requests.
- [ ] **Regen snap_requests / job_tasks / dispatch_requests types (Phase 4 carry-over)** — Sandbox lacks SUPABASE_ACCESS_TOKEN so the agent carried `as any` casts forward through Phase 4. After Phase 4 merges, run `supabase gen types typescript --project-id gwbwnetatpgnqgarkvht > src/integrations/supabase/types.ts` locally, commit. First pre-Round-65 cleanup.
- [ ] **Wire complete_job → resolve_snap trigger (Phase 4 deferred → Phase 5/7)** — Currently `resolve_snap` is called manually. When a provider completes a job that has a `job_tasks` row with `task_type='snap'`, the trigger should auto-call `resolve_snap(snap_request_id, credits_actual)`. Schema already supports this (resolve_snap accepts service_role). Can be added as a Phase 5 visit-detail batch or Phase 7 provider-tooling batch.
- [x] **Test-user credentials for Playwright (testing-strategy.md Appendix C item 3)** — ✅ Resolved 2026-04-22. New users `bkennington+customer@bluekube.com` / `bkennington+provider@bluekube.com` / `bkennington+admin@bluekube.com` (password `65406540` for all three) provisioned + roles assigned via migration `20260422210000_assign_bkennington_test_user_roles.sql` (PR #11). Verified against prod via Supabase Auth API + PostgREST — all three land with their expected role. Sandbox egress blocks `handledhome.app`, so Playwright-against-prod-URL runs still need a non-sandbox runner, but Supabase-API-level smokes work from anywhere. See `scripts/smoke-auth.mjs` for the auth-+-role smoke + `scripts/smoke-auth-roles.sh` for the API-only variant.

- [ ] **Seed Fall Prep bundle content (Phase 6)** — Bundle line items + per-item credit pricing + zone rollout list. Needs admin to choose the initial zones to spotlight.
- [x] **Admin review of manual variant overrides (Phase 2)** — ✅ Decision locked 2026-04-21 in Batch 2.2: auto-approve override AND raise a flag via `customer_onboarding_progress.metadata.plan_variant_selection.admin_review_flagged`. Admin dashboard surface to read the flag is tracked separately below (Phase 2 deferred section).

### Review decisions (reference)

- [ ] **Legacy family in variant rule form** — Phase 1 Batch 1.3 deliberately excluded `legacy` from the Variant Rules admin form (only basic/full/premier). Confirm this is correct: legacy plans (Essential/Plus/Premium) keep the flat pricing model and don't participate in variant resolution. If legacy ever needs its own rules, add it to the form select options.

### Phase 2 deferred (2026-04-21)

- [ ] **Admin review surface for variant override flag (Phase 2 follow-up)** — `customer_onboarding_progress.metadata.plan_variant_selection.admin_review_flagged=true` is set whenever a customer overrides the `pick_plan_variant` recommendation during onboarding. No admin dashboard surfaces this today. Add a "Flagged onboarding overrides" table to the admin console that queries `customer_onboarding_progress` for `metadata->'plan_variant_selection'->>'admin_review_flagged' = 'true'`, shows recommended vs selected variant + reason, and lets an admin mark reviewed.
  - **Why:** Without this, the admin review flag is set but invisible.
  - **Blocked:** Nothing — schema + writes are in place; just needs the admin UI.
- [ ] **Public Browse live plan data** — `/browse` (public, unauthenticated) uses a hardcoded `FAMILY_SUMMARIES` constant because `plans` table RLS requires authenticated read. To go live, either (a) flip the 12 draft variants to `status='active'` and add an RLS policy `"Anyone can read active plans"` (selecting only columns safe for public display), or (b) add a `get_public_plan_families()` SECURITY DEFINER RPC that returns family-level aggregates.
  - **Why:** Prices in Browse can drift from the DB if variants change; static data needs manual updates.
  - **Blocked:** Product decision on when to flip variants to active.
- [ ] **Promote `plan_variant_selection` metadata to first-class columns on `customer_plan_selections`** — Right now Batch 2.2 stashes `recommended_plan_id` / `override_reason` / `admin_review_flagged` in `customer_onboarding_progress.metadata`. Subscribe step (and `create-checkout-session`) doesn't yet copy those fields into `customer_plan_selections` / `subscriptions`. A follow-up migration + code pass should add columns and propagate.
  - **Why:** Metadata is flexible but harder to query than columns; admin reporting will be easier with first-class columns.
  - **Blocked:** Nothing — straightforward migration + SubscribeStep code path.
- [ ] **BYOC variant sizing** — `PlanActivateStep` (BYOC) auto-selects the *smallest* variant of the recommended family. For a customer with a 4,000 sqft home this is inaccurate. Add property sizing to the BYOC flow or call `pick_plan_variant` if a property is already on file.
  - **Why:** Large-home BYOC customers get under-sized plans.
  - **Blocked:** Nothing — known shortcut, noted in Batch 2.3 spec.
- [ ] **`BundleSavingsCard` family awareness** — Currently keyed on legacy `essential/plus/premium`. Plans.tsx translates the new `basic/full/premier` families via a local `BUNDLE_TIER_KEY` map. Update `BundleSavingsCard` to accept `ActiveFamily` keys directly and retire the translation.

## Round 64.5: Supabase Self-Host Migration (2026-04-20) — COMPLETED 2026-04-21

Lovable Cloud lost its GitHub connection to this repo, so the project migrated to a new self-hosted Supabase project (`gwbwnetatpgnqgarkvht`). All Phase A/B/C/F work landed on branch `claude/supabase-self-host-migration` and was merged; follow-on Round 64 phases run on the new project. Original plan was at `/root/.claude/plans/i-used-the-new-nifty-avalanche.md`.

### Phase A — User prereqs

- [x] **Create a new Supabase project** — ✅ Project `gwbwnetatpgnqgarkvht` created (us-west-1).
- [x] **Gather 5 credentials** — ✅ Received in 2026-04-21 sessions.
- [x] **Generate a Supabase Personal Access Token** — ✅ Stored on developer machine via `.claude/settings.local.json`.
- [x] **Generate an Anthropic API key** — ✅ Wired into `_shared/anthropic.ts`; `predict-services` + `support-ai-classify` use `claude-haiku-4-5-20251001`.
- [x] **Pull the direct DB connection string from Lovable** — ✅ No longer needed. Old project pre-launch test data only; reset before go-live. Skip.
- [x] **Capture existing Lovable secrets** — ✅ All 5 (STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, RESEND_API_KEY, WEATHER_API_KEY, CRON_SECRET) re-pushed to new project.

### Phase A — Dashboard configuration on new project

- [x] **Auth → Email provider** — ✅ Enabled; dev confirmations disabled.
- [x] **Auth → Google provider** — ✅ Client id/secret ported; callback URL added to Google Cloud Console.
- [x] **Auth → URL Configuration** — ✅ Site URL + redirect URLs configured for localhost + production (`https://handledhome.app`).
- [x] **Auth → Email templates** — ✅ Defaults accepted.
- [x] **C-6 cron job repoint** — `ALTER DATABASE` rejected with `42501: permission denied` from both Management API AND dashboard SQL editor (Supabase Cloud locked the postgres role). Resolved via Vault-based migration `20260421050000` instead. Cron jobs now read `service_role_key` from `vault.secrets` via `cron_private.invoke_edge_function` SECURITY DEFINER helper. End-to-end smoke test passed.

### Phase C-6 — Configure pg_cron database settings (2026-04-21)

- [x] **Run in Supabase dashboard SQL editor** — ✅ Superseded by the Vault-based `cron_private.invoke_edge_function` helper in migration `20260421050000`. The GUC approach (`ALTER DATABASE postgres SET app.settings.*`) was blocked by Supabase Cloud's postgres-role permissions; Vault reads replaced it. All 7 pg_cron jobs route through the helper and invoke edge functions with the service role key from `vault.secrets`.

### Remaining Phase A secrets — received 2026-04-21

- [x] **`STRIPE_SECRET_KEY`** — received 2026-04-21 session 2. Pushed to Supabase Edge Function secrets.
- [x] **`STRIPE_WEBHOOK_SECRET`** — received 2026-04-21 session 2 (`whsec_...` from new event destination). Pushed to Supabase Edge Function secrets.
- [x] **`RESEND_API_KEY`** — received 2026-04-21 session 2 (new key created per `re_...` format). Pushed to Supabase Edge Function secrets.
- [x] **`WEATHER_API_KEY`** — received 2026-04-21 session 2. Pushed to Supabase Edge Function secrets. End-to-end cron invocation got past the key check.
- [ ] **`check-weather` error-serialization bug (post-Round 64.5 cleanup)** — when invoked from cron, returns 500 with `error_message: "[object Object]"` in `cron_run_log`. Indicates a `catch(err) { return JSON.stringify(err) }` pattern somewhere that mangles non-Error throws. Pre-existing; not introduced by Round 64.5. Fix: locate the catch block, log `err instanceof Error ? err.message : JSON.stringify(err, Object.getOwnPropertyNames(err))`. Low priority — function is a non-critical cron and data is being reset before launch anyway.
- [x] **`CRON_SECRET`** — generated 2026-04-21 via `openssl rand -hex 32`. Stored in `/root/.r64_5_secrets.env`.
- [x] **`LOVABLE_DIRECT_DB_URL`** — no longer needed. Phase C-2 skipped 2026-04-21: old project is pre-launch test data only; all data reset before go-live. User's PAT has no access to old project anyway (different org).

### Phase F — Cutover tasks

- [x] **Stripe dashboard** — ✅ Webhook endpoint updated to `https://gwbwnetatpgnqgarkvht.supabase.co/functions/v1/stripe-webhook`; subscribed to the 9 current events (incl. `transfer.created` / `.reversed` per Stripe 2025 API).
- [x] **Google Cloud Console** — ✅ New callback URL added as authorized redirect URI.
- [x] **Production deploy** — ✅ Vercel project `handled-home` is live at `https://handledhome.app` with the `.env` pointing at the new project.
- [x] **Monitor Supabase Function logs** — ✅ Post-cutover smoke test passed (sign-up + onboarding render).

### Phase F + 24h — Decommission

- [ ] **Archive the Lovable Cloud project** — pending; no disable button, just stop using it and delete after 30-day confidence window.
