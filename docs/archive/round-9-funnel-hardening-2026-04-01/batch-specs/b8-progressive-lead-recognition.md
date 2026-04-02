# Batch 8: Progressive Lead Recognition

## Phase
Phase 5 — Progressive Lead Recognition

## Review: Quality

## Size: Small

## What
After a lead submits the form on /providers, store their email in localStorage. On return visits, show personalized messaging instead of the generic form.

## Requirements

### ProviderBrowse.tsx Changes
1. After successful form submission, store email in localStorage
2. On page load, check localStorage for previously submitted email
3. If found: show "Welcome back" card instead of the form, with:
   - "Welcome back! Your interest in [ZIP] is saved."
   - "Ready to apply?" CTA → /auth?tab=signup&role=provider
   - "Update your info" button to show the form again
4. No auth required — purely localStorage-based

### Why localStorage (not DB lookup)
- No auth required on public page
- No email lookup endpoint needed (would expose lead existence)
- Simple, fast, zero network calls
- Privacy-friendly — data stays on device

## Acceptance Criteria
- [ ] Email stored in localStorage after submission
- [ ] Returning visitors see personalized "Welcome back" card
- [ ] "Ready to apply?" CTA works
- [ ] "Update your info" reveals form again
- [ ] Fresh visitors still see the normal form
- [ ] Build passes

## Files Changed
- `src/pages/ProviderBrowse.tsx` (edit)
