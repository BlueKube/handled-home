# Batch 1: AuthPage Polish — Dark Mode + Error UX

## Phase
Round 12: Authentication & Identity

## Review: Quality

## Scope
Single file: `src/pages/AuthPage.tsx`

## Changes
1. **Fix dark-mode logo colors** — Lines 123-126 use inline HSL styles (`hsl(220 20% 10%)` and `hsl(200 80% 50%)`) that don't respond to dark mode. Replace with Tailwind semantic classes (`text-foreground` / `text-primary`).

## Acceptance Criteria
- [ ] Logo text uses Tailwind classes, not inline HSL styles
- [ ] Logo readable in both light and dark mode
- [ ] No other regressions in AuthPage behavior

## Out of Scope
- Signup flow changes (handled in B2)
- Bootstrap error handling (handled in B2)
