# B1 — Handles Currency Polish

## Issues to Fix

### 1. HandleBalanceBar progress overflow (MUST-FIX)
**File:** `src/components/customer/HandleBalanceBar.tsx:14`
**Problem:** `pct = Math.round((balance / perCycle) * 100)` — when balance exceeds perCycle (due to rollover), pct > 100%. The Progress component may render incorrectly.
**Fix:** Cap pct at 100: `Math.min(100, Math.round(...))`

### 2. Dead code: useHandleTransactions (SHOULD-FIX)
**File:** `src/hooks/useHandles.ts:38-54`
**Problem:** Exported hook but never imported anywhere in the codebase.
**Fix:** Remove the unused hook and its HandleTransaction interface.

### 3. HomeAssistant loading skeleton (SHOULD-FIX)
**File:** `src/pages/customer/HomeAssistant.tsx:100`
**Problem:** Shows `<p>Loading services…</p>` instead of skeleton cards matching the service card layout.
**Fix:** Replace with skeleton cards (3 cards matching the Card layout).

### 4. AddonSuggestionsCard loading state (SHOULD-FIX)
**File:** `src/components/customer/AddonSuggestionsCard.tsx:24`
**Problem:** Returns `null` when isLoading is true. User sees nothing while add-ons load.
**Fix:** Show a skeleton card during loading (matches existing Card layout).

### 5. SuggestionCard hide button mobile visibility (SHOULD-FIX)
**File:** `src/components/customer/SuggestionCard.tsx:76`
**Problem:** `opacity-0 group-hover:opacity-100` — the hide button is invisible on touch devices.
**Fix:** Change to `opacity-60 sm:opacity-0 sm:group-hover:opacity-100` so mobile always shows it at reduced opacity.

## Acceptance Criteria
- [ ] HandleBalanceBar progress never exceeds 100%
- [ ] No unused exports in useHandles.ts
- [ ] HomeAssistant shows skeleton during loading
- [ ] AddonSuggestionsCard shows skeleton during loading
- [ ] SuggestionCard hide button visible on mobile
- [ ] `npm run build` passes
- [ ] `npx tsc --noEmit` passes
