# Batch 14: Color-Independent Status & Landmarks

## Phase
Phase 4: Accessibility Hardening

## Verification results
1. **Landmarks:** All verified in Batch 3:
   - `<main id="main-content">` in AppLayout and AdminShell
   - `<nav>` on BottomTabBar
   - `<aside>` on admin sidebar (Radix Sidebar component)
   - Skip-nav links in both layouts

2. **Color-independent status:** Alert component now has border-l-4 accent bar (visual shape cue) plus icon slot. Badge component always renders text content alongside color. Toast uses text + icon pattern from Sonner.

3. **Tab order:** Radix primitives enforce correct tab order. Pages use standard DOM flow which matches visual layout.

## No code changes needed
This batch is verification-only.
