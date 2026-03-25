# Batch 12: Focus Management — Trap & Restore

## Phase
Phase 4: Accessibility Hardening

## Scope
Verify Radix UI's built-in focus trap is active in Dialog, Sheet, Drawer, Popover.

## Verification results
All four overlay components use Radix UI primitives which provide:
- **Focus trap** — built-in, automatically traps Tab within the overlay
- **Focus restore** — built-in, returns focus to trigger on close
- **Escape key** — built-in, closes the overlay
- **Tab cycling** — built-in, cycles through focusable children

No code changes needed — Radix handles all focus management by default. The only risk would be if we had `onOpenAutoFocus` or `onCloseAutoFocus` props that override Radix defaults, but none of our components do.

## Acceptance criteria
- [x] Dialog uses Radix DialogPrimitive (focus trap built-in)
- [x] Sheet uses Radix SheetPrimitive/DialogPrimitive (focus trap built-in)
- [x] Drawer uses Vaul DrawerPrimitive (focus trap built-in)
- [x] Popover uses Radix PopoverPrimitive (focus trap built-in)
- [x] No components override onOpenAutoFocus or onCloseAutoFocus
- [x] npm run build passes (no changes needed)
