# Batch 3.1 — `CreditsRing` + `LowCreditsBanner` components

> **Phase:** Round 64 Phase 3 — Credits UX
> **Size:** Medium
> **Review tier:** Medium (3 parallel lanes + synthesis). Lane 3 skipped — first batch in Phase 3, no prior review findings on the two new files.
> **Branch:** `claude/handled-home-phase-2-YTvlm` (continuing)

---

## Why this batch exists

The v2 storyboards upgrade the flat `HandleBalanceBar` into a richer "what's left" surface: a ring visualization for the Dashboard and the dedicated credits page (Batch 3.2), plus a low-balance nudge banner that fires before the customer runs out. These are pure presentation components — no data fetching, no navigation — so the visual language can be agreed on and reused across the remaining Phase 3 batches without re-fighting it.

## Scope

### New files

- **`src/components/customer/CreditsRing.tsx`** — SVG-based circular progress arc with a large center number and sub-label.
  - Props:
    - `balance: number` — remaining credits.
    - `perCycle: number` — credits per billing cycle (used for the inner ring / current cycle).
    - `annualCap?: number` — total annual cap (used for outer reference / label "of N / yr"). If omitted, label falls back to `"of ${perCycle} / cycle"`.
    - `variant?: 'compact' | 'hero'` — `'compact'` = 72×72 px (Dashboard), `'hero'` = 180×180 px (Credits page). Defaults to `'compact'`.
    - `label?: string` — override for the sub-label. Default derives from `annualCap ?? perCycle`.
    - `className?: string` — caller layout override.
  - Visual:
    - SVG `<circle>` ring with `stroke-dasharray` computed from `balance / (annualCap || perCycle)` clamped to `[0, 1]`.
    - Stroke color = `text-accent` (on-brand) when `balance >= 20%` of cap, `text-warning` when `< 20%`, `text-destructive` when `balance <= 0`.
    - Background ring: `stroke-muted` at reduced opacity.
    - Center stack: large number (`balance`), below it a small muted label.
    - Hero variant: adds a smaller ring inside showing *cycle* progress when `annualCap > perCycle` (so customer sees both cycle-level and annual-level).
  - Accessibility:
    - `role="img"` + `aria-label="${balance} credits remaining${annualCap ? ' of ' + annualCap + ' per year' : ' of ' + perCycle + ' per cycle'}"`.
    - Tests pass through to the `role="img"` via screen reader announcement.
  - "Credits", not "handles" — per Phase 3 copy guidance.

- **`src/components/customer/LowCreditsBanner.tsx`** — inline banner that renders *only* when the balance crosses the low threshold.
  - Props:
    - `balance: number`.
    - `annualCap: number` — needed to compute the 20% threshold.
    - `onTopUp?: () => void` — primary CTA ("Top up credits"). When present, renders the button.
    - `onDismiss?: () => void` — "Later" ghost button. When present, renders the button and fires when tapped.
  - Behavior:
    - Renders nothing when `balance >= 0.2 * annualCap` OR `annualCap <= 0`.
    - Impact-framed copy: headline `"Running low"`, body `"Top up to avoid pausing work on your home."` — never loss-framed.
    - Uses `bg-warning/10 border-warning/30` (dark-mode safe). Icon: `AlertCircle` in `text-warning`.
  - Accessibility:
    - `role="status"` on the wrapper so screen readers announce the nudge.
    - Both buttons have clear labels.

### Files NOT changed

- `HandleBalanceBar.tsx` — stays in place, consumed by `Dashboard.tsx`. Copy sweep + replacement with `CreditsRing` on Dashboard is Batch 3.5 (copy) and implicitly Batch 3.2 (credits page landing) — not this batch.
- `Dashboard.tsx` — unchanged. Don't wire the new banner here yet; wiring is Batch 3.5's job.
- No DB migration. No edge function. No hooks.

## Acceptance criteria

1. `CreditsRing` renders a valid SVG for `variant='compact'` and `variant='hero'`.
2. Color transitions correctly at the 20% threshold and the 0 threshold (three states: healthy / low / exhausted).
3. When `annualCap` is omitted, the label reads `"of N / cycle"` using `perCycle`; otherwise `"of N / yr"`.
4. Hero variant shows both outer-annual + inner-cycle rings when `annualCap > perCycle`.
5. `LowCreditsBanner` returns `null` when `balance >= 0.2 * annualCap`.
6. `LowCreditsBanner` returns `null` when `annualCap <= 0` (defensive).
7. Both CTAs are optional and render only when their callback is provided.
8. All copy uses "credits", not "handles" (even the `aria-label`).
9. `npx tsc --noEmit` clean. `npm run build` clean.

## Out of scope

- Wiring either component into a page (Batches 3.2, 3.5).
- Persistence of the 7-day dismiss preference for the banner (Batch 3.2/3.5 decides where localStorage key lives).
- Replacing `HandleBalanceBar` with `CreditsRing` on Dashboard (Batch 3.5).
- Stripe / autopay / edge function work (Batches 3.3, 3.4).

## Risks

- **SVG math:** `stroke-dasharray` / `stroke-dashoffset` math can go sideways at edge cases (negative balance, balance > cap for rollover situations). Cover these with explicit clamp to `[0, 1]` on the fill ratio so the ring never paints more than a full circle.
- **Tailwind `warning` color:** project uses `warning` not `warn` (CLAUDE.md §13). Verify `text-warning` / `bg-warning/10` tokens exist in `tailwind.config.ts` — if they don't, fall back to `text-amber-500` / `bg-amber-500/10` (dark-first variants).

## Review checklist

- Lane 1: all 9 acceptance criteria implemented.
- Lane 2: SVG math edge cases; Tailwind token correctness (`warning`); dark-mode color safety; accessibility (`role`, `aria-label`, focus-visible on buttons); no `as any`; no dead imports; no inline business logic outside the threshold helpers.
- Lane 3: skipped (first batch in Phase 3; new files with no prior history). `[OVERRIDE: first batch in Phase 3, no prior review findings]`
- Lane 4: synthesis + scoring.
