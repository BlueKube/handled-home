# Deployment Guide — Handled Home

Step-by-step instructions for deploying the Handled Home platform.

---

## Prerequisites

- Node.js 20+
- **Self-hosted Supabase project** (not Lovable-managed). Current project ref: `gwbwnetatpgnqgarkvht` (region us-west-1). With database, Auth, Realtime, and Edge Functions enabled.
- Supabase CLI installed (`npm install -g supabase` — v2.90.0+)
- Vercel project (`handled-home` under the user's team) with custom domain `handledhome.app`. Uses the GitHub→Vercel integration for production deploys and the Supabase→Vercel integration for env var sync.
- Stripe account (payments + Connect for provider payouts) — using 2025+ API (events `transfer.created`/`transfer.reversed` replaced retired `transfer.paid`/`transfer.failed`)
- Resend account (transactional email) — NEW keys can only be revealed at creation; don't rely on viewing existing ones.
- WeatherAPI.com account (NOT openweathermap.org) — the `check-weather` function uses `https://api.weatherapi.com/v1/forecast.json`.
- Anthropic API account — direct calls via `supabase/functions/_shared/anthropic.ts` (model `claude-haiku-4-5-20251001`). No longer using the Lovable AI gateway.
- Mapbox account (zone maps and provider coverage)
- Capacitor CLI (for iOS/Android builds)

### Integrations enabled (one-time setup per project)

- **Supabase ↔ GitHub** (Settings → Integrations → GitHub): production branch `main`, working directory `.`, "Supabase changes only" ON, Branch limit 3. Auto-applies new migrations on every push to main.
- **Supabase ↔ Vercel** (Settings → Integrations → Vercel): connects to the `handled-home` Vercel project and syncs Supabase env vars automatically. Delete `SUPABASE_SERVICE_ROLE_KEY` + `SUPABASE_JWT_SECRET` from Vercel after the integration populates them — the SPA doesn't need server-only secrets in its env bundle.
- **GitHub ↔ Vercel** (standard Vercel import): auto-deploys `main` to production, PRs to preview URLs.

---

## 1. Environment Variables

### Client-side (committed `.env`)

```env
VITE_SUPABASE_PROJECT_ID="gwbwnetatpgnqgarkvht"
VITE_SUPABASE_PUBLISHABLE_KEY="sb_publishable_..."
VITE_SUPABASE_URL="https://gwbwnetatpgnqgarkvht.supabase.co"
```

These are bundled into the browser — publishable only, never secrets. `sb_publishable_` is the modern Supabase anon key format.

**Vercel env vars override the committed `.env` at build time** (Vite uses `dotenv` under the hood, which does not overwrite existing process env). The Vercel project's Production/Preview env vars are the effective runtime source of truth. The committed `.env` is the fallback for local dev and anyone cloning the repo fresh.

Other client-side vars in Vercel (Production + Preview + Development):
- `VITE_MAPBOX_ACCESS_TOKEN` — must be added manually; Supabase↔Vercel integration doesn't sync this.

### Local override (`.env.local`, gitignored)

For targeting a different project in local dev without committing, drop a `.env.local` at the repo root with the same keys. Vite precedence: `.env.local` > `.env`.

### Edge Function Secrets (set via Supabase CLI or MCP)

```bash
supabase secrets set \
  STRIPE_SECRET_KEY=sk_live_... \
  STRIPE_WEBHOOK_SECRET=whsec_... \
  RESEND_API_KEY=re_... \
  ANTHROPIC_API_KEY=sk-ant-... \
  CRON_SECRET=$(openssl rand -hex 32) \
  WEATHER_API_KEY=... \
  MAPBOX_ACCESS_TOKEN=pk.... \
  --project-ref gwbwnetatpgnqgarkvht
```

Or via the Supabase MCP server's `set_secrets` tool from Claude Code.

- `STRIPE_RESTRICTED_API_KEY` is optional — only needed for Connect-level reads that don't justify the full secret key.
- `ANTHROPIC_API_KEY` powers `predict-services` + `support-ai-classify` via the new `supabase/functions/_shared/anthropic.ts` helper. The old `LOVABLE_API_KEY` is no longer used.
- `WEATHER_API_KEY` is from **weatherapi.com**, not openweathermap.org. The free tier works for dev.
- `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`, `SUPABASE_URL`, `SUPABASE_DB_URL` are auto-provisioned by Supabase — do not set manually.

### Vault secret (for pg_cron jobs)

pg_cron jobs can't read Edge Function secrets directly. They read `service_role_key` from `vault.secrets` via a SECURITY DEFINER helper (`cron_private.invoke_edge_function`). To seed the vault entry on a fresh project:

```sql
-- Run once via Supabase SQL Editor or Management API /database/query
SELECT vault.create_secret('<SERVICE_ROLE_KEY_VALUE>', 'service_role_key');
```

Previously this was handled via `ALTER DATABASE postgres SET app.settings.service_role_key = ...`, but Supabase Cloud has locked the `postgres` role against `ALTER DATABASE`. The Vault pattern works under the current privilege model.

### GitHub Actions Secrets (for E2E tests)

```
BASE_URL                  # Deployed preview URL
TEST_CUSTOMER_EMAIL       # Test customer account email
TEST_CUSTOMER_PASSWORD    # Test customer account password
TEST_PROVIDER_EMAIL       # Test provider account email
TEST_PROVIDER_PASSWORD    # Test provider account password
TEST_ADMIN_EMAIL          # Test admin account email
TEST_ADMIN_PASSWORD       # Test admin account password
```

---

## 2. Database Setup

### Apply Migrations

There are 199+ migrations in `supabase/migrations/` (2026-02-21 through 2026-04-21). Three ways to apply:

**Option A — push to main (recommended).** With the Supabase↔GitHub integration enabled, any new migration committed to `main` auto-applies on push. No CLI step needed. Watch Supabase dashboard → Database → Migrations.

**Option B — `supabase db push` (local dev, new projects, backfills).**

```bash
supabase db push --project-ref gwbwnetatpgnqgarkvht
```

**Option C — Management API fallback (when the pooler is unreachable from your environment, e.g., sandboxed CI).** `supabase db push` needs port 5432/6543 to the pooler. If those are blocked, POST SQL directly to the REST endpoint:

```bash
curl -X POST "https://api.supabase.com/v1/projects/$SUPABASE_PROJECT_REF/database/query" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$(jq -Rs '{query: .}' < migration.sql)"

# Then record in schema_migrations so the GitHub integration doesn't re-apply:
curl -X POST "https://api.supabase.com/v1/projects/$SUPABASE_PROJECT_REF/database/query" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" -H "Content-Type: application/json" \
  -d '{"query":"insert into supabase_migrations.schema_migrations (version, name, statements) values (...) on conflict (version) do nothing;"}'
```

Or use the Supabase MCP server's `apply_migration` tool, which handles both steps automatically.

### Migration bootstrap-chain rule (for Supabase Preview + GitHub integration)

**Every new migration must `-- Previous migration: <filename>` chain off the prior one.** The Supabase↔GitHub integration refuses to build a preview branch if any migration in the diff has no declared parent — it blocks the *entire* PR's Supabase Preview check, not just the orphan file.

Discovered in Round 64 Phase 4: PR #6 shipped two unchained migrations, which silently blocked every subsequent PR's Supabase Preview from ever reporting. PR #7 backfilled the chain comments and unstuck the queue. Agents write migrations in batches, so the fix is mechanical: the first line of every `20YYMMDDHHMMSS_slug.sql` file should be a comment naming the file it builds on, pointing back to the most recent prior migration on `main`.

```sql
-- Previous migration: 20260421183000_add_plan_variants_snapshots.sql
-- Purpose: …
```

When you merge a branch whose first migration predates the current `main` HEAD, re-point the chain during the merge so the declared parent matches the file that actually precedes yours on `main`. Integration re-checks on merge; stale chains trigger a re-open.

### Key Migration Areas

| Area | What it covers |
|------|---------------|
| Core tables | profiles, properties, subscriptions, jobs, visits |
| Service catalog | SKUs, SKU levels, categories, checklist templates |
| Zones & capacity | zones, zone capacity, provider coverage |
| Provider network | provider_orgs, provider_members, compliance |
| Notifications | notification_events, notifications, templates, device tokens |
| Billing | subscriptions, invoices, handle_transactions, payouts |
| Referrals | referrals, referral_milestones, attributions |
| Support | support_tickets, disputes, evidence |
| Seed data | demo-data, rich-metro test data |

### Enable Realtime

Realtime should be enabled on the `notifications` table via migration. Verify:

```sql
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
```

The `notifications` table should appear in the results.

---

## 3. Deploy Edge Functions

There are 39+ Edge Functions in `supabase/functions/` plus the `_shared/` helpers (`anthropic.ts`, `auth.ts`, `cors.ts`, `deps.ts`). Deploy all at once:

```bash
# --use-api bypasses the local Deno bundler and uploads directly — works from
# sandboxed environments that can't run the bundler.
supabase functions deploy --use-api --jobs 4 --project-ref gwbwnetatpgnqgarkvht
```

Or via the Supabase MCP server's `deploy_edge_function` tool.

Or deploy individually for critical functions:

```bash
# Payments
supabase functions deploy create-checkout-session
supabase functions deploy stripe-webhook
supabase functions deploy create-portal-session
supabase functions deploy create-setup-intent
supabase functions deploy create-connect-account
supabase functions deploy create-connect-account-link
supabase functions deploy process-payout
supabase functions deploy run-billing-automation
supabase functions deploy run-dunning

# Notifications & email
supabase functions deploy send-email
supabase functions deploy process-notification-events
supabase functions deploy send-reminders

# Operations & scheduling
supabase functions deploy run-scheduled-jobs
supabase functions deploy run-nightly-planner
supabase functions deploy check-weather
supabase functions deploy assign-jobs
supabase functions deploy assign-visits
supabase functions deploy route-sequence
supabase functions deploy optimize-routes
supabase functions deploy offer-appointment-windows

# AI services
supabase functions deploy predict-services
supabase functions deploy support-ai-classify
supabase functions deploy compute-quality-scores

# Growth
supabase functions deploy activate-byoc-invite
supabase functions deploy join-waitlist

# Zone management
supabase functions deploy generate-zones
supabase functions deploy commit-zones
supabase functions deploy backfill-property-zones
```

Verify deployment:
```bash
supabase functions list
```

---

## 4. Build and Deploy Frontend

### Web (Vercel — current production path)

Pushes to `main` auto-deploy to production. Preview branches get their own URLs (e.g., `handled-home-git-<branch>-<team>.vercel.app`). The committed `vercel.json` rewrites all unmatched paths to `/index.html` so `BrowserRouter` deep links resolve:

```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
```

### Custom domain (`handledhome.app`)

Two setup paths at Vercel → handled-home → Settings → Domains:

- **Nameservers (simpler).** Point the registrar's nameservers at Vercel (`ns1.vercel-dns.com`, `ns2.vercel-dns.com`). Vercel manages A/CNAME/SSL automatically. If you later want email on the domain (MX records), those go in Vercel's DNS UI, not the registrar.
- **A/CNAME records (if you need email or other services at the registrar).** Leave nameservers at the registrar, add Vercel's A record for apex and CNAME for `www`.

SSL provisions automatically ~2-5 min after DNS resolves. Google OAuth's Authorized JavaScript Origins should already list `https://handledhome.app` and `https://www.handledhome.app`.

### Local / manual

```bash
npm install
npm run build
```

Built files in `dist/`.

### Mobile Builds (Capacitor)

```bash
# Build web assets and sync to native projects
npm run build
npx cap sync ios

# Open in Xcode
npx cap open ios
```

### TestFlight Deployment (iOS)

**Prerequisites:**
- Apple Developer account with the app registered (bundle ID: `com.handledhome.app`)
- APNs certificate uploaded to Supabase project settings (for push notifications)
- Xcode installed on macOS

**Steps:**

1. **Build and sync:**
   ```bash
   npm run build
   npx cap sync ios
   ```

2. **Open in Xcode:**
   ```bash
   npx cap open ios
   ```

3. **Configure signing in Xcode:**
   - Select the "App" target → Signing & Capabilities
   - Choose your Team (Apple Developer account)
   - Verify bundle ID: `com.handledhome.app`
   - Add "Push Notifications" capability if not already added

4. **Archive and upload:**
   - Product → Archive
   - Window → Organizer → Distribute App → TestFlight & App Store
   - Upload

5. **Add testers in App Store Connect:**
   - Go to App Store Connect → TestFlight
   - Add internal or external testers by email

**Configuration already in place:**
- App icon: branded "H" lettermark (iOS Assets.xcassets)
- Info.plist: camera, photo library, location privacy descriptions
- Custom URL scheme: `handledhome://` for auth deep links
- Push notifications: `@capacitor/push-notifications` plugin configured
- Deep link handler: `useDeepLinks` hook handles `handledhome://auth/callback`
- Orientation: portrait only on iPhone
- Safe areas: `.safe-top` / `.safe-bottom` CSS utilities applied to headers and tab bars
- Viewport: `viewport-fit=cover`, `user-scalable=no`, 16px input font size

**Supabase auth redirect URL:**
Add `handledhome://auth/callback` to the allowed redirect URLs in your Supabase project settings (Authentication → URL Configuration → Redirect URLs).

**Push notifications:**
- APNs certificate or key must be uploaded to Supabase (Settings → Push Notifications)
- The app requests permission on first launch and registers the device token automatically

---

## 5. Post-Deploy Verification

1. **Auth** — Sign up and log in at `/auth`
2. **Customer onboarding** — Complete the 6-step onboarding wizard
3. **Provider onboarding** — Apply as a provider and verify the application flow
4. **Admin dashboard** — Log in with an admin account, verify analytics charts render
5. **Notifications** — Verify realtime notifications appear in the bell icon
6. **Email** — Trigger a transactional email (e.g., welcome email) and verify delivery via Resend dashboard
7. **Stripe** — Test a checkout flow, verify webhook processing
8. **Maps** — Verify Mapbox renders on zone builder and provider coverage pages

---

## 5b. Apple App Store Review Preparation

### Test accounts for agent-driven + Playwright testing

Three persistent test users are provisioned in prod for the 5-tier testing protocol (`docs/testing-strategy.md` Tier 3+). Passwords live in `.claude/settings.local.json` (gitignored) and in `.claude/settings.local.example.json` as `REPLACE_ME` placeholders.

| Role | Email | Purpose |
|---|---|---|
| Customer | `bkennington+customer@bluekube.com` | Happy-path customer flows, Tier 4 E2E |
| Provider | `bkennington+provider@bluekube.com` | Provider dashboard + job acceptance Tier 4 |
| Admin | `bkennington+admin@bluekube.com` | Admin surfaces, operational dashboards |

Roles are assigned via migration (`supabase/migrations/20260422210000_assign_bkennington_test_user_roles.sql`). To verify:

```bash
scripts/smoke-auth-roles.sh       # DB-level check (reads bkennington_profile_roles view)
scripts/smoke-auth.mjs            # API-level check (logs in and asserts role)
```

Both scripts read credentials from env; see `.claude/settings.local.example.json` for the variable names.

### Test Account for Reviewers (App Store)

1. **Create the auth user** in Supabase Auth dashboard:
   - Email: `reviewer@handledhome.com`
   - Password: choose a strong password
   - Auto-confirm the email (skip email verification)

2. **Get the user's UUID** from the Supabase Auth → Users table

3. **Run the seed script** (update the UUID in the file first):
   ```bash
   # Edit supabase/seed-apple-reviewer.sql — replace the placeholder UUID
   supabase db execute --file supabase/seed-apple-reviewer.sql
   ```

4. **Enter credentials in App Store Connect:**
   - TestFlight → App Information → App Review Information
   - Sign-In Required: Yes
   - Username: `reviewer@handledhome.com`
   - Password: (the password you set)
   - Notes: "This account has a pre-configured property in Austin, TX with an active Essential subscription. The app requires a service area with active zones — this test account is set up in a covered zone."

### App Store Privacy Labels

Declare these data types in App Store Connect → App Privacy:

| Data Type | Usage | Linked to Identity |
|-----------|-------|--------------------|
| Email Address | App Functionality, Account Management | Yes |
| Name | App Functionality | Yes |
| Phone Number | App Functionality | Yes |
| Physical Address | App Functionality | Yes |
| Payment Info | App Functionality (via Stripe) | Yes |
| Photos | App Functionality (service proof) | Yes |
| Coarse Location | App Functionality (zone coverage) | Yes |
| User ID | App Functionality | Yes |
| Device ID | App Functionality (push notifications) | Yes |

### Review Notes Template

```
Handled Home is a managed home maintenance platform that connects homeowners
with vetted service providers for recurring services (lawn care, pest control,
window cleaning, etc.).

Test account credentials are provided above. The test account has:
- A property in Austin, TX (covered service area)
- An active Essential subscription ($99/mo)
- Access to the full service catalog

Key flows to test:
1. Browse page (no login required): View services and plans at /browse
2. Customer dashboard: View upcoming services, property health score
3. Service catalog: Browse available services with handle costs
4. Settings: Profile, notifications, privacy policy, terms, account deletion
5. Provider view: Switch roles via Settings → Role Switcher (if multi-role)

The app uses Stripe for subscription payments (physical services — exempt from
IAP per Guideline 3.1.1). Payment processing uses Stripe's standard checkout flow.

Privacy policy: Available at /privacy in the app
Terms of service: Available at /terms in the app
Account deletion: Available in Settings → Delete Account
```

---

## 6. CI/CD

GitHub Actions workflow at `.github/workflows/playwright.yml` runs:

- E2E tests with Playwright (mobile emulation: `chromium-mobile`, `chromium-mobile-no-auth`)
- Screenshot catalog (~105 screens)
- UX simulation (7 personas x all screens)
- Growth audit (business model validation)
- Creative director audit (UI/UX flow validation)

Triggered via **workflow_dispatch** (manual) with configurable options for which test suites to run.

### Required GitHub Secrets

See the GitHub Actions Secrets section above. All 7 secrets must be configured for E2E tests to pass.

---

## 7. Scheduled Jobs

Several Edge Functions are designed to run on a schedule. Configure via Supabase pg_cron or external cron:

| Function | Suggested Schedule | Purpose |
|----------|-------------------|---------|
| `run-nightly-planner` | Daily, 2am | Assign next-day jobs |
| `run-scheduled-jobs` | Every 15 min | Process queued job operations |
| `send-reminders` | Daily, 7am | Send upcoming service reminders |
| `run-billing-automation` | Daily, 3am | Process billing cycles |
| `run-dunning` | Daily, 4am | Payment recovery sequence |
| `process-payout` | Weekly, Monday 6am | Provider payout processing |
| `check-weather` | Daily, 5am | Weather-aware scheduling adjustments |
| `snapshot-rollup` | Daily, 1am | Analytics snapshot |
| `compute-quality-scores` | Daily, midnight | Update provider quality scores |
| `cleanup-expired-offers` | Hourly | Remove expired appointment offers |
| `check-no-shows` | Every 30 min | Flag no-show visits |

### Setup (one-time)

1. `pg_cron` and `pg_net` extensions are enabled via migration; no manual enable step.
2. **Seed the Vault entry** (once, via SQL Editor or Management API — NOT via migration, since migrations are committed to git):
   ```sql
   SELECT vault.create_secret('<SERVICE_ROLE_KEY_VALUE>', 'service_role_key');
   ```
3. Migration `20260421050000_round_64_5_repoint_cron_jobs_to_vault.sql` creates the SECURITY DEFINER helper `cron_private.invoke_edge_function(function_name text, body jsonb)` that reads `service_role_key` from the Vault and POSTs to the named function. All 7 existing cron jobs already use it.

### Why Vault (not `ALTER DATABASE`)

The older pattern set `app.settings.service_role_key` via `ALTER DATABASE postgres SET ...`. Supabase Cloud has since locked the `postgres` role against `ALTER DATABASE` — the statement fails with `42501: permission denied` from both Management API and dashboard SQL editor. Vault works under current privileges.

### Registering a new cron job

```sql
-- Example: new daily cleanup at 2am UTC
SELECT cron.schedule(
  'cleanup-daily',
  '0 2 * * *',
  $cmd$ SELECT cron_private.invoke_edge_function('cleanup-daily'); $cmd$
);

-- With a body payload:
SELECT cron.schedule(
  'weekly-payout-friday',
  '0 8 * * 5',
  $cmd$ SELECT cron_private.invoke_edge_function('process-payout', '{"batch": true}'::jsonb); $cmd$
);
```

The helper handles URL construction, Authorization header, and Content-Type. No service role key in the cron command itself — the cron command is safe to commit to migrations.

### Current schedule

| Function | Cron | Purpose |
|----------|------|---------|
| `run-billing-automation` | `0 7 * * *` | Daily billing cycle processing |
| `run-dunning` | `0 6 * * *` | Payment recovery sequence |
| `assign-visits` | `0 5 * * *` | Next-day job assignment |
| `check-no-shows` | `0 8-18 * * *` | Hourly during business hours |
| `evaluate-provider-sla` | `0 4 * * *` | Provider SLA scoring |
| `check-weather` | `0 3 * * *` | Weather-aware scheduling |
| `weekly-payout` | `0 8 * * 5` | Friday provider payouts (batch) |

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Emails not sending | Check `send-email` Edge Function is deployed + `RESEND_API_KEY` secret is set. Without the key, emails are marked SUPPRESSED. |
| Resend key unrecoverable | Resend only shows keys at creation. If you don't have it saved, delete the old one + create a new one; old key value is gone. |
| Realtime not working | Verify notifications table is in the Realtime publication: `SELECT * FROM pg_publication_tables` |
| Stripe payments failing | Check `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` secrets. Verify webhook endpoint destination in Stripe dashboard. |
| Stripe `transfer.paid`/`transfer.failed` events missing | These were retired in Stripe's 2025 API. Subscribe to `transfer.created` + `transfer.reversed` instead — the webhook handler already dispatches on the new event names. |
| Maps not rendering | Check `MAPBOX_ACCESS_TOKEN` (Edge Function) + `VITE_MAPBOX_ACCESS_TOKEN` (Vercel env). Verify the token has the correct scopes. |
| AI features not working | Check `ANTHROPIC_API_KEY` secret is set. `predict-services` and `support-ai-classify` call Anthropic via `_shared/anthropic.ts`. No longer uses `LOVABLE_API_KEY`. |
| `check-weather` returns `[object Object]` | Pre-existing error serialization bug — not blocking. Check `cron_run_log.error_message` for raw text; debug via `get_logs` MCP tool. |
| Push notifications not arriving | Verify FCM/APNs config in Capacitor. Check device token registration in `device_tokens` table. |
| Build fails | Run `npx tsc --noEmit` to check for type errors |
| `ERROR 42501: permission denied to set parameter "app.settings.*"` | Use Vault + `cron_private.invoke_edge_function` pattern instead of `ALTER DATABASE`. See pg_cron section above. |
| Migration applied in DB but GitHub integration tries to re-apply | Ensure the migration row was inserted into `supabase_migrations.schema_migrations` with the correct version number + empty `statements` array. |
| `supabase db push` hangs or fails to connect | Pooler (port 5432/6543) is blocked from your network. Use the Management API fallback (see "Apply Migrations" section). |
| E2E tests failing | Verify all 7 GitHub Actions secrets are set. Check that the preview URL is accessible. |
| Vercel env vars not taking effect | Confirm the variable's **Environments** column includes Production (not just Preview/Development). Redeploy from Deployments tab after scope changes. |
| Vercel preview URL hits `redirect_uri_mismatch` at Google OAuth | OAuth Authorized JavaScript Origins only include `handledhome.app` + `www.handledhome.app` + `localhost:5173`. Per-preview URLs aren't there. Either (a) add the specific preview URL to Google OAuth, or (b) test on `handledhome.app` (routes to production). |
