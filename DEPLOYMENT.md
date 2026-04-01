# Deployment Guide — Handled Home

Step-by-step instructions for deploying the Handled Home platform.

---

## Prerequisites

- Node.js 20+
- Supabase project (with database, Auth, Realtime, and Edge Functions enabled)
- Supabase CLI installed (`npm install -g supabase`)
- Stripe account (payments + Connect for provider payouts)
- Resend account (transactional email)
- Mapbox account (zone maps and provider coverage)
- Capacitor CLI (for iOS/Android builds)

---

## 1. Environment Variables

### Client-side (.env)

```env
VITE_SUPABASE_PROJECT_ID="your-project-id"
VITE_SUPABASE_PUBLISHABLE_KEY="your-anon-key"
VITE_SUPABASE_URL="https://your-project-id.supabase.co"
```

These are safe for client-side use — they are public keys only.

### Edge Function Secrets (set via Supabase CLI)

```bash
# Stripe (payments + provider payouts)
supabase secrets set STRIPE_SECRET_KEY=sk_live_your_key
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_your_secret
supabase secrets set STRIPE_RESTRICTED_API_KEY=rk_live_your_key

# Email (Resend)
supabase secrets set RESEND_API_KEY=re_your_api_key

# AI services (Lovable API Gateway)
supabase secrets set LOVABLE_API_KEY=your_lovable_api_key

# Scheduled function auth (required — all cron functions validate this)
supabase secrets set CRON_SECRET=your_random_secret_here

# Mapbox (zone maps)
supabase secrets set MAPBOX_ACCESS_TOKEN=pk.your_mapbox_token
```

`SERVICE_ROLE_KEY` and `SUPABASE_ANON_KEY` are auto-set by Supabase — do not configure manually.

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

There are 183 migrations in `supabase/migrations/` (2026-02-21 through 2026-03-22). Apply them all:

```bash
supabase db push
```

Or apply individually:
```bash
supabase migration up
```

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

There are 36 Edge Functions in `supabase/functions/`. Deploy all at once:

```bash
supabase functions deploy
```

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

```bash
npm install
npm run build
```

The built files are in `dist/`. Deploy to your hosting provider (Vercel, Netlify, Cloudflare Pages, etc.).

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

### Test Account for Reviewers

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

To enable pg_cron:
1. Enable the `pg_cron` extension in Supabase Dashboard > Database > Extensions
2. Enable the `pg_net` extension (required for HTTP calls from pg_cron)
3. Schedule each function via SQL Editor. All scheduled functions now require the service role key in the Authorization header:

```sql
-- Example: run-nightly-planner at 2am UTC daily
SELECT cron.schedule(
  'nightly-planner',
  '0 2 * * *',
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT.supabase.co/functions/v1/run-nightly-planner',
    headers := '{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY", "Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  )
  $$
);

-- run-scheduled-jobs every 15 min
SELECT cron.schedule('scheduled-jobs', '*/15 * * * *', $$ SELECT net.http_post(url := 'https://YOUR_PROJECT.supabase.co/functions/v1/run-scheduled-jobs', headers := '{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY", "Content-Type": "application/json"}'::jsonb, body := '{}'::jsonb) $$);

-- send-reminders daily at 7am
SELECT cron.schedule('send-reminders', '0 7 * * *', $$ SELECT net.http_post(url := 'https://YOUR_PROJECT.supabase.co/functions/v1/send-reminders', headers := '{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY", "Content-Type": "application/json"}'::jsonb, body := '{}'::jsonb) $$);

-- run-billing-automation daily at 3am
SELECT cron.schedule('billing-automation', '0 3 * * *', $$ SELECT net.http_post(url := 'https://YOUR_PROJECT.supabase.co/functions/v1/run-billing-automation', headers := '{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY", "Content-Type": "application/json"}'::jsonb, body := '{}'::jsonb) $$);

-- run-dunning daily at 4am
SELECT cron.schedule('dunning', '0 4 * * *', $$ SELECT net.http_post(url := 'https://YOUR_PROJECT.supabase.co/functions/v1/run-dunning', headers := '{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY", "Content-Type": "application/json"}'::jsonb, body := '{}'::jsonb) $$);

-- check-weather daily at 5am
SELECT cron.schedule('check-weather', '0 5 * * *', $$ SELECT net.http_post(url := 'https://YOUR_PROJECT.supabase.co/functions/v1/check-weather', headers := '{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY", "Content-Type": "application/json"}'::jsonb, body := '{}'::jsonb) $$);

-- snapshot-rollup daily at 1am
SELECT cron.schedule('snapshot-rollup', '0 1 * * *', $$ SELECT net.http_post(url := 'https://YOUR_PROJECT.supabase.co/functions/v1/snapshot-rollup', headers := '{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY", "Content-Type": "application/json"}'::jsonb, body := '{}'::jsonb) $$);

-- compute-quality-scores daily at midnight
SELECT cron.schedule('quality-scores', '0 0 * * *', $$ SELECT net.http_post(url := 'https://YOUR_PROJECT.supabase.co/functions/v1/compute-quality-scores', headers := '{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY", "Content-Type": "application/json"}'::jsonb, body := '{}'::jsonb) $$);

-- cleanup-expired-offers hourly
SELECT cron.schedule('cleanup-offers', '0 * * * *', $$ SELECT net.http_post(url := 'https://YOUR_PROJECT.supabase.co/functions/v1/cleanup-expired-offers', headers := '{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY", "Content-Type": "application/json"}'::jsonb, body := '{}'::jsonb) $$);

-- check-no-shows every 30 min
SELECT cron.schedule('check-no-shows', '*/30 * * * *', $$ SELECT net.http_post(url := 'https://YOUR_PROJECT.supabase.co/functions/v1/check-no-shows', headers := '{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY", "Content-Type": "application/json"}'::jsonb, body := '{}'::jsonb) $$);

-- process-payout weekly Monday 6am
SELECT cron.schedule('weekly-payout', '0 6 * * 1', $$ SELECT net.http_post(url := 'https://YOUR_PROJECT.supabase.co/functions/v1/process-payout', headers := '{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY", "Content-Type": "application/json"}'::jsonb, body := '{}'::jsonb) $$);
```

**Important:** Replace `YOUR_PROJECT` and `YOUR_SERVICE_ROLE_KEY` with your actual values. The service role key is required — all scheduled functions now validate the Authorization header (PRD-001 security hardening).

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Emails not sending | Check `send-email` Edge Function is deployed + `RESEND_API_KEY` secret is set. Without the key, emails are marked SUPPRESSED. |
| Realtime not working | Verify notifications table is in the Realtime publication: `SELECT * FROM pg_publication_tables` |
| Stripe payments failing | Check `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` secrets. Verify webhook endpoint is registered in Stripe dashboard. |
| Maps not rendering | Check `MAPBOX_ACCESS_TOKEN` is set. Verify the token has the correct scopes. |
| AI features not working | Check `LOVABLE_API_KEY` secret is set. `predict-services` and `support-ai-classify` depend on it. |
| Push notifications not arriving | Verify FCM/APNs config in Capacitor. Check device token registration in `device_tokens` table. |
| Build fails | Run `npx tsc --noEmit` to check for type errors |
| E2E tests failing | Verify all 7 GitHub Actions secrets are set. Check that the preview URL is accessible. |
