# Sprint D1 Review — Guided Onboarding Wizard

**Reviewer:** Claude
**Date:** 2026-02-27
**Commits:** `e9740bc` ("Add onboarding wizard") on `origin/main`
**Migrations reviewed:**
- `20260227022012` — customer_onboarding_progress table, RLS policies, index, updated_at trigger

**Frontend reviewed:**
- `src/pages/customer/OnboardingWizard.tsx` (new — 7-step wizard)
- `src/hooks/useOnboardingProgress.ts` (new)
- `src/components/CustomerPropertyGate.tsx` (upgraded to require active subscription)
- `src/App.tsx` (route added)
- `src/integrations/supabase/types.ts` (types generated)

---

## Summary

Sprint D1 implements a guided onboarding wizard with 7 steps: property → zone_check → plan → subscribe → service_day → routine → complete. The wizard tracks progress persistently in `customer_onboarding_progress` and auto-advances past completed steps.

The schema design is clean (single row per user, UNIQUE constraint, proper RLS). The step components are well-structured with good UX patterns (collapsible optional fields, zone auto-advance, waitlist fallback).

However, there is **1 critical logic bug** that makes steps 5–7 unreachable, and **2 high-severity issues** that affect the checkout return flow and existing customer access.

---

## Critical Findings

### D1-F1 | CRITICAL | Wizard steps 5–7 are unreachable — redirect fires as soon as subscription exists

**File:** `src/pages/customer/OnboardingWizard.tsx:97-103`

**Problem:** The wizard has a `useEffect` that redirects to the dashboard whenever the user has both a property and an active subscription:

```typescript
useEffect(() => {
  if (!propLoading && !subLoading && property && subscription) {
    const activeStatuses = ["active", "trialing", "past_due"];
    if (activeStatuses.includes(subscription.status)) {
      navigate("/customer", { replace: true });
    }
  }
}, [propLoading, subLoading, property, subscription, navigate]);
```

After step 4 (subscribe), the user has both a property and an active subscription. This `useEffect` fires on every render and redirects to `/customer` — the dashboard. Steps 5 (service_day), 6 (routine), and 7 (complete) never render.

The `effectiveStep` calculation correctly advances to `service_day`, but the useEffect redirect overrides it on the next paint.

**Impact:** The onboarding wizard effectively only has 4 functional steps. Steps 5–7 are dead code. Users skip the service day selection, routine building, and completion confirmation entirely.

**Fix:** Only redirect if onboarding is actually complete — check the persisted progress rather than subscription state:

```typescript
useEffect(() => {
  if (!isLoading && !propLoading && !subLoading && property && subscription) {
    const activeStatuses = ["active", "trialing", "past_due"];
    if (activeStatuses.includes(subscription.status) && currentStep === "complete") {
      navigate("/customer", { replace: true });
    }
  }
}, [isLoading, propLoading, subLoading, property, subscription, currentStep, navigate]);
```

Or check `completedSteps.includes("routine")` — whichever signals "onboarding is done."

---

## High Findings

### D1-F2 | HIGH | No `checkout=success` handling — user stuck or immediately redirected after Stripe

**File:** `src/pages/customer/OnboardingWizard.tsx` (SubscribeStep)

**Problem:** After Stripe checkout, the success URL is:
```typescript
success_url: `${window.location.origin}/customer/onboarding?checkout=success`
```

But the wizard never reads the `checkout=success` query parameter. Two failure modes:

1. **Webhook processed fast** (< page load time): Subscription exists → D1-F1's redirect fires → user lands on dashboard, never sees steps 5–7.

2. **Webhook not processed yet**: `subscription` is null → `effectiveStep` remains `subscribe` → user sees "Subscribe Now" button again with no indication their payment was received. Clicking it again would create a second checkout session.

**Fix:** When `checkout=success` is in the URL:
- Show a "Verifying your subscription…" loading state
- Poll `useCustomerSubscription` with a short interval (e.g., `refetchInterval: 2000`) until the subscription appears
- Once found, call `completeStep("subscribe")` to advance to step 5

```typescript
const searchParams = new URLSearchParams(window.location.search);
const checkoutSuccess = searchParams.get("checkout") === "success";

// In SubscribeStep, if checkoutSuccess && !subscription:
//   Show "Verifying..." with polling
// If checkoutSuccess && subscription:
//   Auto-advance to next step
```

---

### D1-F3 | HIGH | `CustomerPropertyGate` now requires active subscription — blocks churned/expired customers

**File:** `src/components/CustomerPropertyGate.tsx:33-38`

**Problem:** Before D1, `CustomerPropertyGate` only checked for a property. Now it also requires an active subscription:

