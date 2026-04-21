# Deferred Items — For Human Action

Items that require API keys, backend changes, or design decisions beyond frontend gap closure. These are left for the owner to complete after the automated batch work.

## API Key / External Service Setup

- [x] **CRON_SECRET** — ✅ Set via Lovable secrets. All 11 pg_cron jobs updated with `Bearer <CRON_SECRET>` auth header. ⚠️ **Replace `MyLittleSecret` with a strong random string** (`openssl rand -hex 32`) in both the secret and the cron migration SQL.
- [x] **Mapbox GL API key** — ✅ Set as `VITE_MAPBOX_ACCESS_TOKEN` via Lovable secrets. Env var name standardized across `AdminReadOnlyMap`, `MapboxZoneSelector`, and `AddressLookupTool`.
- [x] **Stripe secret key** — ✅ Set as `STRIPE_SECRET_KEY` via Lovable secrets. Available to all edge functions (billing-automation, weekly-payout, dunning, etc.).
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
Round 64 writes new migrations into `supabase/migrations/`. Lovable handles the Supabase connection, so **please ask Lovable to apply these migrations** after each phase lands:

- [ ] **Phase 1 migrations** — `20260420173758_plan_variants_schema.sql` + `20260420174801_plan_variants_review_fixes.sql`
  - **Why:** Adds `plans.plan_family` + `plans.size_tier`, creates `plan_variant_rules` table, seeds 12 draft variants + 12 seed rules, creates `pick_plan_variant(uuid, text)` SECURITY DEFINER RPC.
  - **Blocked:** Phase 2 (onboarding variant resolution) cannot run without the RPC deployed.
  - **Safety:** Legacy Essential/Plus/Premium rows backfill as `plan_family='legacy'` (NULL size_tier). Live subscriptions keep working. New variants are `status='draft'` until Phase 2 activation.
- [ ] **Regenerate Supabase TS types after Phase 1 migrations apply** — `src/integrations/supabase/types.ts` currently has no awareness of `plan_variant_rules` or `pick_plan_variant`. Hooks use `as any` as the interim. Once Lovable regens, the `as any` casts can be tightened in a later batch.

### Upcoming Phase TODOs (preview — will grow as phases land)

- [ ] **Stripe products for credit packs (Phase 3)** — Create Starter ($149 / 300 credits), Homeowner ($269 / 600 credits, recommended), Year-round ($479 / 1,200 credits) products in Stripe. Add product + price IDs to `.env.local` / Lovable secrets as `VITE_CREDIT_PACK_STARTER_PRICE_ID`, etc.
- [ ] **LOVABLE_API_KEY quota review (Phase 4)** — Snap-a-Fix AI classification will increase call volume vs. current support-ai-classify usage. Confirm the key can handle higher QPS or upgrade tier before Phase 4 rollout.
- [ ] **Seed Fall Prep bundle content (Phase 6)** — Bundle line items + per-item credit pricing + zone rollout list. Needs admin to choose the initial zones to spotlight.
- [ ] **Admin review of manual variant overrides (Phase 2)** — Onboarding will let customers override the `pick_plan_variant` result one tier up/down. Decide whether overrides need admin approval or auto-approve with a review flag.

### Review decisions (reference)

- [ ] **Legacy family in variant rule form** — Phase 1 Batch 1.3 deliberately excluded `legacy` from the Variant Rules admin form (only basic/full/premier). Confirm this is correct: legacy plans (Essential/Plus/Premium) keep the flat pricing model and don't participate in variant resolution. If legacy ever needs its own rules, add it to the form select options.

## Round 64.5: Supabase Self-Host Migration (2026-04-20) — BLOCKING

Lovable Cloud lost its GitHub connection to this repo and can no longer apply migrations. Round 64 Phases 2–8 are blocked until we migrate off. Plan is in `/root/.claude/plans/i-used-the-new-nifty-avalanche.md` and live tracker is `docs/working/plan.md`.

### Phase A — User prereqs (required before Claude Code can proceed)

Deliver all of the following in one message to a new Claude Code session:

- [ ] **Create a new Supabase project** at https://supabase.com/dashboard. Pick a region close to existing Lovable project (yxhdschpeezawraqsmug).
- [ ] **Gather 5 credentials** from the new project:
  - Project ref (e.g., `abcdefgh12345678`)
  - Project URL (`https://<ref>.supabase.co`)
  - Anon (publishable) key
  - Service role key (Settings → API)
  - Database password (Settings → Database)
