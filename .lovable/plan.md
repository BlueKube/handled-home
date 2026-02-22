

# Module 02 Update: Non-Serviced Area Handling

## Summary
Allow customers with non-serviced zip codes to complete property onboarding without being blocked. After saving, show an informational dialog about service expansion. Update the coverage indicator copy to be optimistic.

## Changes

### 1. Update zip coverage copy in Property.tsx (line 219)
Replace:
> "Not currently serviced in this area"

With:
> "Service is not yet available in your area. We'll notify you when we launch here."

### 2. Add post-save "Not In Your Area Yet" dialog in Property.tsx
After a successful property save, if the zip is not covered:
- Show a Dialog (using the existing Radix dialog component) with:
  - **Title**: "We're Not in Your Area Yet"
  - **Body**: "Handled Home is expanding. We'll notify you as soon as we launch in your neighborhood."
  - **Primary CTA**: "Notify Me" -- closes the dialog, shows a toast confirmation ("We'll let you know!"), navigates to `/customer`
  - **Secondary CTA**: "Continue Exploring" -- closes the dialog, navigates to `/customer`
- If zip IS covered, the current behavior (toast + stay on page) remains unchanged

### 3. No changes to CustomerPropertyGate
The gate already only checks for property existence, not zone coverage. It will let non-serviced users through once they save their property. No modification needed.

### 4. No database changes
No new tables, columns, or migrations required. "Notify Me" is a placeholder action (just a toast for now).

## Files Modified
- `src/pages/customer/Property.tsx` -- Update coverage copy + add post-save dialog

## Technical Notes
- Import `Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter` from existing `@/components/ui/dialog`
- Import `useNavigate` from react-router-dom (already available via `useSearchParams`)
- Add a `showExpansionDialog` boolean state, set to `true` after successful save when `isNotCovered` is true
- On save success: check zone coverage status, if not covered show dialog instead of just the toast
