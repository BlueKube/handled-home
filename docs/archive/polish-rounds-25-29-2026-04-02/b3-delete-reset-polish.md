# Batch 3: DeleteAccountDialog + AuthPage Password Reset Polish

## Phase
Round 13: Phone Identity & Account Management

## Review: Quality

## Scope
2 files:
- `src/components/settings/DeleteAccountDialog.tsx`
- `src/pages/AuthPage.tsx`

## Changes
1. **DeleteAccountDialog** — Fix "within 30 days" claim to match reality (RPC executes immediately). Change to "Your data will be permanently anonymized."
2. **AuthPage forgot password** — Add loading state to the "Forgot password?" button while the reset email sends.

## Acceptance Criteria
- [ ] DeleteAccountDialog text accurately reflects immediate anonymization
- [ ] Forgot password button shows loading state while sending
- [ ] Forgot password button disables during send to prevent double-click
- [ ] No other behavioral changes
