# Edge Function Inventory

> Complete list of deployed edge functions with trigger types, required secrets, and status.  
> **Last updated:** 2026-02-26

| Function | Trigger | Schedule | Required Secrets | Status |
|----------|---------|----------|-----------------|--------|
| `assign-jobs` | Cron / Manual | Daily | — | ✅ Deployed |
| `check-no-shows` | Cron | Hourly | — | ✅ Deployed |
| `check-weather` | Cron | Every 6h | `WEATHER_API_KEY` | ✅ Deployed |
| `cleanup-expired-offers` | Cron | Hourly | — | ✅ Deployed |
| `create-checkout-session` | API (client) | — | `STRIPE_SECRET_KEY` | ✅ Deployed |
| `create-connect-account` | API (client) | — | `STRIPE_SECRET_KEY` | ✅ Deployed |
| `create-connect-account-link` | API (client) | — | `STRIPE_SECRET_KEY` | ✅ Deployed |
| `create-portal-session` | API (client) | — | `STRIPE_SECRET_KEY` | ✅ Deployed |
| `create-setup-intent` | API (client) | — | `STRIPE_SECRET_KEY` | ✅ Deployed |
| `evaluate-provider-sla` | Cron | Daily | — | ✅ Deployed |
| `evaluate-zone-expansion` | Cron | Weekly | — | ✅ Deployed |
| `join-waitlist` | API (public) | — | — | ✅ Deployed |
| `optimize-routes` | Cron / Manual | Daily | — | ✅ Deployed |
| `process-payout` | Cron | Weekly (Mon) | `STRIPE_SECRET_KEY` | ✅ Deployed |
| `run-billing-automation` | Cron | Daily | `STRIPE_SECRET_KEY` | ✅ Deployed |
| `run-dunning` | Cron | Daily | `STRIPE_SECRET_KEY` | ✅ Deployed |
| `snapshot-rollup` | Cron | Daily 02:00 UTC | — | ✅ Deployed |
| `stripe-webhook` | Webhook (Stripe) | — | `STRIPE_WEBHOOK_SECRET` | ✅ Deployed |
| `support-ai-classify` | API (client) | — | AI model key | ✅ Deployed |
| `validate-photo-quality` | API (internal) | — | — | ✅ Deployed |

### JWT Verification

Functions that accept unauthenticated requests have `verify_jwt = false` in `supabase/config.toml`:
- `create-checkout-session`, `stripe-webhook`, `create-portal-session`, `cleanup-expired-offers`, `create-setup-intent`, `create-connect-account`, `create-connect-account-link`, `process-payout`, `run-billing-automation`, `support-ai-classify`, `snapshot-rollup`, `run-dunning`, `check-weather`, `evaluate-zone-expansion`, `compute-zone-state-recommendations`, `route-sequence`

### Planned (Not Yet Deployed)
| Function | Purpose | Sprint |
|----------|---------|--------|
| *(none — all planned functions deployed)* | | |

### Recently Added
| Function | Trigger | Schedule | Required Secrets | Status |
|----------|---------|----------|-----------------|--------|
| `process-notification-events` | Cron / Manual | Every min | — | ✅ Deployed |
| `send-email` | Internal (called by processor) | — | `RESEND_API_KEY`, `RESEND_FROM_EMAIL` | ✅ Active |
| `generate-zones` | API (admin) | — | — | ✅ Deployed |
| `commit-zones` | API (admin) | — | — | ✅ Deployed |
| `compute-zone-state-recommendations` | Cron / Manual | Nightly | — | ✅ Deployed |
| `route-sequence` | Cron / Manual | Nightly | — | ✅ Deployed |
