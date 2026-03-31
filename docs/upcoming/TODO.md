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

- [ ] **Provider support ticket creation (F24)** — The UI for creating tickets will be added, but the Supabase `support_tickets` table may need an insert policy for provider role if one doesn't exist.
- [ ] **Admin payout schedule (F29)** — UI will show a payout schedule view, but actual payout execution requires Stripe Connect integration on the backend.
- [ ] **Provider earnings/payout data (F21, F26)** — "Set Up Payout Account" button and admin Provider Detail earnings section will link to appropriate pages, but actual Stripe Connect onboarding flow is a backend concern.

## Session 2 Items (2026-03-30)

- [ ] **Edge function integration tests need staging credentials** — Current Deno tests for billing/payout/dunning/checkout only validate CORS and auth guard rejection. Testing actual business logic (billing cycle creation, payout processing) requires valid Supabase service role keys in a staging environment.
  - **Why:** Tests were scoped to what's possible without live credentials
  - **Blocked:** Full payment flow test coverage
- [ ] **SKU calibration values are still seed data** — The SKU Calibration admin page is built but no real provider interviews have been conducted. All duration/cost values remain "guessed" per the seed data audit.
  - **Why:** Requires human provider interviews using the launch playbook interview guide
  - **Blocked:** Accurate pricing and scheduling
- [ ] **Simulation tool is standalone** — The market simulation lives in `tools/market-simulation/` and runs via `npx tsx simulate.ts` or the local HTML UI. It is not integrated into the admin console.
  - **Why:** Designed as an offline planning tool, not a production feature
  - **Blocked:** Nothing — intentional design choice

## Low-Priority Cosmetic (Optional)

- [ ] **ArrowLeft → ChevronLeft icon swap** — Several provider pages use `ArrowLeft` where spec says `ChevronLeft`. Will be fixed in Phase 5 batch if touching those files, but verify after completion.
- [ ] **F5 Onboarding back button** — Same ArrowLeft/ChevronLeft issue on customer onboarding.
