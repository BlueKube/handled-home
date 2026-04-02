# Batch 3: AccountNotConfigured + PreviewAsCard + RoleSwitcher Polish

## Phase
Round 12: Authentication & Identity

## Review: Quality

## Scope
3 files:
- `src/components/AccountNotConfigured.tsx`
- `src/components/settings/PreviewAsCard.tsx`  
- `src/components/AppLayout.tsx` (add preview mode banner)

## Changes
1. **AccountNotConfigured — show error + retry + user email** — Use `bootstrapError` and `retryBootstrap` from context. Display user's email so they can reference it when contacting support.
2. **Preview mode banner** — Add a small dismissible banner at the top of AppLayout when admin is in preview mode, showing which role they're previewing.

## Acceptance Criteria
- [ ] AccountNotConfigured shows bootstrap error message when present
- [ ] AccountNotConfigured shows "Try Again" button that calls retryBootstrap()
- [ ] AccountNotConfigured displays user email for support reference
- [ ] Preview mode banner visible when previewRole is set
- [ ] Banner shows "Previewing as [role]" with an exit button
- [ ] Banner uses dark-mode-safe colors
- [ ] All components under 300 lines
