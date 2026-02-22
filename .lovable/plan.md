

# Module 05 Review Fixes

## Overview
Address 5 gaps from the Claude Code review. All are isolated fixes with no schema changes needed.

---

## Fix 1: Wire zone-aware plan availability on /customer/plans (Medium)

**Problem**: `PlanCard` accepts `zoneEnabled` but the customer plans page never fetches the customer's zone or passes it.

**Solution**:
- In `src/pages/customer/Plans.tsx`:
  - Import `useProperty` to get customer's zip code
  - Fetch `plan_zone_availability` for all plans in one query
  - Fetch the customer's zone via `useZoneLookup` (from their property zip)
  - Pass `zoneEnabled` prop to each `PlanCard` based on whether the plan has `is_enabled=true` for that zone
  - Plans with no zone availability row or `is_enabled=false` show "Not available in your area"

**Files**: `src/pages/customer/Plans.tsx`

---

## Fix 2: Entitlement version editing UI (Medium)

**Problem**: Admin can create initial version with hardcoded defaults but cannot edit model_type, included counts, max extras, or extra_allowed.

**Solution**:
- In `src/pages/admin/Plans.tsx`, expand the entitlements section of `PlanForm`:
  - When a version exists, show editable form fields: model_type (select), included_credits/count/minutes (number inputs), extra_allowed (switch), max_extra_credits/count/minutes (number inputs, shown when extra_allowed=true)
  - Add an `useUpdateEntitlementVersion` mutation in `src/hooks/usePlans.ts`
  - "Save Entitlements" button updates the version
  - When creating initial version, use the form values instead of hardcoded defaults
- Add SKU rules UI: for each active SKU, show a select (none/included/extra_allowed/blocked/provider_only) using the existing `useManageSkuRules` hook

**Files**: `src/hooks/usePlans.ts`, `src/pages/admin/Plans.tsx`

---

## Fix 3: "Change Plan" button not calling mutation (Low, quick)

**Problem**: Line 74-77 of `src/pages/customer/Subscription.tsx` fires `toast.success` but never calls `useChangePlan`.

**Solution**:
- Import and call `useChangePlan` mutation with `subscriptionId` and `changePlanId`
- Handle error state

**Files**: `src/pages/customer/Subscription.tsx`

---

## Fix 4: Admin subscription list shows UUID instead of name (Low)

**Problem**: `SubscriptionRow` shows `customer_id.slice(0,8)` instead of customer name/email.

**Solution**:
- In `useAdminSubscriptions`, join subscriptions with profiles: `select("*, profiles!subscriptions_customer_id_fkey(full_name)")`
  - If FK doesn't exist, use a separate profiles lookup or do a client-side join
- Display `full_name` (or fallback to truncated ID) in the subscription row
- Also show plan name by joining plans: `select("*, plans!subscriptions_plan_id_fkey(name)")`

**Files**: `src/hooks/useAdminSubscriptions.ts`, `src/pages/admin/Subscriptions.tsx`

---

## Fix 5: No "Create new version" prompt on entitlement changes (Medium)

**Problem**: Spec requires creating new entitlement versions by default when editing published entitlements.

**Solution**:
- When saving entitlement changes on a **published** version, show an AlertDialog: "This version is live. Create a new version instead?" with options:
  - "Create New Version" (default): duplicates version with incremented version number, applies edits, sets old to retired, updates plan's `current_entitlement_version_id`
  - "Edit Live" (secondary): requires typing "EDIT LIVE" to confirm, then updates in place
- Draft versions can be edited directly without the prompt

**Files**: `src/pages/admin/Plans.tsx`

---

## Implementation Order
1. Fix 3 (quick, 2 lines)
2. Fix 1 (zone awareness)
3. Fix 2 + Fix 5 (entitlement editing, done together since they're the same form)
4. Fix 4 (admin display)

## Technical Notes

### Zone lookup for plans page
Use `useProperty` to get zip, then look up the zone containing that zip from `zones` table. Then check `plan_zone_availability` for each plan against that zone_id. If customer has no property, skip zone filtering (all plans shown as available).

### Entitlement version form fields
```
Model Type: [credits_per_cycle | count_per_cycle | minutes_per_cycle]
Included Credits: [number]    (shown when model = credits_per_cycle)
Included Count: [number]      (shown when model = count_per_cycle)  
Included Minutes: [number]    (shown when model = minutes_per_cycle)
Allow Extras: [toggle]
Max Extra {label}: [number]   (shown when extras allowed)
```

### Profile join for admin subscriptions
Since there's no direct FK from subscriptions.customer_id to profiles.user_id, we'll do a two-step fetch: get subscriptions, then batch-fetch profiles for the customer_ids. This avoids needing a migration for a FK that doesn't exist.

