# Batch 3.3 — `purchase-credit-pack` edge function + webhook + topup RPC

> **Phase:** Round 64 Phase 3 — Credits UX
> **Size:** Large
> **Review tier:** Large (3 lanes + Sonnet synthesis + Haiku second-opinion = 5 agents) — new edge function + Stripe integration + migration + webhook extension is the exact cross-cutting risk profile Large reviews exist for.
> **Branch:** `claude/handled-home-phase-2-YTvlm`
> **Deploy caveat:** this sandbox has no Supabase/Stripe/Vercel creds. Code is written + tsc/build-clean; deployment (and Stripe product setup) is a user task — already captured in `docs/upcoming/TODO.md`.

---

## Why this batch exists

Batch 3.2 wired the frontend to call `purchase-credit-pack`. This batch writes the backend: a new edge function that creates a Stripe one-off payment checkout for a credit pack, a migration for a `grant_topup_credits` SECURITY DEFINER RPC that mirrors `grant_cycle_handles` for top-up grants, and a targeted extension to `stripe-webhook` that calls the RPC on successful pack purchase.

## Scope

### New files

- **`supabase/migrations/<timestamp>_grant_topup_credits.sql`** — creates the RPC.
  - Signature: `grant_topup_credits(p_subscription_id uuid, p_customer_id uuid, p_credits int, p_pack_id text, p_idempotency_key text)` returns `jsonb`.
  - Idempotent: if `handle_transactions` already has a row with matching `metadata->>'idempotency_key'`, return `{success:true, skipped:true}`.
  - Locks the subscription row (`SELECT ... FOR UPDATE`), computes new balance = old + credits, inserts `handle_transactions` row with `txn_type='grant'`, `reference_type='topup'`, `expires_at=NULL` (top-up credits don't expire while the subscription is active), metadata `{origin:'topup', pack_id, idempotency_key}`.
  - Updates `subscriptions.handles_balance` + `updated_at`.
  - `SECURITY DEFINER`, `SET search_path = public`.
  - `GRANT EXECUTE ... TO service_role` (not authenticated — only the webhook calls this).

- **`supabase/functions/purchase-credit-pack/index.ts`** — new edge function.
  - Uses `requireUserJwt` from `_shared/auth.ts` for auth.
  - Uses `corsHeaders` from `_shared/cors.ts`.
  - Body: `{ pack_id, customer_email, success_url, cancel_url, customer_id? }`. (`customer_id` is derivable from JWT, but mirrors the existing `create-checkout-session` style for consistency.)
  - Validates `pack_id` against the hardcoded catalog (`starter | homeowner | year_round`). Rejects unknown ids with a 400.
  - Resolves pack → Stripe price id from env: `STRIPE_CREDIT_PACK_${PACK_ID}_PRICE_ID` (uppercased, e.g., `STRIPE_CREDIT_PACK_HOMEOWNER_PRICE_ID`). If the env var is missing, return `{ url: null, message: "Credit pack checkout not yet configured" }` so the frontend surfaces the correct "not available yet" toast. This matches `create-checkout-session`'s dev-fallback pattern (line 56–60 of that file).
  - Looks up the user's active subscription row (needed in `session.metadata.subscription_id` so the webhook can grant credits).
  - Finds or creates the Stripe customer by email (mirroring `create-checkout-session`).
  - Creates a Stripe checkout session in `mode: 'payment'` with `line_items: [{ price, quantity: 1 }]`, `customer: customerId`, `payment_intent_data.metadata` matching the top-level `metadata` for robustness:
    - `supabase_user_id`: userId
    - `subscription_id`: active subscription id
    - `pack_id`: pack id
    - `credits`: credits count (as string)
    - `origin`: `'credit_pack_topup'` (the webhook key)
  - Returns `{ url: session.url }` on success, otherwise the "not configured" shape above.
  - Error handling mirrors `create-checkout-session`: `try/catch` → 500 JSON.

### Changed files

- **`supabase/functions/stripe-webhook/index.ts`** — extend the existing `checkout.session.completed` handler.
  - Keep the current path (subscription create) unchanged when `session.mode === 'subscription'`.
  - Add a new branch when `session.mode === 'payment'` AND `session.metadata.origin === 'credit_pack_topup'`:
    - Read `subscription_id`, `supabase_user_id`, `pack_id`, `credits` from metadata (coerce `credits` to int).
    - Call `supabase.rpc('grant_topup_credits', { p_subscription_id, p_customer_id: supabase_user_id, p_credits: credits, p_pack_id: pack_id, p_idempotency_key: event.id })`.
    - Log + continue per existing webhook logging style (`logStep` helper).
    - Mark `payment_webhook_events.processed = true` on success (existing pattern applies).
  - Any other event types remain unchanged.

- **`docs/upcoming/TODO.md`** — append a human action item: "Create Stripe products for the three credit packs with price ids; add `STRIPE_CREDIT_PACK_STARTER_PRICE_ID` / `_HOMEOWNER_PRICE_ID` / `_YEAR_ROUND_PRICE_ID` to Supabase Edge Function Secrets."

### Files NOT changed

- Frontend (Credits.tsx, CreditsTopUpTab.tsx, etc.) — already wired in Batch 3.2.
- `handle_transactions` table schema — no new columns needed; existing jsonb `metadata` carries `pack_id` + `idempotency_key` + `origin`.

## Acceptance criteria

1. Migration creates a working `grant_topup_credits` RPC per the signature above. Idempotent on `metadata->>'idempotency_key'`. Inserts a `handle_transactions` row with `txn_type='grant'`, `reference_type='topup'`, `expires_at IS NULL`. Updates `subscriptions.handles_balance`.
2. `purchase-credit-pack` edge function validates `pack_id`, requires a user JWT, returns `{url: null, message: ...}` when pack price id env var missing, returns `{url: session.url}` when configured, 400 on invalid pack id, 500 on internal error.
3. Stripe session metadata carries `supabase_user_id`, `subscription_id`, `pack_id`, `credits`, `origin='credit_pack_topup'`.
4. `stripe-webhook` routes `checkout.session.completed` where `mode==='payment' && metadata.origin==='credit_pack_topup'` to `grant_topup_credits(p_idempotency_key=event.id)`. Does not break the existing subscription path.
5. No frontend changes — Batch 3.2 already calls the new edge function.
6. TODO.md entry for the human Stripe setup exists.
7. `npx tsc --noEmit` clean. `npm run build` clean. (Edge function typechecks are Deno-style; the build command is frontend-only.)

## Out of scope

- Deployment. Sandbox lacks the creds; user runs `supabase functions deploy purchase-credit-pack` + applies the migration via GitHub↔Supabase integration on merge.
- Autopay (Batch 3.4).
- Refund-on-chargeback flow. The existing `handle_transactions` `refund` path would need to be wired to Stripe refund webhooks; deferred unless product asks.
- Pricing tier audits / margin analysis on the three packs. Numbers land in `creditPacks.ts`; adjusting them is a price-change task.

## Risks

- **Idempotency key collisions:** Stripe retries the webhook; we key on `event.id`. `grant_cycle_handles` keys on a caller-supplied `idempotency_key`. Match the existing idempotency check pattern (`metadata->>'idempotency_key'`).
- **Subscription lookup:** customer must have an active subscription *before* they can top up. If not, edge function returns 409 `{error: "Active subscription required"}`. UI today doesn't guard this pre-invocation — acceptable; the toast surfaces the error.
- **Pack price id naming:** `STRIPE_CREDIT_PACK_${UPPER(pack_id)}_PRICE_ID` — note `year_round` → `YEAR_ROUND` (underscore preserved). Document explicitly in TODO.md.
- **Stripe mode coupling:** `payment` vs `subscription` — the webhook must branch on BOTH `mode` and `metadata.origin` to avoid routing a plan subscription accidentally to `grant_topup_credits`.
- **RLS on `handle_transactions`:** service role bypasses RLS. The RPC is `SECURITY DEFINER` so no extra policy is needed for insert.
- **`handles_balance` concurrency:** `FOR UPDATE` lock on the subscription row prevents race with `spend_handles` / `grant_cycle_handles` / `refund_handles`.

## Review checklist

- Lane 1: each AC 1–7 has an implementation.
- Lane 2: SQL correctness (idempotency exists-clause, balance update arithmetic, lock + transaction boundaries), edge function auth flow (rejects missing JWT, rejects unknown pack_id, returns correct shapes), webhook branching (doesn't drop subscription path), metadata coercion (credits string→int), no secret leakage in logs, no `as any` past what existing style allows.
- Lane 3: diff against `grant_cycle_handles` to confirm structural parity; `stripe-webhook/index.ts` history to confirm the new branch doesn't regress Round 64.5's `transfer.created/reversed` updates; `handle_transactions` schema history to confirm no column drift.
- Lane 4 (Sonnet synth): cross-validate findings.
- Lane 5 (Haiku second-opinion): fast-scan of the final report for anything missed.