```typescript
const activeStatuses = ["active", "trialing", "past_due"];
const hasActiveSub = subscription && activeStatuses.includes(subscription.status);

if (!hasProperty || !hasActiveSub) {
  return <Navigate to="/customer/onboarding" replace />;
}
```

Every customer-facing route (`/customer`, `/customer/history`, `/customer/billing`, `/customer/support`, etc.) is wrapped in this gate. A customer whose subscription was canceled or expired is now locked out of their entire account and forced into the onboarding wizard.

**Impact:**
- Churned customers can't access their visit history, billing records, or support tickets
- The onboarding wizard would auto-advance past property (exists) and zone_check (already done), landing them on the plan selection step — effectively forcing a re-subscription to access their account

**Fix (either):**
- **Option A:** Separate the gate into two components — `PropertyGate` (required for all) and `SubscriptionGate` (only for service-dependent pages like dashboard, build, routine)
- **Option B:** Only redirect to onboarding for users with NO subscription history (truly new users). Churned users should see their dashboard with a "Resubscribe" CTA instead:
  ```typescript
  const hasAnySub = subscription != null; // includes canceled
  if (!hasProperty || (!hasActiveSub && !hasAnySub)) {
    return <Navigate to="/customer/onboarding" replace />;
  }
  ```

---

## Medium Findings

### D1-F4 | MEDIUM | Service-day and routine steps navigate away from wizard to gated pages

**File:** `src/pages/customer/OnboardingWizard.tsx` (ServiceDayStep, RoutineStep)

**Problem:** Steps 5 and 6 navigate to external pages:
```typescript
// ServiceDayStep
<Button onClick={() => navigate("/customer/service-day")}>
  View & Accept Service Day
</Button>

// RoutineStep
<Button onClick={() => navigate("/customer/routine")}>
  Build My Routine
</Button>
```

These navigate away from the wizard without calling `onComplete`. The "View & Accept" and "Build My Routine" buttons don't complete the step — only the "Skip" buttons do.

After navigating to `/customer/service-day` or `/customer/routine` (which are wrapped in `CustomerPropertyGate`), there's no mechanism to return to the wizard. The wizard's redirect (D1-F1) would send them to dashboard even if they manually navigated back to `/customer/onboarding`.

**Impact:** If D1-F1 is fixed and steps 5–7 become reachable, users who click the primary action buttons on steps 5/6 exit the wizard permanently and never see the completion screen.

**Fix:** Either:
1. Embed service-day selection and routine building inline within the wizard steps (preferred for a linear wizard UX)
2. Or pass a `returnTo` query param and handle the return:
   ```typescript
   navigate("/customer/service-day?returnTo=/customer/onboarding")
   ```
   And have the service-day page redirect back after completion.

---

### D1-F5 | MEDIUM | `selectedPlanId` is null on first render of SubscribeStep

**File:** `src/hooks/useOnboardingProgress.ts` (completeStep → upsertProgress)

**Problem:** When the user selects a plan, `completeStep("plan", { selected_plan_id: planId })` fires a mutation that:
1. Updates the DB (sets `selected_plan_id` and `current_step = "subscribe"`)
2. `onSuccess` calls `invalidateQueries`
3. React Query refetches the progress data (async)

Between steps 2 and 3, the component re-renders with `effectiveStep = "subscribe"` but `query.data` still has the old data (where `selected_plan_id` is null). SubscribeStep receives `planId={null}` and renders "Plan not found."

The user sees a brief flash of "Plan not found." before the refetch completes and shows the plan details.

**Fix:** Use optimistic cache update in the mutation's `onMutate` callback:
```typescript
onMutate: async (updates) => {
  await qc.cancelQueries({ queryKey: ["onboarding_progress", user?.id] });
  const prev = qc.getQueryData(["onboarding_progress", user?.id]);
  qc.setQueryData(["onboarding_progress", user?.id], (old) => ({
    ...old, ...updates,
  }));
  return { prev };
},
```

---

### D1-F6 | MEDIUM | `as any` casts in useOnboardingProgress despite generated types

**File:** `src/hooks/useOnboardingProgress.ts:55,65`

```typescript
.update({ ... } as any)
.insert({ ... } as any)
```

The Supabase types include `customer_onboarding_progress` (confirmed in the types diff). These `as any` casts are unnecessary and bypass type checking. Remove them — the types should match since they were generated from the same migration.

---

### D1-F7 | MEDIUM | No foreign key on `customer_onboarding_progress.user_id`

**Migration:** `20260227022012`

```sql
user_id uuid NOT NULL,
```

