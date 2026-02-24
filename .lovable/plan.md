

# Fix Slide-Over Sheets to Cover Full Mobile Screen

## Problem

Right-side Sheet panels (like the SKU detail shown in the screenshot) only cover 75% of the screen width on mobile (`w-3/4` in the base Sheet component). This creates a poor mobile UX where the underlying page is partially visible and the sheet content is cramped.

## Solution

Two-part fix: update the base Sheet component so right-side sheets are full-width on mobile, then audit all individual sheet usages to ensure consistency.

---

## Part 1: Update the Base Sheet Component

In `src/components/ui/sheet.tsx`, change the `right` variant from:

```text
w-3/4 ... sm:max-w-sm
```

to:

```text
w-full sm:w-3/4 sm:max-w-lg
```

This makes ALL right-side sheets automatically full-width on mobile, while keeping a constrained width on larger screens. The same change applies to the `left` variant for consistency.

## Part 2: Remove Redundant Per-File Overrides

These 9 files add `sm:max-w-lg` or just `overflow-y-auto` on their `SheetContent`. Once the base handles width, they only need `overflow-y-auto`:

| File | Current className | New className |
|------|------------------|---------------|
| `src/components/admin/SkuDetailSheet.tsx` | `sm:max-w-lg overflow-y-auto` | `overflow-y-auto` |
| `src/components/admin/SkuFormSheet.tsx` | `sm:max-w-lg overflow-y-auto` | `overflow-y-auto` |
| `src/pages/admin/ServiceDays.tsx` | `sm:max-w-lg overflow-y-auto` | `overflow-y-auto` |
| `src/pages/admin/Subscriptions.tsx` | `w-full sm:max-w-lg overflow-y-auto` | `overflow-y-auto` |
| `src/pages/customer/Services.tsx` | `sm:max-w-lg overflow-y-auto` | `overflow-y-auto` |
| `src/pages/provider/SKUs.tsx` | `sm:max-w-lg overflow-y-auto` | `overflow-y-auto` |
| `src/pages/admin/SupportPolicies.tsx` (x2) | `overflow-y-auto` | `overflow-y-auto` (no change) |
| `src/pages/admin/SupportMacros.tsx` (x2) | `overflow-y-auto` | `overflow-y-auto` (no change) |
| `src/pages/admin/Bundles.tsx` | `overflow-y-auto` | `overflow-y-auto` (no change) |
| `src/pages/admin/Incentives.tsx` | `overflow-y-auto` | `overflow-y-auto` (no change) |

Bottom-side sheets (like `ZoneFormSheet`, `ReportIssueSheet`, `AddServicesSheet`, `PhotoGallery`) are unaffected -- they already use `side="bottom"` which has different layout rules.

## Files Modified

| File | Change |
|------|--------|
| `src/components/ui/sheet.tsx` | Update `right` and `left` variants to use `w-full sm:w-3/4 sm:max-w-lg` |
| `src/components/admin/SkuDetailSheet.tsx` | Remove redundant `sm:max-w-lg` |
| `src/components/admin/SkuFormSheet.tsx` | Remove redundant `sm:max-w-lg` |
| `src/pages/admin/ServiceDays.tsx` | Remove redundant `sm:max-w-lg` |
| `src/pages/admin/Subscriptions.tsx` | Remove redundant `w-full sm:max-w-lg` |
| `src/pages/customer/Services.tsx` | Remove redundant `sm:max-w-lg` |
| `src/pages/provider/SKUs.tsx` | Remove redundant `sm:max-w-lg` |

