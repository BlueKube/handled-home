

# Module 13 Integration Sweep — Self-Check + Fixes

## Current State Summary

The schema, RPCs, and UI for Modules 13.1-13.4 are structurally solid. The critical attribution (A1) and milestone automation (S1) gaps from the earlier review have been fixed. However, there are several integration wiring gaps, missing event emissions, unenforced client-side controls, and copy issues that need attention before moving to Module 14.

---

## Issues Found (ordered by priority)

### MUST FIX

**1. `signup_completed` growth event never emitted**
The funnel dashboard tracks `signup_completed` but no code ever records this event. After successful signup in `AuthPage.tsx`, no growth event is fired. This breaks the conversion funnel from `landing_viewed` to `signup_completed`.
- **Fix:** After successful signup + attribution in `AuthPage.tsx`, emit a `signup_completed` growth event via `record_growth_event` RPC.

**2. `InviteLanding.tsx` says "Welcome credit when you activate" even when incentives are OFF**
This is exactly the "incentives creep" concern ChatGPT raised. The copy unconditionally promises a credit. If `incentive_visibility` is false in `growth_surface_config`, this copy should not mention credits.
- **Fix:** Make the invite landing page fetch surface config (or accept a simpler approach: change copy to a neutral value prop like "Track every visit with proof photos" since we can't easily fetch config on a public no-auth page). The simplest safe fix is to remove the credit mention entirely and replace with a non-incentive benefit.

**3. Surface weights not enforced client-side anywhere**
`growth_surface_config.surface_weights` are configurable by admins but no consumer component checks them. `CrossPollinationCard` doesn't check `cross_pollination` weight. `ShareCardSheet` doesn't check `receipt_share` weight. Provider milestone prompts don't check `provider_share` weight.
- **Fix:** In each surface component, fetch `growth_surface_config` for the relevant zone/category and hide the component if its weight is 0.

**4. Frequency caps not enforced client-side**
`prompt_frequency_caps` (e.g., `share_per_job`, `reminder_per_week`) exist in config but no component checks recent growth events to decide whether to suppress a prompt.
- **Fix:** Add a lightweight check: before showing share CTA or cross-pollination card, query recent `growth_events` for the current user and surface to see if caps are exceeded. Suppress if so.

### SHOULD FIX

**5. `InviteCustomers.tsx` generate link button still broken when no codes exist**
Line 117: `codes.data?.[0]?.program_id` will be undefined when there are zero codes. The fallback logic that exists in `Referrals.tsx` (querying for active programs) was not replicated here.
- **Fix:** Copy the same fallback pattern from `Referrals.tsx` lines 160-175 into `InviteCustomers.tsx`.

**6. Share landing page doesn't record `signup_completed` conversion**
When a user clicks "Get Handled Home" on `/share/:shareCode` and completes signup, the share_code context is lost. There's no way to attribute the signup back to the specific share card.
- **Fix:** Pass `share_code` as a query parameter to `/auth` (e.g., `/auth?share={shareCode}`). In `AuthPage.tsx`, capture this and include it in the `signup_completed` event context.

**7. QR code is a random noise placeholder**
`InviteCustomers.tsx` draws random pixels instead of a real QR code. This will confuse providers.
- **Fix:** Either install a lightweight QR library (`qrcode.react` or similar), or hide the QR section entirely with a "Coming soon" note until a real implementation is added.

**8. Admin Growth Events tab is limited to last 500 events**
The `useGrowthEventStats` hook queries only the last 500 events with no time filtering. For a real ops dashboard, this makes the funnel numbers unreliable as volume grows.
- **Fix:** Add a date range filter (last 7 days, last 30 days) to the Events tab query.

### NICE TO HAVE

**9. Cross-pollination category detection is naive**
`CrossPollinationCard` uses plan name string matching (`s.plans?.name?.toLowerCase().includes(...)`) to detect subscribed categories. This is fragile.
- **Fix:** Query `service_skus.category` via `routine_items` or `job_skus` for a more reliable signal, or add a `category` column to subscriptions.

**10. No `landing_viewed` event on `/invite/:code`**
The invite landing page (provider referral link) doesn't emit any growth event. Only the share landing page (`/share/:shareCode`) records `landing_viewed`.
- **Fix:** Add a `landing_viewed` event with `source_surface = 'provider_invite'` to `InviteLanding.tsx`.

---

## Implementation Plan

### Phase 1: Database Migration
- No schema changes needed. All tables and RPCs exist.

### Phase 2: Fix AuthPage attribution + growth event (Issues 1, 6)
- After successful signup in `AuthPage.tsx`:
  - Emit `signup_completed` growth event
  - Include `share_code` from query params in event context if present
- Read `share` query param and pass to growth event

### Phase 3: Remove incentive copy from InviteLanding (Issue 2)
- Replace "Welcome credit when you activate" with "Track and manage every service visit"
- This avoids promising incentives when they may be disabled

### Phase 4: Enforce surface weights (Issue 3)
- Create a small utility hook `useIsSurfaceEnabled(zoneId, category, surfaceKey)` that:
  - Fetches `growth_surface_config` for zone/category
  - Returns false if weight is 0
- Use in `ShareCardSheet`, `CrossPollinationCard`, and provider milestone prompt

### Phase 5: Enforce frequency caps (Issue 4)
- Add a hook `useFrequencyCapCheck(userId, surface, capKey)` that:
  - Queries recent `growth_events` for the user and surface
  - Compares count against `prompt_frequency_caps` from config
  - Returns whether the prompt should be suppressed
- Integrate into share CTA and cross-pollination card

### Phase 6: Fix InviteCustomers generate link fallback (Issue 5)
- Copy the active program fallback pattern from `Referrals.tsx` into `InviteCustomers.tsx`

### Phase 7: Add landing_viewed to InviteLanding (Issue 10)
- Import `useGrowthEvents` and emit `landing_viewed` with `source_surface = 'provider_invite'`

### Phase 8: Hide QR placeholder (Issue 7)
- Replace random noise QR with a "Coming soon" note or remove the section

### Phase 9: Add date filter to Events tab (Issue 8)
- Add a date range selector to `EventsTab` in `Growth.tsx`
- Pass date filter to `useGrowthEventStats`

---

## Files Modified

| File | Changes |
|------|---------|
| `src/pages/AuthPage.tsx` | Emit `signup_completed` event, capture `share` param |
| `src/pages/InviteLanding.tsx` | Remove credit copy, add `landing_viewed` event |
| `src/pages/ShareLanding.tsx` | Pass share_code to auth CTA URL |
| `src/components/customer/ShareCardSheet.tsx` | Check surface weight before rendering |
| `src/components/customer/CrossPollinationCard.tsx` | Check surface weight + frequency cap |
| `src/pages/provider/Referrals.tsx` | Check surface weight for milestone prompt |
| `src/pages/provider/InviteCustomers.tsx` | Fix generate link fallback, hide QR placeholder |
| `src/hooks/useGrowthSurfaceConfig.ts` | Add `useIsSurfaceEnabled` utility |
| `src/hooks/useGrowthEvents.ts` | Add `useFrequencyCapCheck` utility |
| `src/pages/admin/Growth.tsx` | Add date range filter to Events tab |

## Cross-Module Contract Verification

| Question | Answer | Status |
|----------|--------|--------|
| Who owns market state truth? | `market_zone_category_state` (13.3) | Confirmed -- single source |
| Who owns share link creation + expiry + revocation? | `share_cards` table + `create_share_card` / `revoke_share_card` RPCs (13.4) | Confirmed |
| Who is source of truth for attribution payouts? | `referrals` + `referral_milestones` + `referral_rewards` (13.1) | Confirmed |
| Who consumes cohort risk to tighten support policies? | Not yet wired (12 reads `support_policies` but doesn't reference market state) | Noted for future |
| Does `record_autopilot_action` respect locks? | Yes -- fixed in migration `20260223010554` | Confirmed |
| Does `compute_zone_health_score` filter by category? | Yes -- fixed in migration `20260223010731` | Confirmed |
| Are milestones fired from canonical sources? | `subscribed` from webhook, `first_visit` from `complete_job`, `paid_cycle` from webhook | Confirmed |
| Is attribution wired on signup? | Yes -- `AuthPage.tsx` calls `attribute_referral_signup` | Confirmed |
