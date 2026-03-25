# Batch 13: ARIA & Screen Reader

## Phase
Phase 4: Accessibility Hardening

## Scope
1. **FormMessage:** Add `role="alert"` so screen readers announce validation errors
2. **Sonner toast:** Verify aria-live — Sonner library handles this internally via role="status"
3. **Form aria-describedby:** Already implemented in FormControl — links inputs to helper/error text

## Changes needed
- form.tsx FormMessage: Add `role="alert"` to the error message paragraph

## Acceptance criteria
- [ ] FormMessage has role="alert" when showing error
- [ ] npm run build passes