Missing `REFERENCES auth.users(id) ON DELETE CASCADE`. Orphaned onboarding records will remain if a user is deleted. The `UNIQUE(user_id)` constraint exists, but it only enforces uniqueness, not referential integrity.

---

## Low Findings

### D1-F8 | LOW | `customer_id` sent to `create-checkout-session` is silently ignored

**File:** `src/pages/customer/OnboardingWizard.tsx` (SubscribeStep)

```typescript
const { data, error } = await supabase.functions.invoke("create-checkout-session", {
  body: {
    plan_id: planId,
    customer_email: user.email,
    customer_id: user.id,     // ← not accepted by the edge function
    success_url: ...,
    cancel_url: ...,
  },
});
```

The `create-checkout-session` edge function does not accept `customer_id`. It derives the user identity from the JWT token and resolves the Stripe customer by `customer_email`. The `customer_id` field is silently ignored. Not a bug (the function works correctly), but the parameter is misleading.

### D1-F9 | LOW | No CHECK constraint on `current_step`

**Table:** `customer_onboarding_progress`

The `current_step` column is `TEXT NOT NULL DEFAULT 'property'` with no CHECK constraint. The valid steps are `property`, `zone_check`, `plan`, `subscribe`, `service_day`, `routine`, `complete`. Without a constraint, any string can be written. Consistent with the project's approach of frontend validation, but a DB constraint would add defense-in-depth (similar to D0-F4 which was fixed with a trigger).

---

## Structural Assessment

### What's Working Well
1. **Single-row-per-user pattern** — `UNIQUE(user_id)` ensures one onboarding record per customer. Clean upsert logic in the hook.
2. **Auto-advance logic** — `effectiveStep` correctly skips past completed steps (property exists → skip to zone_check, zone_check completed → skip to plan, etc.)
3. **Zone check UX** — Auto-advances on coverage with 1.5s delay for visual feedback. Waitlist fallback for uncovered areas.
4. **Property step validation** — Client-side validation with clear error messages. Optional fields hidden in collapsible `<details>`.
5. **Plan step reuses existing components** — `PlanCard`, `HandlesExplainer`, zone availability all wired correctly.
6. **RLS is well-structured** — Users manage own progress, admins can view all.
7. **Onboarding route is outside `CustomerPropertyGate`** — Prevents infinite redirect loop.
8. **`set_updated_at` trigger** — Timestamps are automatically maintained.

### What Needs Fixing Before D2
1. **D1-F1** (CRITICAL) — Redirect must check onboarding completion, not just subscription existence
2. **D1-F2** (HIGH) — Add `checkout=success` handling with polling/loading state
3. **D1-F3** (HIGH) — `CustomerPropertyGate` should not lock out churned customers

---

## Dependency Audit

| Import | Exists | Match |
|--------|--------|-------|
| `useProperty` (PropertyFormData, formatPetsForDisplay, save, isSaving, property) | YES | All exports match |
| `useZoneLookup` (zoneName, isLoading, isCovered, isNotCovered) | YES | All exports match |
| `usePlans("active")` + `Plan` type | YES | Status filter and type both work |
| `useCustomerSubscription` | YES | Returns useQuery result (data, isLoading) |
| `join-waitlist` edge function | YES | Accepts email, full_name, zip_code, source |
| `create-checkout-session` edge function | YES | Accepts plan_id, customer_email, success_url, cancel_url (`customer_id` ignored) |
| `PlanCard` (`onBuildRoutine` prop) | YES | Prop exists, renders "Get Started" button |
| `/customer/service-day` route | YES | Wrapped in CustomerPropertyGate |
| `/customer/routine` route | YES | Wrapped in CustomerPropertyGate |

---

## Final Finding Tracker

| ID | Severity | Status | Description |
|----|----------|--------|-------------|
| D1-F1 | CRITICAL | Open | Wizard redirects to dashboard after step 4 — steps 5–7 unreachable |
| D1-F2 | HIGH | Open | No checkout=success handling — no loading/polling after Stripe redirect |
| D1-F3 | HIGH | Open | CustomerPropertyGate blocks churned customers from their account |
| D1-F4 | MEDIUM | Open | Steps 5–6 navigate away from wizard with no return mechanism |
| D1-F5 | MEDIUM | Open | selectedPlanId null flash between step advance and query refetch |
| D1-F6 | MEDIUM | Open | `as any` casts unnecessary — Supabase types include the table |
| D1-F7 | MEDIUM | Open | No FK on user_id — orphaned records on user deletion |
| D1-F8 | LOW | Open | customer_id sent to create-checkout-session is ignored |
| D1-F9 | LOW | Open | No CHECK constraint on current_step column |

**Sprint D1 has 1 critical and 2 high findings that must be resolved before D2.**
