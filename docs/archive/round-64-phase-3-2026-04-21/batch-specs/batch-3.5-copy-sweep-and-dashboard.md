# Batch 3.5 — Copy sweep "handle(s)" → "credit(s)" + Dashboard wire-up

> **Phase:** Round 64 Phase 3 — Credits UX
> **Size:** Medium
> **Review tier:** Medium (3 parallel lanes + synthesis).
> **Branch:** `claude/handled-home-phase-2-YTvlm`

---

## Why this batch exists

Final Phase 3 batch. Flips the remaining customer-visible "handle" copy to "credit", wires `CreditsRing` (compact) + `LowCreditsBanner` onto the Dashboard in place of `HandleBalanceBar`, and deletes the legacy bar once unused. Internal code (hook names like `useHandleBalance`, DB tables like `handle_transactions`, API payload string keys) stays untouched per PRD decision — the rename is customer-facing text only.

## Scope

### Changed files — customer-visible copy

- **`src/components/plans/HandlesExplainer.tsx`** — rename the *file* to `CreditsExplainer.tsx` and the exported component to `CreditsExplainer`. Update header to "How credits work", bullets to say "credits" throughout, keep Sparkles icon. Update both callers (`Plans.tsx`, `PlanStep.tsx`).

- **`src/pages/customer/Dashboard.tsx`** — replace the `HandleBalanceBar` block with a compact `CreditsRing` inline in the existing row + a `LowCreditsBanner` rendered above the ring. Balance section heading changes "Handle Balance" → "Credits balance"; HelpTip copy rewritten to speak in "credits" terms. `CycleStatsRow` prop names (`handlesUsed`, `handlesPerCycle`) stay internal but pass the same data.

- **`src/pages/customer/PlanDetail.tsx`** — lines 84–94 and 165 swap "handles" → "credits" in user-visible strings. Comments stay (internal).

- **`src/pages/customer/HomeAssistant.tsx`** — lines 126, 151, 239: "X handles" / "Use X Handles" → "X credits" / "Use X credits". Internal function parameter string `"handles"` in `handleBook` stays (API boundary).

- **`src/components/customer/ThisCycleSummary.tsx`** — line 60: "handles used this cycle" → "credits used this cycle".

- **`src/components/customer/SchedulingPreferences.tsx`** — line 85: "increase handle cost" → "increase credit cost".

- **`src/components/customer/AddonSuggestionsCard.tsx`** — lines 74, 98: "pay with handles or card" / "X handles" → "pay with credits or card" / "X credits". Internal `paymentMethod: "handles" | "cash"` string union stays (API boundary).

### Deleted files

- **`src/components/customer/HandleBalanceBar.tsx`** — only caller was `Dashboard.tsx`; removed there.

### Unchanged (intentional)

- **`src/pages/customer/Plans.tsx:193`** — "we handle the rest" is brand wordplay, not a credit reference.
- **`src/pages/customer/Subscription.tsx:45`** — same wordplay.
- **`src/pages/customer/SupportNew.tsx:135`** — comment only.
- **`src/hooks/useHandles.ts`**, `useHandleBalance`, `usePlanHandlesConfig` — internal names. No rename.
- **`handle_transactions` table**, `handles_balance`, `handle_cost` columns — DB contract. No rename.
- **API payloads** — edge functions still accept/return `handles` naming for back-compat.

## Acceptance criteria

1. Grep `src/pages/customer/**/*.tsx src/components/customer/**/*.tsx src/components/plans/**/*.tsx` for `\bhandles?\b` in JSX text or attribute strings returns zero matches outside the two idiomatic "we handle the rest" lines and a single code comment.
2. `CreditsExplainer` replaces `HandlesExplainer` at both call sites (`Plans.tsx`, `PlanStep.tsx`). Old file deleted.
3. Dashboard no longer imports `HandleBalanceBar`. Compact `CreditsRing` renders in its place, with `annualCap` derived from `subscription.billing_cycle_length_days` (when present) + `planHandles.handles_per_cycle` per the Credits.tsx computation. `LowCreditsBanner` renders above the ring and takes the same `annualCap`.
4. `HandleBalanceBar.tsx` deleted.
5. HelpTip on Dashboard balance section speaks in "credits" terms.
6. `npx tsc --noEmit` clean. `npm run build` clean.
7. No internal (non-user-facing) identifiers renamed: `useHandleBalance`, `usePlanHandlesConfig`, `handles_balance`, etc. remain.

## Out of scope

- Backend hook or DB rename (PRD decision).
- Tests (none in this repo structure for the touched components).
- Emoji / icon swap from `Sparkles` to something credit-specific — stays.
- LowCreditsBanner dismissal persistence (localStorage) — defer; the `onDismiss` callback is wired but just clears local state for the session. A future batch can add a `banner_dismissals` table or a localStorage key if product decides.

## Risks

- **Idiomatic wordplay collisions:** "we handle the rest" uses the brand verb. Search must distinguish `\bhandles?\b` (noun, to replace) from `handle` in "we handle X" (verb, keep). Use a targeted grep of the JSX strings only.
- **CycleStatsRow prop names are "handles"** — those are internal API; the user-facing string inside CycleStatsRow does the final translation. Check that component.
- **CreditsRing on Dashboard sizing:** compact variant is 72×72. Fits inline with "Credits balance" label. If design requires the old bar's width, the banner+ring stack is a visual change — explicitly documented so review doesn't flag it as regression.
- **LowCreditsBanner annualCap requirement:** requires `annualCap > 0`. When `billing_cycle_length_days` is null, `annualCap = 0` and the banner never fires. Acceptable — no threshold math we can do without the cycle length.

## Review checklist

- Lane 1: AC 1–7 with grep-able evidence.
- Lane 2: visual regression on Dashboard (CreditsRing + banner replace bar); HelpTip copy clarity; no light-only Tailwind; no stale `handle` noun in user-facing strings; HandleBalanceBar truly deleted (imports clean).
- Lane 3: git history on the touched files — confirm no prior intentional use of "handles" noun that's part of a brand style we're regressing.
- Lane 4: synthesis + score.
