# Deferred Items — For Human Action

Items that require API keys, backend changes, or design decisions beyond frontend gap closure. These are left for the owner to complete after the automated batch work.

## API Key / External Service Setup

- [ ] **CRON_SECRET** — Set as a Supabase Edge Function secret. All 19 scheduled functions now require this secret (or the service role key) in the Authorization header. Generate a strong random string and set via: `supabase secrets set CRON_SECRET=your-secret-here`. Also update pg_cron jobs to include the service role key in their Authorization headers.
  - **Why:** PRD-001 Batch 3 added auth to all scheduled Edge Functions. Without CRON_SECRET configured, pg_cron jobs will fail with 401.
  - **Blocked:** All scheduled Edge Functions (nightly planner, billing automation, dunning, payouts, quality scores, etc.)
- [ ] **Mapbox GL API key** — Needed for F17 Onboarding coverage zone map and F23 Provider Coverage zone map. The `MapboxZoneSelector` component will be built but requires a valid Mapbox access token in environment config to render interactive maps.
- [ ] **Stripe publishable key + backend `create-setup-intent` edge function** — F13 Billing uses Stripe Elements for card collection. The UI will be built but needs a working Stripe key and backend intent creation to actually collect cards.

## Design Decisions (Needs Human Input)

- [ ] **F22 Performance vs Quality page merge** — Screen-flows spec describes one combined screen, but the codebase has two separate pages (`ProviderPerformancePage` + `ProviderQualityPage`). Decide whether to merge into one page or update the spec.
- [ ] **F30 K-factor summary on Admin Support** — Requires analytics pipeline data (ticket resolution rates, NPS scores, etc.) that doesn't exist in the current schema. Decide whether to add the analytics backend or remove from spec.

## Backend / Schema Gaps

- [ ] **Provider support ticket creation (F24)** — The UI for creating tickets will be added, but the Supabase `support_tickets` table may need an insert policy for provider role if one doesn't exist.
- [ ] **Admin payout schedule (F29)** — UI will show a payout schedule view, but actual payout execution requires Stripe Connect integration on the backend.
- [ ] **Provider earnings/payout data (F21, F26)** — "Set Up Payout Account" button and admin Provider Detail earnings section will link to appropriate pages, but actual Stripe Connect onboarding flow is a backend concern.

## Low-Priority Cosmetic (Optional)

- [ ] **ArrowLeft → ChevronLeft icon swap** — Several provider pages use `ArrowLeft` where spec says `ChevronLeft`. Will be fixed in Phase 5 batch if touching those files, but verify after completion.
- [ ] **F5 Onboarding back button** — Same ArrowLeft/ChevronLeft issue on customer onboarding.
