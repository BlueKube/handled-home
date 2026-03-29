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
# Sync web assets to native projects
npx cap sync

# Open in Xcode (iOS)
npx cap open ios

# Open in Android Studio (Android)
npx cap open android
```

Push notifications require FCM (Android) and APNs (iOS) configuration in the respective consoles.

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
2. Schedule each function via SQL (see Supabase docs for `cron.schedule` + `net.http_post` pattern)

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
