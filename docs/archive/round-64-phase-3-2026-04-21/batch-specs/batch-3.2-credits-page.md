# Batch 3.2 — `/customer/credits` page (Top up · History · How it works)

> **Phase:** Round 64 Phase 3 — Credits UX
> **Size:** Medium
> **Review tier:** Medium (3 parallel lanes + synthesis). Lane 3 runs — Dashboard + handles-adjacent files have review history.
> **Branch:** `claude/handled-home-phase-2-YTvlm`

---

## Why this batch exists

Batch 3.1 built the `CreditsRing` + `LowCreditsBanner` primitives. Batch 3.2 builds the home for them — the dedicated `/customer/credits` page accessible from the More menu. Three tabs: Top up (pack selector), History (transaction list), How it works (explainer). The page hero shows the ring + cycle reset date. The purchase flow is wired to a (not-yet-deployed) `purchase-credit-pack` edge function that lands in Batch 3.3; until then, the Stripe invocation fails gracefully with an error toast.

## Scope

### New files

- **`src/pages/customer/Credits.tsx`** — page shell.
  - Queries: `useCustomerSubscription()`, `useHandleBalance()`, `usePlanHandlesConfig(plan_id)`.
  - Computes `annualCap = handles_per_cycle * (365 / billing_cycle_length_days)` (rounded to nearest integer). `billing_cycle_length_days` defaults to 28 per the DB column default — annual cap ≈ `handles_per_cycle * 13`.
  - Hero: `CreditsRing variant="hero"` + balance, cap, and cycle-reset date ("Resets Mar 21").
  - Renders `<Tabs defaultValue="topup">` with three `TabsTrigger`s.
  - Delegates tab content to sub-components (below) to keep the page under 300 lines.

- **`src/pages/customer/credits/CreditsTopUpTab.tsx`** — pack selector.
  - Reads `CREDIT_PACKS` from `src/lib/creditPacks.ts` (catalog constants).
  - Renders three cards: Starter (300 credits · $149), Homeowner (600 credits · $269, recommended), Year-round (1200 credits · $479).
  - Each card shows credits, price, per-credit rate (displayed as "$0.50 / credit"), and a "Save X%" pill on the two larger packs vs the Starter baseline.
  - Confirm button invokes `supabase.functions.invoke("purchase-credit-pack", { body: { pack_id, success_url, cancel_url, customer_email } })`. On response with `data.url`, `window.location.href = data.url`. On error, `toast.error("Couldn't start checkout. Please try again.")`.
  - Notes: until Batch 3.3 deploys the edge function + TODO.md Stripe price IDs are set, invocation returns an error — surfaced to the user via the existing toast pattern.

- **`src/pages/customer/credits/CreditsHistoryTab.tsx`** — transaction list.
  - Queries `handle_transactions` filtered by `subscription_id` ordered `created_at` desc, limit 50.
  - Maps `txn_type` + `metadata.origin` to a human label:
    - `grant` + `metadata.origin='topup'` → "Topped up"
    - `grant` + other → "Monthly allowance" (or "Credited" if no reference)
    - `spend` → "Spent" (append `metadata.sku_name` if present)
    - `expire` → "Expired"
    - `rollover` → "Rolled over"
    - `refund` → "Refunded"
  - Group by month header (using `date-fns format`).
  - Empty state: "No credit activity yet."

- **`src/pages/customer/credits/CreditsHowItWorksTab.tsx`** — static explainer.
  - Three sections: "What are credits?", "How they stretch", "When they reset". Plain paragraphs + bullet lists. Uses `HandlesExplainer` as styling inspiration but with "credits" copy throughout.

- **`src/lib/creditPacks.ts`** — pack catalog constants.
  - Exports `CREDIT_PACKS`: array of `{ id: 'starter' | 'homeowner' | 'year_round', name, credits, priceCents, priceText, perCreditText, recommended?, savingsPct? }`.
  - Hardcoded for now. Stripe price IDs live in env vars (`VITE_CREDIT_PACK_<ID>_PRICE_ID`) and are read in Batch 3.3's edge function, not the frontend — per CLAUDE.md §13 ("Never put API keys in VITE_ variables") the UI only knows pack ids, not price ids.

