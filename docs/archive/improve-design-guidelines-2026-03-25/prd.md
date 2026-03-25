# PRD: Implement Improved Design Guidelines

## Problem Statement

The design guidelines document (`docs/design-guidelines.md`) has been comprehensively rewritten — expanding from 469 words covering 7 components to 4,300+ words covering 26 components, full dark mode specs, motion system, form patterns, accessibility standards, spacing scale, and brand-to-design mappings. The document now scores 100/100 on the automated design evaluator.

However, the **codebase** has not been updated to conform to all of the new specifications. An audit reveals ~95% alignment on core tokens and base components, but gaps exist in:

1. **Motion system** — `prefers-reduced-motion` handling is completely absent; entry/exit animation pairs are not standardized; easing curve CSS custom properties don't exist
2. **Accessibility** — focus trap/restore patterns are inconsistent; `aria-live` on toasts is missing; `role="alert"` on form errors is sparse; landmark elements (`<main>`, `<nav>`, `<aside>`) are not used; skip-nav link doesn't exist
3. **Dark mode polish** — component-specific overrides (card borders, dialog overlay opacity, image brightness filter) are not implemented; dark elevation model not applied
4. **Form system** — validation state styling is inconsistent; field state transitions (empty→focused→filled→error) aren't standardized; helper text patterns vary across pages
5. **Component conformance** — some components are missing states or accessibility attributes documented in the guidelines; Toast component lacks `aria-live`; some components missing `focus-visible` ring
6. **Page-level conformance** — page templates (list, detail, form, dashboard) aren't consistently followed; spacing/padding varies; some pages lack `animate-fade-in`; back navigation patterns inconsistent
7. **Surface treatments** — shadow elevation scale not standardized; gradient patterns not codified as utilities; z-index scale not enforced

## Goals

1. Make every UI component in `src/components/ui/` conform to its spec in the design guidelines
2. Add missing CSS foundation: `prefers-reduced-motion`, easing curve custom properties, z-index utilities
3. Standardize accessibility across all interactive components and pages
4. Polish dark mode with component-specific overrides
5. Ensure every customer and provider page follows the correct page template pattern
6. Standardize form validation and field state patterns across all forms

## Scope

### In scope
- CSS foundation updates (`src/index.css`)
- All 50 `src/components/ui/*.tsx` files (audit + fix)
- All 40 customer pages, 34 provider pages (page template conformance)
- All 60 admin pages (lighter touch — spacing/a11y only, desktop layout is different)
- Shared components (`StatCard`, `PageSkeleton`, navigation bars)
- Form components and form-using pages

### Out of scope
- New features or routes
- Backend/Supabase changes
- Capacitor native plugin integration (haptics, splash screen)
- Performance optimization
- Test writing (Vitest/Playwright)
- Any changes to `docs/` files other than the six north star documents during doc sync

## Success Criteria

1. All UI components pass a manual spec audit against `docs/design-guidelines.md`
2. `prefers-reduced-motion` disables all transform/infinite animations
3. Every form field follows the field state lifecycle (empty→focused→filled→error→disabled)
4. Every Dialog/Sheet traps and restores focus
5. Every page has `animate-fade-in` on mount, correct padding template, and back navigation pattern
6. Dark mode shows visible card borders, appropriate overlay opacity, and image brightness filters
7. `npm run build` passes with zero TypeScript errors
8. No accessibility regressions (maintain or improve current a11y coverage)

## Constraints

- Must not break existing functionality — this is a polish/conformance pass, not a rewrite
- Mobile-first: customer and provider pages target 390×844 viewport
- Admin pages use desktop sidebar layout — different standards apply
- All colors must use semantic tokens (no hardcoded hex/hsl)
- Touch targets minimum 44×44px
- Inter font, weights 300–700 only
