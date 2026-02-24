

# Improvements from Test Results

Based on the scenario test results (32 PASS, 29 PARTIAL, 9 NOT_TESTED), here are the three highest-impact fixes to tackle, in priority order.

---

## 1. Fix Property Edit State Field Bug (C-05)

**Problem:** When editing the State field on the property page, typing "TX" appends to the existing "CA" value, producing "CATX" instead of replacing it.

**Root Cause:** The `onFocus` handler calls `e.target.select()` which should auto-select the text so typing replaces it. However, this doesn't work reliably on all browsers/mobile. The real fix is to clear the field value when the user starts typing if it's the full 2-char state.

**Fix:**
- In `src/pages/customer/Property.tsx`, update the State `<Input>` to use a controlled clear-on-focus pattern: when the field receives focus, select all text so the next keystroke replaces the value.
- Alternative (more reliable): change the `updateField` logic for `state` so that if the current value is already 2 characters and the user types a new character, it replaces instead of appending.

**Files:** `src/pages/customer/Property.tsx` (line ~86 and ~193-199)

---

## 2. Fix Referrals Query 400 Error

**Problem:** Console shows a 400 error when the referrals page loads.

**Root Cause:** The `useReferrals` hook queries `referrals` with nested joins including `referral_milestones(*)`. While the FK relationship exists, the query may fail if there are RLS issues on the joined tables. The `referral_milestones`, `referral_programs`, and `referral_codes` tables may be missing SELECT RLS policies for non-admin users.

**Fix:**
- Check and add RLS policies on `referral_milestones`, `referral_programs`, and `referral_codes` tables to allow authenticated users to read relevant rows.
- Add a SELECT policy on `referral_milestones` for rows belonging to the user's referrals.
- Add a SELECT policy on `referral_programs` for active programs (public read).
- Add a SELECT policy on `referral_codes` for the user's own codes.

**Files:** SQL migration for RLS policies

---

## 3. Update Scenario Test Results Document

**Problem:** The `docs/Scenario-Test-Results.md` is stale (dated 2026-02-23) and doesn't reflect the latest browser testing or the visual catalog improvements.

**Fix:**
- Update test date and summary counts.
- Mark A-20 (Admin Settings) as PASS since it was confirmed functional with profile editing, password change, and role switcher.
- Add notes about the new visual service catalog (C-06/C-07 related).
- Update the "Key Findings" section with current status.

**Files:** `docs/Scenario-Test-Results.md`

---

## Technical Details

### State Field Fix (Property.tsx)

The current `updateField` function for `state`:
```text
const finalValue = field === "state" ? value.toUpperCase().slice(0, 2) : value;
```

This slices to 2 chars but the `onChange` handler receives the full input value (existing + new char). The fix is to replace the `onChange` handler for the state field so that when the value exceeds 2 characters, only the last-typed characters are kept:

```text
onChange for state:
- If new value length > 2, take only the last 2 chars (the freshly typed input)
- This ensures typing "TX" into a field containing "CA" gives "TX" not "CATX"
```

### Referrals RLS Migration

Add SELECT policies to three tables:
- `referral_programs`: Allow all authenticated users to SELECT active programs
- `referral_codes`: Allow users to SELECT their own codes (where `owner_user_id = auth.uid()`)
- `referral_milestones`: Allow users to SELECT milestones for their own referrals (via join to `referrals` table)

### File Summary

| File | Action |
|------|--------|
| `src/pages/customer/Property.tsx` | Fix state field input handling |
| SQL migration | Add RLS SELECT policies for referral_programs, referral_codes, referral_milestones |
| `docs/Scenario-Test-Results.md` | Update with latest results and dates |

