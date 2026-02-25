

# Round 2A Cleanup Pass — Address Claude Code Review Findings

## Assessment

Claude's review is thorough and fair. All 10 items pass, but there are 6 concrete follow-ups worth fixing before starting Round 2B. These are small, focused fixes that will prevent technical debt from compounding.

## Plan: 2A Cleanup Sprint (before 2B begins)

### Fix 1: Wire SparklineChart into OpsCockpit and OpsZones
- Replace inline SVG `Sparkline` functions in `src/pages/admin/OpsCockpit.tsx` and `src/pages/admin/OpsZones.tsx` with imports of `src/components/SparklineChart.tsx`
- Completes 2A-10 properly (DRY principle)

### Fix 2: Add error state UI to Provider pages
- Add `isError` checks to `useQuery` results in Dashboard, Performance, Coverage, Earnings
- Show a simple error card with retry button instead of infinite skeletons
- Pattern: check `isError` from the hook, render an error message with a refetch button

### Fix 3: Fix `any` types in Coverage page
- Replace `any` type assertions in `src/pages/provider/Coverage.tsx` with proper typed interfaces from the Supabase types file

### Fix 4: Add form validation to Organization edit
- Add basic validation: name required, phone format, ZIP format (5 digits)
- Show inline error messages on save attempt

### Fix 5: Add `useMemo` for balance calculations in Earnings
- Wrap the earnings/payout calculations in `useMemo` to avoid recalculating on every render

### Fix 6: Update tasks.md tracker
- Confirm all 10 items show `[x]` (they already do based on what I see)
- Add a "2A Cleanup" section noting these 6 fixes

## Technical Details

- **Files modified**: `OpsCockpit.tsx`, `OpsZones.tsx`, `Dashboard.tsx`, `Performance.tsx`, `Coverage.tsx`, `Organization.tsx`, `Earnings.tsx`, `tasks.md`
- **No new dependencies or database changes**
- **Estimated scope**: 6 small fixes, all S-complexity
- **Not addressing**: Stripe Connect setup link (that's a 2B/2D concern), server-side pagination (2H), provider job_issues query optimization (minor at current scale)

