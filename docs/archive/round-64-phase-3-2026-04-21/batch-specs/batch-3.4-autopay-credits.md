# Batch 3.4 — Autopay toggle + off-session cron top-up

> **Phase:** Round 64 Phase 3 — Credits UX
> **Size:** Medium
> **Review tier:** Medium (3 parallel lanes + synthesis).
> **Branch:** `claude/handled-home-phase-2-YTvlm`
> **Deploy caveat:** same as 3.3 — migration auto-applies on merge via GitHub↔Supabase integration; edge function + pg_cron registration happen server-side. Sandbox can't deploy.

---

## Why this batch exists

Phase 3's PRD calls for an autopay toggle that captures opt-in at the moment of need (not buried in settings) and a cron that charges credits when balance drops below the customer's chosen threshold. This batch wires the UI knob into `subscriptions.metadata.autopay_credits`, adds a new edge function that the cron calls to scan + charge eligible customers off-session, and schedules a daily cron via the existing Vault-backed `cron_private.invoke_edge_function` helper.

## Scope

### New files

- **`src/hooks/useAutopaySettings.ts`** — thin wrapper to read/write `subscriptions.metadata.autopay_credits`. Returns `{ settings, isLoading, save }`. `settings` shape: `{ enabled: boolean, pack_id: CreditPackId, threshold: number } | null`. `save` is a mutation that merges into metadata (not replace). Also invalidates the `subscription` query on success.

- **`src/pages/customer/credits/AutopaySection.tsx`** — UI section rendered at the bottom of the Top-up tab. Layout: Switch + brief copy ("Auto-top up when your balance drops below X") + select for `pack_id` (defaults to `homeowner`) + select for `threshold` (30 / 50 / 100 credits, default 50). Saves on change. Renders a disabled state + help text when the customer has no saved payment method on file (queries `customer_payment_methods` for the current user and hides the enable toggle if none). Uses Radix Select with the `__none__` sentinel per CLAUDE.md conventions — not relevant here because both selects have fixed value sets, but thresholds are integers so no sentinel needed.

- **`supabase/functions/process-credit-pack-autopay/index.ts`** — cron-called edge function.
  - Auth via `requireCronSecret` (accepts service role key OR `CRON_SECRET`).
  - Scans `subscriptions` rows:
    - `status = 'active'`
    - `metadata->'autopay_credits'->>'enabled' = 'true'`
    - `handles_balance < (metadata->'autopay_credits'->>'threshold')::int` (join-side filter)
  - For each eligible subscription:
    1. Resolve the pack from `metadata->'autopay_credits'->>'pack_id'`.
    2. Resolve the Stripe customer id (`subscriptions.stripe_customer_id`). Skip + flag if missing.
    3. Fetch the default `customer_payment_methods` row for the customer. Skip + flag if none.
    4. Resolve Stripe price id from `STRIPE_CREDIT_PACK_<PACK>_PRICE_ID` env var (same vars as Batch 3.3). Skip + flag if missing.
    5. Create a Stripe PaymentIntent:
       - `amount` = pack `priceCents`
       - `currency = 'usd'`
       - `customer = stripe_customer_id`
       - `payment_method = processor_ref`
       - `off_session = true`, `confirm = true`
       - `metadata = { supabase_user_id, subscription_id, pack_id, credits, origin: 'credit_pack_topup_autopay' }`
    6. On success: call `grant_topup_credits` RPC with the PaymentIntent id as the idempotency key. Log to `subscription_events` with `event_type = 'credit_pack_autopay_charged'`.
    7. On failure (card declined, etc.): insert a `billing_exceptions` row with severity=HIGH.
  - Returns `{ processed: n, granted: n, skipped: n, errors: n }`.

### New migration

- **`supabase/migrations/<timestamp>_schedule_credit_pack_autopay_cron.sql`** — registers a daily cron at 07:00 UTC via `cron_private.invoke_edge_function('process-credit-pack-autopay')`. Follows the existing patterns in `20260421050000_round_64_5_repoint_cron_jobs_to_vault.sql` (best-effort unschedule of any prior entry + `SELECT cron.schedule(...)` with the new command).

### Changed files

- **`src/pages/customer/credits/CreditsTopUpTab.tsx`** — renders `<AutopaySection />` below the three pack cards.
- **`docs/upcoming/TODO.md`** — append `process-credit-pack-autopay` deploy + pg_cron verification to the Phase 3 entry.

