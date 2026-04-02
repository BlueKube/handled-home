# Batch 1: Phone Validation Utility + Browse/Apply Fixes

## Phase
Round 13: Phone Identity & Account Management

## Review: Quality

## Scope
3 files:
- `src/utils/phone.ts` (NEW — shared phone validation utility)
- `src/pages/ProviderBrowse.tsx` (add phone validation to lead capture)
- `src/pages/provider/Apply.tsx` (add phone validation, handle profile update error)

## Changes
1. **Create phone validation utility** — Single regex and validate function used across all phone inputs. Use the pattern from ProfileForm (`/^\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})$/`) as the canonical US phone pattern.
2. **ProviderBrowse phone validation** — Import `isValidPhone` from utility, show toast error for invalid phone before submit.
3. **Apply.tsx phone validation** — Import `isValidPhone`, validate before saving to profile. Wrap profile update in try/catch with toast error on failure.

## Acceptance Criteria
- [ ] `src/utils/phone.ts` exports `isValidPhone(phone: string): boolean`
- [ ] ProviderBrowse shows validation error for invalid phone
- [ ] Apply.tsx validates phone before profile update
- [ ] Apply.tsx profile update wrapped in try/catch with error toast
- [ ] Empty/null phone still accepted (phone is optional everywhere)
- [ ] No behavior change for valid phone inputs
