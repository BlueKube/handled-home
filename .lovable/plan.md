

# Module 05: Subscription Engine + Soft Onboarding

## Overview
This is the largest module so far. It introduces plan browsing, draft routines, subscription checkout (Stripe), entitlement resolution, admin plan management, and subscription gating. The existing empty `subscription_plans` table will be dropped and replaced with 9 new tables.

---

## Phase 1: Documentation + Database Schema

### 1a. Replace docs
Replace `docs/modules/05-subscription-engine.md` with the uploaded PRD.

### 1b. Drop old table
The existing `subscription_plans` table is empty and doesn't match the new schema. Drop it.

### 1c. Create 9 new tables

**1) `plans`** — replaces `subscription_plans`
- id, name, tagline, status (draft/active/hidden/retired), display_price_text, recommended_rank, current_entitlement_version_id, stripe_product_id, stripe_price_id, created_at, updated_at + trigger

**2) `plan_zone_availability`**
- id, plan_id (FK plans), zone_id (FK zones), is_enabled (boolean), created_at
- Unique: (plan_id, zone_id)

**3) `plan_entitlement_versions`**
- id, plan_id (FK plans), version (int), status (draft/published/retired), model_type (credits_per_cycle/count_per_cycle/minutes_per_cycle), included_credits, included_count, included_minutes, extra_allowed, max_extra_credits, max_extra_count, max_extra_minutes, created_at

**4) `plan_entitlement_sku_rules`**
- id, entitlement_version_id (FK plan_entitlement_versions), sku_id (FK service_skus), rule_type (included/extra_allowed/blocked/provider_only), reason (nullable)
- Unique: (entitlement_version_id, sku_id, rule_type)

**5) `customer_plan_selections`** (draft routine storage)
- id, customer_id, property_id, zone_id (nullable), selected_plan_id (FK plans), entitlement_version_id (FK plan_entitlement_versions), status (draft/locked), draft_routine (jsonb, default '[]'), created_at, updated_at
- Unique: (customer_id, property_id)

**6) `subscriptions`**
- id, customer_id, property_id, zone_id (nullable), plan_id (FK plans), entitlement_version_id (FK plan_entitlement_versions), status (trialing/active/past_due/incomplete/canceling/canceled), current_period_start, current_period_end, cancel_at_period_end, pending_plan_id, pending_effective_at, stripe_customer_id, stripe_subscription_id, created_at, updated_at

**7) `subscription_events`**
- id, subscription_id (FK subscriptions), source, event_type, payload (jsonb), created_at

**8) `admin_audit_log`**
- id, admin_user_id, action, entity_type, entity_id, before (jsonb), after (jsonb), reason, created_at

**9) `stripe_mappings`** -- deferred, Stripe IDs will live directly on `plans` and `subscriptions` tables instead (simpler for MVP)

### 1d. RLS Policies

- **plans**: All authenticated can SELECT active/hidden plans; admins can manage all
- **plan_zone_availability**: All authenticated can SELECT; admins can manage
- **plan_entitlement_versions**: All authenticated can SELECT published versions; admins can manage all
- **plan_entitlement_sku_rules**: All authenticated can SELECT; admins can manage
- **customer_plan_selections**: Customers own their rows (customer_id = auth.uid()); admins can read all
- **subscriptions**: Customers own their rows; admins can manage all
- **subscription_events**: Customers can read own subscription events; admins can read all
- **admin_audit_log**: Admins only (read + insert)

### 1e. Indexes
- plan_zone_availability(plan_id, zone_id)
- customer_plan_selections(customer_id, property_id)
- subscriptions(customer_id, status)

### 1f. updated_at triggers
On plans, customer_plan_selections, subscriptions (reuse existing trigger function).

---

## Phase 2: Enable Stripe

Use the Stripe integration tool to enable Stripe on the project. This is required for subscription checkout.

---

## Phase 3: Entitlement Resolution Layer

### `src/hooks/useEntitlements.ts`

Core function: `resolveEntitlements(planId, zoneId, entitlementVersionId?)`

