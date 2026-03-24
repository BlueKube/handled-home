# Batch 1: P3-3 Sign Out Confirmation

## Phase
Phase 1 — UX Polish & Verification Gaps

## Why it matters
Prevents accidental sign-outs that force users to re-authenticate, which is especially frustrating on mobile.

## Scope
- Wrap the sign-out button in `MoreMenu.tsx` with an AlertDialog confirmation prompt

## Non-goals
- No changes to sign-out logic itself
- No changes to other buttons or menu items

## File targets
| Action | File |
|--------|------|
| Modify | `src/components/MoreMenu.tsx` |

## Acceptance criteria
- [x] Tapping "Sign Out" in More menu opens a confirmation dialog
- [x] Dialog shows "Sign out?" title and descriptive text
- [x] "Cancel" dismisses dialog without signing out
- [x] "Sign Out" (destructive button) executes `signOut()` and navigates to `/auth`
- [x] Dialog uses existing AlertDialog component from `@/components/ui/alert-dialog`

## Regression risks
- Sign-out flow could break if AlertDialog blocks the async `signOut()` call
- Dialog styling could clash with Card wrapper

## Visual validation checklist
- [ ] Dialog renders centered on mobile viewport
- [ ] Destructive button is visually distinct
- [ ] Dark mode works
- [ ] Touch targets adequate (44px+)
