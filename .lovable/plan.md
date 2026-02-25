

# Add PreviewAsCard to Customer and Provider Settings Pages

## Problem

When an admin uses Preview Mode to view the app as a Customer or Provider, there's no way to switch back to another role from those settings pages. The `RoleSwitcher` only shows roles the user actually has assigned, and the `PreviewAsCard` currently only appears on the Admin Settings page.

## Solution

Import and render the `PreviewAsCard` component on both the Customer and Provider Settings pages. The component already has a guard (`if (activeRole !== "admin") return null`) so it will only appear when an admin is previewing — regular customers and providers won't see it.

## Changes

| File | Change |
|------|--------|
| `src/pages/customer/Settings.tsx` | Import `PreviewAsCard`, render it above the Sign Out button |
| `src/pages/provider/Settings.tsx` | Import `PreviewAsCard`, render it above the Sign Out button |

No other files need changes. The `PreviewAsCard` component already handles all the logic correctly.

