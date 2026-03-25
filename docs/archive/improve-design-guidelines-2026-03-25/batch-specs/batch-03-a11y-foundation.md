# Batch 3: Accessibility Foundation CSS

## Phase
Phase 1: CSS Foundation & Utilities

## Why it matters
Skip-nav links allow keyboard users to bypass repetitive navigation and jump straight to content. Landmark IDs enable skip-nav targeting. These are foundational accessibility features required by WCAG 2.1 §2.4.1 (Bypass Blocks).

## Scope
1. **Add skip-nav link** to `AppLayout.tsx`:
   - Visually hidden (`sr-only`) by default, visible on focus
   - Links to `#main-content`
   - Styled with `z-[100]` to sit above everything when visible
   - Text: "Skip to main content"

2. **Add `id="main-content"` to `<main>`** in both:
   - `AppLayout.tsx` (customer/provider layout)
   - `AdminShell.tsx` (admin layout)

3. **Add skip-nav link** to `AdminShell.tsx` (same pattern)

4. **Add skip-nav CSS** to `src/index.css`:
   - `.skip-nav` class: sr-only by default, becomes visible on `:focus`

## Non-goals
- Adding `<nav>` or `<aside>` landmarks (already present)
- Modifying BottomTabBar or AdminSidebar (already have correct landmarks)
- Changing focus-visible rings on components (that's Phase 2)
- Adding aria-live or role="alert" (that's Phase 4)

## File targets
| Action | File |
|--------|------|
| Modify | `src/components/AppLayout.tsx` |
| Modify | `src/components/admin/AdminShell.tsx` |
| Modify | `src/index.css` |

## Acceptance criteria
- [ ] Skip-nav link exists in AppLayout, links to `#main-content`
- [ ] Skip-nav link exists in AdminShell, links to `#main-content`
- [ ] `<main id="main-content">` in AppLayout
- [ ] `<main id="main-content">` in AdminShell
- [ ] Skip-nav is visually hidden until focused (sr-only → visible on focus)
- [ ] Skip-nav has `z-[100]` when visible
- [ ] `npm run build` passes

## Regression risks
- Adding an element before `<AppHeader>` could shift layout if not absolutely positioned
- Skip-nav with `position: absolute` could cause scroll issues if not handled carefully

## Visual validation checklist
- [ ] Skip-nav not visible on page load
- [ ] Skip-nav appears when Tab key is pressed
- [ ] Clicking skip-nav scrolls to main content
- [ ] Layout unchanged in normal use