### Files NOT changed

- `grant_topup_credits` RPC — the autopay path reuses it verbatim (the PaymentIntent id serves as the idempotency key instead of the webhook event id).
- `stripe-webhook/index.ts` — PaymentIntents created off-session don't hit the `checkout.session.completed` branch; the edge function grants credits immediately on PaymentIntent success, not via webhook.
- `purchase-credit-pack/index.ts` — the autopay path doesn't use Checkout Sessions (no user present to fill the page), so it doesn't share a code path with the interactive flow. Acceptable duplication: each flow needs its own Stripe SDK invocation shape.

## Acceptance criteria

1. Autopay toggle on the Credits page writes `subscriptions.metadata.autopay_credits = { enabled, pack_id, threshold }` on change.
2. When the customer has no saved payment method, the toggle is disabled with helper copy.
3. `process-credit-pack-autopay` edge function runs against `requireCronSecret`, scans eligible subscriptions, creates off-session PaymentIntents using the customer's default PM, and on success calls `grant_topup_credits(p_idempotency_key=payment_intent.id)`. On failure, writes `billing_exceptions` (type = `credit_pack_autopay_declined` or `credit_pack_autopay_metadata_invalid` or similar).
4. Successful autopay grant writes a `subscription_events` row with `event_type='credit_pack_autopay_charged'`.
5. Migration registers a daily cron at 07:00 UTC invoking the new edge function via `cron_private.invoke_edge_function`.
6. No frontend changes to other pages.
7. `npx tsc --noEmit` clean. `npm run build` clean. Edge function typechecks cleanly under Deno conventions (no runtime check possible in this sandbox; review confirms).
8. TODO.md updated with the deploy + cron verification checklist.

## Out of scope

- Customer-facing UI for autopay charge receipts (email / notification). Use the existing subscription_events stream; notification routing is future polish.
- Provider earnings / Stripe Connect fanout for topup charges. Top-up credits aren't passed through to providers directly; they're spent on jobs later and paid out via the existing weekly-payout path.
- Retry logic on transient card declines. billing_exceptions.status=OPEN surfaces it for ops; automated retry is a future batch.
- Updating `customer_invoices` with autopay charge records. Defer — the subscription_events + billing_exceptions surfaces are enough for v1.
- Admin dashboard surfaces for autopay failures (admins query billing_exceptions manually for now).

## Risks

- **Off-session charge 3DS challenges:** Stripe may require the customer to re-authenticate for SCA-protected cards. The PaymentIntent status will be `requires_action`. Edge function writes billing_exceptions with severity=HIGH and stops — no retry. User flow: they need to manually top up on the Credits page, which re-authenticates via Checkout.
- **pg_cron Vault secret dependency:** the `cron_private.invoke_edge_function` helper reads `service_role_key` from `vault.secrets`. If that's missing, the cron errors. Existing Round 64.5 cron migration covers this — we're just piggybacking.
- **Race condition with manual top-up:** customer clicks Buy and cron fires at the same instant. Idempotency is per-PaymentIntent id, so each call grants once. Balance math is serialized via `FOR UPDATE` in `grant_topup_credits`. Safe.
- **`STRIPE_CREDIT_PACK_*_PRICE_ID` env vars** — autopay reuses these. Same TODO.md pending setup.
- **PaymentIntent amount must equal pack price in cents** — hardcoded in `creditPacks.ts` frontend and PACK_CREDITS / pack_prices server-side must stay in sync. Add a short shared-constants note in the edge function pointing to `creditPacks.ts`.

## Review checklist

- Lane 1: each AC 1–8 has an implementation.
- Lane 2: null safety on autopay settings read; Switch disabled state when no payment method; edge function auth (requireCronSecret); safe JSON parsing of metadata; idempotency (PaymentIntent.id); billing_exceptions insert shape; dark-mode colors; Tailwind `warning` vs `warn`.
- Lane 3: confirm no existing autopay scaffolding the new code duplicates; confirm cron scheduling pattern matches `20260421050000`; confirm the new `metadata.autopay_credits` shape doesn't collide with any prior Phase 2 use of `subscriptions.metadata`.
- Lane 4: synthesis + scoring.