### Files changed

- **`src/App.tsx`** — register `/customer/credits` route with `lazy(() => import("@/pages/customer/Credits"))`. Follow the existing pattern (`CustomerPropertyGate` wrapper).

- **`src/components/MoreMenu.tsx`** — add a "Credits" entry to the customer `"Account"` section between "Plans & Subscription" and "Property". Icon: `Zap` from lucide-react (already-common across the app; add the import).

### Files NOT changed

- **`Dashboard.tsx`** — does not swap `HandleBalanceBar` for `CreditsRing` yet. That's Batch 3.5 (cross-cutting copy sweep).
- **`HandleBalanceBar.tsx`** — untouched; retired in Batch 3.5.
- **`supabase/functions/`** — no function changes. Batch 3.3 writes the edge function.
- **Database migrations** — none.

## Acceptance criteria

1. `/customer/credits` route exists and is lazy-loaded under `ProtectedRoute requiredRole="customer"` + `CustomerPropertyGate`.
2. Route is reachable from the More menu → Account → Credits.
3. Hero renders `CreditsRing variant="hero"` with the live balance. `annualCap` computed from the customer's active plan config.
4. Hero shows the cycle reset date as "Resets MMM d" (fallback to "—" if subscription missing).
5. Three tabs (`topup`, `history`, `howitworks`) with triggers labeled "Top up", "History", "How it works".
6. Top-up tab renders three pack cards from `CREDIT_PACKS`. Recommended pack (Homeowner) gets a ribbon/highlight. Per-credit rate shown on each.
7. Tapping a pack's Buy button invokes `purchase-credit-pack`. Success: redirect to `data.url`. Failure: error toast.
8. History tab renders transactions grouped by month with correct labels per `txn_type` + `metadata`.
9. How-it-works tab renders three explainer sections using "credits" copy.
10. No component exceeds 300 lines.
11. `npx tsc --noEmit` clean. `npm run build` clean.
12. Empty states: History with no transactions; pack Buy button disabled while `purchasing`; no-subscription state on the page falls back to a friendly redirect to Plans.

## Out of scope

- Autopay toggle (Batch 3.4).
- `purchase-credit-pack` edge function (Batch 3.3).
- Dashboard swap to `CreditsRing` + wiring `LowCreditsBanner` (Batch 3.5).
- Copy sweep of remaining "handle(s)" strings (Batch 3.5).
- Seed migration for credit packs — they stay hardcoded until product decides otherwise.
- Deep-linking `?tab=history` etc. — defer if it complicates the page.

## Risks

- **Missing subscription:** page must guard for customers without a subscription. Redirect to `/customer/plans?gated=1` with a friendly note, or show an empty hero + disabled tabs.
- **Missing `plan_handles` row:** some plans may not yet have configured handles. Fall back to `perCycle = 0, annualCap = 0` — ring renders empty-state colors correctly.
- **Purchase invocation before 3.3 ships:** expected failure; user-facing toast is informative. Document as known pending state in plan.md.
- **Page line count:** with three tabs inline, Credits.tsx can blow past 300 lines. Mitigated by the three sub-components.

## Review checklist

- Lane 1: 12 acceptance criteria → each has an implementation.
- Lane 2: null safety on subscription / plan_handles queries; `handle_transactions` query tokenized on `subscription_id`; Tabs default value + accessibility; Stripe invocation error handling; Tailwind token correctness (no light-only bg); any `as any`; dead imports; page line counts.
- Lane 3: `git log` / `git blame` on Dashboard.tsx + MoreMenu.tsx to confirm route additions don't conflict with recent routing changes; `git log` on `useHandles.ts` + `useSubscription.ts` to confirm we're using them as intended; check any prior "credits/handles" migration that may require attention.
- Lane 4: synthesis + scoring.
