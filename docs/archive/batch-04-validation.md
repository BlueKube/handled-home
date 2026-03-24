# Batch 4: 2.6 Validation

## Phase
Phase 1 — UX Polish & Verification Gaps

## Why it matters
Missing inline validation causes users to submit incomplete forms, waste time, and get frustrated with generic toast errors.

## Scope
- SupportNew.tsx: Add min 10 char validation with inline error
- ProfileForm.tsx: Add required name validation, phone format validation, required indicators

## Non-goals
- No changes to ChangePasswordForm.tsx (out of scope per PRD)
- No react-hook-form/zod migration (manual validation per Property.tsx pattern)

## File targets
| Action | File |
|--------|------|
| Modify | `src/pages/customer/SupportNew.tsx` |
| Modify | `src/components/settings/ProfileForm.tsx` |

## Acceptance criteria
- [ ] SupportNew: submitting < 10 chars shows inline error
- [ ] SupportNew: error clears when past 10 chars
- [ ] SupportNew: existing 500 char max and counter still work
- [ ] ProfileForm: empty name shows "Full name is required"
- [ ] ProfileForm: invalid phone shows format error
- [ ] ProfileForm: valid US formats accepted
- [ ] ProfileForm: required fields have red * indicators
- [ ] Both use aria-describedby linking errors to inputs
- [ ] Both follow manual validation pattern from Property.tsx
