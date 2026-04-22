# Batch 5.2 — AvatarDrawer + AppHeader integration

> **Round:** 64 · **Phase:** 5 · **Size:** Medium
> **Review:** Quality — 3 lanes + Lane 4 synthesis (sub-agent). Lane 3 scope: previous review findings on `AppHeader.tsx`/`NotificationBell.tsx`/`AppLayout.tsx` (Batch 5.1 touched `AppLayout.tsx`).
> **Testing tiers:** T1 mandatory · T2 initials helper · T3 smoke on Vercel Preview (drawer opens from every page, `?drawer=true` auto-opens, each menu item navigates)
> **Branch:** `feat/round-64-phase-5-batch-5.2-avatar-drawer`

---

## Problem

Customer app needs a **persistent** path to Plan / Billing / Credits / Account / Referrals / Help regardless of tab. The v2 design collapses the legacy "More" tab into an avatar-triggered drawer in the top-right corner of `AppHeader`. After Batch 5.1, `/customer/more` already redirects to `/customer?drawer=true` — this batch consumes that param.

## Goals

- The customer `AppHeader` shows an avatar button (user initials) in the top-right that opens a right-side sheet.
- The drawer contains: a notifications strip at the top (opens the existing `NotificationPanel`), a labeled menu list, a theme toggle, and a sign-out action with confirmation.
- `/customer?drawer=true` auto-opens the drawer on mount (and strips the param so back-navigation doesn't reopen it).
- Plan / Billing / Credits in the drawer list → ≤ 2 taps from any customer screen (1 tap to avatar, 1 tap to item).
- Provider + admin headers are untouched (they keep `NotificationBell`).

## Scope (files)

1. **`src/components/AvatarDrawer.tsx`** (new) — right-side `Sheet` triggered by an avatar button.
   - Trigger: circular button with user initials (fallback "H" if no profile name/email).
   - Drawer header: avatar + full name + email.
   - Notifications strip: one row showing unread count with a bell icon; tapping opens `NotificationPanel` inside the drawer (or replaces drawer content temporarily).
   - Menu list: Plan → `/customer/plans` · Billing → `/customer/billing` · Credits → `/customer/credits` · Account → `/customer/settings` · Referrals → `/customer/referrals` · Help & support → `/customer/support`.
   - Theme toggle row (reuses `next-themes` — same pattern as `MoreMenu.tsx`).
   - Sign-out row wrapped in `AlertDialog` for confirmation (same pattern as `MoreMenu.tsx`).
   - Auto-open: if `useSearchParams().get("drawer") === "true"`, open on mount and strip the param via `setSearchParams` (replace history entry).
2. **`src/components/AppHeader.tsx`** — for customer role, render `<AvatarDrawer />` instead of `<NotificationBell />`. Provider + admin continue to render `<NotificationBell />`.
3. **`src/lib/initials.ts`** (new) — tiny pure helper `getInitials(fullName, email)` returning 1–2 uppercase letters. Vitest at `src/lib/__tests__/initials.test.ts` per testing-strategy.md Tier 2.
4. **`lessons-learned.md`** — correct the entry logged in Batch 5.1 about `?drawer=true` loss through auth redirect. `ProtectedRoute` and `AuthPage` already preserve the `?redirect=` param through the login bounce (verified in `src/components/ProtectedRoute.tsx:24` and `src/pages/AuthPage.tsx:29`), so no sessionStorage stash is needed. Update the entry to describe the correct preservation behavior.

## Out of scope (explicit)

- **Consumer-link sweep.** Pages that navigate to `/customer/more` from an in-page back button (Billing, Referrals, Settings, SupportHome, Plans, Credits, RecommendProviderStatus) continue to work via the 5.1 redirect — they'll land on Dashboard with the drawer auto-opened. That's acceptable UX. A later cleanup batch (likely Phase 7 or Round-65 polish) can swap these for direct drawer-open calls.
- **`MoreMenuPage` component deletion.** Still used by provider + admin routes (`/provider/more`, `/admin/more`). Do not delete.
- **Provider + admin avatar drawers.** Different scope; their "More" tabs continue to render `MoreMenuPage` as a full page.
- **Services page shell.** Batch 5.3.
- **VisitDetail three-mode.** Batch 5.4.

## Acceptance criteria

1. Loading `/customer` (or any customer route) shows an avatar button in the top-right of `AppHeader` with the user's initials (or "H" fallback).
2. Tapping the avatar opens a right-side drawer sheet.
3. The drawer shows: the avatar + name/email header, a notifications strip, a menu list (Plan, Billing, Credits, Account, Referrals, Help & support), a theme toggle, and a Sign Out row.
4. Tapping a menu item navigates to the expected route and closes the drawer.
5. Tapping Sign Out opens an `AlertDialog`; confirming calls `signOut` and navigates to `/auth`.
6. Tapping the notifications strip opens the `NotificationPanel` (same behavior as tapping the bell today).
7. Loading `/customer?drawer=true` auto-opens the drawer on mount and removes the `drawer` param from the URL (history is `replace`d — back button doesn't reopen it).
8. Provider and admin headers still render `NotificationBell`, not the avatar drawer.
9. `/customer/more` continues to redirect to `/customer?drawer=true` (no change from Batch 5.1).
10. `getInitials("John Smith", "john@example.com")` → `"JS"`.
11. `getInitials(null, "jane@example.com")` → `"J"`.
12. `getInitials(null, null)` → `"H"`.
13. Vitest unit tests pass for `getInitials`.
14. `npx tsc --noEmit` exits 0.
15. `npm run build` exits 0.
16. `npx eslint` on changed files exits 0.

## Data shape / schema changes

None.

## Edge cases

- **Initials empty:** fallback to "H" (brand letter) if both name and email are nullish.
- **Long names:** clip to first letter of first word + first letter of last word (two letters max).
- **Drawer closing via escape / outside click:** standard `Sheet` behavior from `@/components/ui/sheet` — no special handling needed.
- **`?drawer=true` for provider/admin:** AvatarDrawer is only mounted for customers, so the param is simply ignored by provider/admin routes. No regression.
- **Notification panel inside drawer:** Two options — (a) open `NotificationPanel` as a separate overlay on top of the drawer (stack), or (b) close the drawer and open the panel. Option (a) is cleaner because the user doesn't lose drawer context. Use (a).

## Testing notes

- **Tier 1 (mandatory):** `npx tsc --noEmit` + `npm run build` + `npx eslint` on changed files.
- **Tier 2:** Vitest for `src/lib/initials.ts` (happy path + null fallbacks + long name).
- **Tier 3 smoke (after Vercel Preview green):**
  - Visit `/customer`; confirm avatar shows initials.
  - Tap avatar; drawer opens.
  - Tap each menu item; correct destination loads, drawer closes.
  - Tap Sign Out; confirm dialog; cancel; dialog closes; drawer still open.
  - Visit `/customer?drawer=true`; drawer auto-opens; back button does not reopen.
  - Visit `/customer/more`; verify it redirects and the drawer auto-opens.
  - Switch to provider preview; confirm header shows bell, not avatar.

## Screenshots

- Drawer open on `/customer`.
- Drawer opened via `/customer?drawer=true` param.
- Sign-out confirmation dialog.

## Risks

- **NotificationPanel inside Sheet stacking.** Radix Sheet + Radix Dialog can nest but z-index ordering must be correct. Validate on Vercel Preview. Fallback: close the drawer first, then open the panel.
- **`useSearchParams` re-run loops.** If the auto-open effect depends on the full `searchParams` object, stripping the param will retrigger. Use a `useRef` guard or depend only on the presence of the param (string), not the object identity.
- **Regression on provider/admin header.** AppHeader must not strip NotificationBell for non-customer roles. Guard with `effectiveRole === "customer"`.

## Review-lane notes

- **Lane 1 (spec completeness):** Verify each AC 1–13 is implemented.
- **Lane 2 (bug scan):** Focus on drawer auto-open loop, z-index stacking with NotificationPanel, role-scoped rendering (no customer-only code leaks into provider/admin view), accessibility (avatar button has aria-label, sheet has title).
- **Lane 3 (historical context):** Check prior review findings on `AppHeader.tsx`, `AppLayout.tsx` (Batch 5.1), `NotificationBell.tsx`, `MoreMenu.tsx`. Confirm we're not reverting any prior fix.
- **Lane 4 (synthesis):** Run as a sub-agent. Cross-check the drawer's mount-effect safety (no infinite loop), the role-scoped render, and the NotificationPanel-on-top behavior.