- [ ] **Generate a Supabase Personal Access Token** at https://supabase.com/dashboard/account/tokens. Label it "claude-code-sandbox". This is what Claude Code will use for CLI commands.
- [ ] **Generate an Anthropic API key** at https://console.anthropic.com/ with billing enabled. This replaces `LOVABLE_API_KEY` in `predict-services` and `support-ai-classify`.
- [ ] **Pull the direct DB connection string from Lovable** for the existing project `yxhdschpeezawraqsmug` (Lovable dashboard → Database → Connection string → Direct). If Lovable doesn't expose it, Claude Code will fall back to CSV per-table exports + Supabase Auth Admin API for users.
- [ ] **Capture existing Lovable secrets** (dashboard screenshot). Needed: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `RESEND_API_KEY` (or email provider), `WEATHER_API_KEY`, `CRON_SECRET`. Skip `LOVABLE_API_KEY` (replaced by Anthropic).

### Phase A — Dashboard configuration on new project

Do these in the new Supabase project's dashboard before Claude Code does anything:

- [ ] **Auth → Email provider** — enable; match old project's confirm settings (likely disable email confirmations for dev).
- [ ] **Auth → Google provider** — paste client ID + client secret from old project. Add the new project's `/auth/v1/callback` URL as an authorized redirect URI in Google Cloud Console.
- [ ] **Auth → URL Configuration** — Site URL = `http://localhost:5173`, add production URL if any. Redirect URLs include both localhost and production.
- [ ] **Auth → Email templates** — copy-paste from old project OR accept defaults.

### Phase C-6 — Configure pg_cron database settings (2026-04-21, added this session)

- [ ] **Run in Supabase dashboard SQL editor** (new project `gwbwnetatpgnqgarkvht`):
  ```sql
  ALTER DATABASE postgres SET app.settings.supabase_url = 'https://gwbwnetatpgnqgarkvht.supabase.co';
  ALTER DATABASE postgres SET app.settings.service_role_key = '<paste sb_secret_... value>';
  ```
  - **Why:** All 7 pg_cron jobs use `current_setting('app.settings.*')` to resolve the function URL + auth header. Without these GUCs, the cron calls hit `null/functions/v1/...` and fail silently.
  - **Blocked:** Management API postgres role lacks `ALTER DATABASE` privilege. Dashboard SQL editor runs with higher privilege.
  - **Verify:** `show app.settings.supabase_url;` should echo the URL.

### Remaining Phase A secrets (Claude needs these to continue) — 2026-04-21

The 2026-04-21 session received the first six credentials (PAT, project ref/URL, publishable key, secret key, DB URL, Anthropic key) and made Phases B-2/C-1/C-3/C-5/C-7 complete. Still needed:

- [x] **`STRIPE_SECRET_KEY`** — received 2026-04-21 session 2. Pushed to Supabase Edge Function secrets.
- [x] **`STRIPE_WEBHOOK_SECRET`** — received 2026-04-21 session 2 (`whsec_...` from new event destination). Pushed to Supabase Edge Function secrets.
- [x] **`RESEND_API_KEY`** — received 2026-04-21 session 2 (new key created per `re_...` format). Pushed to Supabase Edge Function secrets.
- [ ] **`WEATHER_API_KEY`** — for `check-weather` edge function. **Source: weatherapi.com** (NOT openweathermap.org). Free tier available at https://www.weatherapi.com/ → Sign up → Dashboard → API key.
- [x] **`CRON_SECRET`** — generated 2026-04-21 via `openssl rand -hex 32`. Stored in `/root/.r64_5_secrets.env`.
- [ ] **`LOVABLE_DIRECT_DB_URL`** — direct Postgres connection string on old project `yxhdschpeezawraqsmug` (needed for Phase C-2 pg_dump data migration). If Lovable doesn't expose it, say so and Claude will fall back to CSV + Supabase Auth Admin API per-table export.

### Phase F — Cutover tasks (when Claude Code signals ready)

Do these when Claude Code is about to flip `.env`:

- [ ] **Stripe dashboard** — update webhook endpoint to `https://<new-ref>.supabase.co/functions/v1/stripe-webhook`. Keep both endpoints enabled for a 5-minute overlap.
- [ ] **Google Cloud Console** — add new project's callback URL as authorized redirect URI (if not already).
- [ ] **Production deploy** (if any) — redeploy after `.env` commit lands.
- [ ] **Monitor Supabase Function logs** on new project for 30 min post-cutover.

### Phase F + 24h — Decommission

- [ ] **Archive the Lovable Cloud project** (no disable button — just stop using it, can delete project after 30 days confidence window).