Fetches:
1. Plan details
2. Plan-zone availability for the customer's zone
3. Entitlement version (provided or plan's current)
4. SKU rules for that version
5. All active SKUs (from Module 04)

Returns the stable payload from PRD section 9.3:
```typescript
interface EntitlementPayload {
  plan: { plan_id, entitlement_version_id, model_type, included, extras }
  zone: { zone_id, is_covered, plan_enabled, blocks }
  skus: Array<{ sku_id, status, provider_only, reason, ui_badge, ui_explainer }>
  messages: { included_explainer, extra_explainer, change_policy }
}
```

This hook is the single source of truth used by all plan/routine/subscribe pages.

---

## Phase 4: Data Hooks

### `src/hooks/usePlans.ts`
- `usePlans()` -- fetch active/hidden plans with zone availability for customer's zone
- `usePlanDetail(planId)` -- single plan with entitlement data
- `useCreatePlan()` / `useUpdatePlan()` / `useDuplicatePlan()` -- admin mutations
- `usePlanZoneAvailability(planId)` -- zone toggle data for admin

### `src/hooks/useSubscription.ts`
- `useCustomerSubscription()` -- fetch current user's subscription
- `useCreateSubscription()` -- create internal subscription record post-checkout
- `useCancelSubscription()` -- cancel flow
- `useChangePlan()` -- pending plan change (next cycle)

### `src/hooks/useDraftRoutine.ts`
- `useDraftRoutine()` -- fetch/save customer_plan_selections
- `useAddToRoutine()` / `useRemoveFromRoutine()` -- mutations
- Enforces entitlement caps client-side

### `src/hooks/useAdminSubscriptions.ts`
- `useAdminSubscriptions(filters)` -- list all subscriptions with search
- `useAdminSubscriptionDetail(id)` -- detail with events timeline

---

## Phase 5: Customer Pages

### 5a. Plans Browse (`/customer/plans`)
- Route: `/customer/plans` (accessible without subscription)
- Shows 2-3 plans as cards
- Recommended badge based on zone + property flags
- Zone availability label per plan
- CTAs: "Preview plan" and "Build a routine"

### 5b. Plan Detail (`/customer/plans/:planId`)
- What's included (SKU groups via entitlement resolution)
- What's extra
- What's not available (with reasons)
- "How changes work" section
- CTAs: "Build routine" / "Subscribe"

### 5c. Build Routine (`/customer/routine`)
- Plan selector (switch among available plans)
- Sticky summary bar (credits used / included / extras)
- SKU catalog list with entitlement badges (Included / Extra / Blocked)
- Bottom drawer with selected items grouped
- Save draft routine (persisted to customer_plan_selections)
- "Activate plan" CTA (leads to subscribe)
- No operational obligation until subscription active

### 5d. Subscribe (`/customer/subscribe`)
- Confirm plan + billing summary
- Stripe Checkout (webview)
- On success: create internal subscription record, show success screen
- "What happens next" messaging

### 5e. Subscription Management (`/customer/subscription`)
- Replace existing placeholder
- Current plan + status pill + renewal date
- "Change plan" (effective next cycle)
- "Cancel subscription" with confirmation
- "Fix payment" (only if past_due)

### 5f. Navigation Updates
- Add "Plans" to customer sidebar and bottom tab bar
- Update "Subscription" link to point to management page
- `/customer/plans`, `/customer/plans/:planId`, `/customer/routine`, `/customer/subscribe` routes -- accessible WITHOUT CustomerPropertyGate for browsing, but subscribe CTA requires property

---

## Phase 6: Admin Pages

### 6a. Plan Builder (`/admin/plans`)
- Replace existing placeholder
- Plan list with status, zone count, entitlement version, updated date
- Create/edit plan form (sheet):
  - Basics: name, tagline, status, display_price_text, recommended_rank
  - Zone availability: multi-toggle zone list
  - Entitlements: model type, credits/count/minutes, extra rules, SKU picklist rules
  - Stripe fields: product_id, price_id (optional)
  - Publishing validation: at least 1 zone, valid entitlements
- Duplicate plan action
- Retire (soft) action
- Entitlement versioning: "Create new version?" prompt on edit

### 6b. Subscriptions Admin (`/admin/subscriptions`)
- New route + sidebar entry
- List with search (customer, plan, status)
- Detail view: customer info, plan, zone, status timeline, Stripe IDs
- Guarded admin actions: "Mark as comped", "Force cancel" (with reason + audit log)

---

## Phase 7: Gating

### Subscription-aware route protection
- New `SubscriptionGate` component (similar to CustomerPropertyGate)
- Wraps routes that require active subscription (future modules)
- If no active subscription: redirect to `/customer/plans` with context banner
- For Module 05: only used as infrastructure -- no routes gated yet since obligation modules come later

---

## Phase 8: Stripe Integration

### Edge function: `create-checkout-session`
- Receives plan_id, customer info
- Creates Stripe Checkout Session
- Returns checkout URL

### Edge function: `stripe-webhook`
- Handles: checkout.session.completed, customer.subscription.updated/deleted, invoice.payment_failed/succeeded
- Updates subscription status + period dates
- Writes subscription_events
- Never computes entitlements from Stripe

### Edge function: `create-portal-session` (for payment method updates)
- Creates Stripe Customer Portal session for "Fix payment" flow

---

## Reusable Components
- `PlanCard` -- plan preview card with badges
- `EntitlementBadge` -- Included / Extra / Blocked pills
- `RoutineSummaryBar` -- sticky caps + usage display
- `FixPaymentPanel` -- past_due payment update UI
- `SubscriptionStatusPanel` -- current plan + status display

---

## Files Impact

### New files (~20+)
- `src/hooks/useEntitlements.ts`
- `src/hooks/usePlans.ts`
- `src/hooks/useSubscription.ts`
- `src/hooks/useDraftRoutine.ts`
- `src/hooks/useAdminSubscriptions.ts`
- `src/components/plans/PlanCard.tsx`
- `src/components/plans/EntitlementBadge.tsx`
- `src/components/plans/RoutineSummaryBar.tsx`
- `src/components/plans/FixPaymentPanel.tsx`
- `src/components/plans/SubscriptionStatusPanel.tsx`
- `src/components/SubscriptionGate.tsx`
- `src/pages/customer/Plans.tsx`
- `src/pages/customer/PlanDetail.tsx`
- `src/pages/customer/Routine.tsx`
- `src/pages/customer/Subscribe.tsx`
- `src/pages/admin/Plans.tsx` (replace placeholder)
- `src/pages/admin/Subscriptions.tsx`
- `src/components/admin/PlanFormSheet.tsx`
- `src/components/admin/PlanDetailSheet.tsx`
- `src/components/admin/EntitlementEditor.tsx`
- `src/components/admin/ZoneAvailabilityPanel.tsx`
- `src/components/admin/SubscriptionDetailSheet.tsx`
- `supabase/functions/create-checkout-session/index.ts`
- `supabase/functions/stripe-webhook/index.ts`
- `supabase/functions/create-portal-session/index.ts`

### Modified files
- `docs/modules/05-subscription-engine.md`
- `src/App.tsx` -- new routes
- `src/components/AppSidebar.tsx` -- nav updates
- `src/components/BottomTabBar.tsx` -- add Plans tab
- `src/pages/customer/Subscription.tsx` -- replace placeholder
- `supabase/config.toml` -- edge function JWT config

### Database changes
- Drop `subscription_plans` table
- Create 8 new tables with RLS, indexes, triggers

---

## Implementation Order

Due to the size of this module, implementation will proceed in this sequence:

1. Documentation + database migration (all tables at once)
2. Enable Stripe
3. Entitlement resolution hook
4. Plan data hooks + admin plan builder page
5. Customer plans browse + plan detail pages
6. Draft routine page
7. Subscribe flow + Stripe edge functions
8. Subscription management page
9. Admin subscriptions page
10. Subscription gating infrastructure
11. Navigation updates across all roles

---

## Scope Decisions

- **AI features** (section 11 of PRD): Deferred to a follow-up. The plan recommender uses simple deterministic rules for now. Auto-builder, FAQ concierge, and churn warning are out of scope for initial implementation.
- **stripe_mappings table**: Skipped -- Stripe IDs stored directly on `plans` and `subscriptions` tables for simplicity.
- **Pause flow**: UI designed now (cancel only); pause implementation deferred per PRD section 5.5.
- **Proration**: Not implemented per PRD non-goals. Changes default to next cycle.

