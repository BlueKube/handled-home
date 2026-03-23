# Batch 2: BYOC Onboarding Rewrite — 2-Step Wizard

## Why It Matters

The current BYOC wizard has 6 steps (recognition → confirm → property → home_setup → activating → success). The spec defines a streamlined 2-step flow that reduces friction and improves conversion: (1) Confirm Your Service with provider context + address, (2) Choose Plan & Activate with plan tiers + inline success.

## Scope

- **Screen 6.1**: Confirm Your Service — Provider context card + address input
- **Screen 6.2**: Choose Plan & Activate — Plan tier cards + activation + inline success

## Non-Goals

- Changing the `useByocOnboardingContext` hook (already complete)
- Zone validation of ZIP against provider coverage (future)
- Modifying the route in App.tsx (already exists)

## File Targets

| Action | File |
|--------|------|
| **Rewrite** | `src/pages/customer/ByocOnboardingWizard.tsx` |

## Key Design Decisions

1. **Consolidate 6 steps → 2 steps**: Recognition + confirm + property → Step 1. Home_setup removed (deferred). Plan selection + activation + success → Step 2.
2. **Reuse existing components**: `PlanCard`, `HandlesExplainer` from `src/components/plans/`
3. **Keep existing hooks**: `useByocOnboardingContext`, `useProperty`, `usePlans`, `useOnboardingProgress`
4. **Provider context card** on step 1 with avatar, name, category, cadence pre-filled
5. **Plan pre-selection** based on invite context (default to recommended if no preference)
6. **Inline success** replaces form on activation (no separate success step)

## Acceptance Criteria

1. Wizard shows 2 steps with progress indicator (Step 1 of 2 / Step 2 of 2)
2. Step 1: Provider context card with avatar + name + "Your provider" badge + category + cadence
3. Step 1: Address form (street, city, state, ZIP) with validation
4. Step 1: "Next" CTA + "Skip for now" ghost button
5. Step 2: Plan tier cards (Essential/Plus/Premium) using existing PlanCard component
6. Step 2: Caption "Your provider's service is included in all plans."
7. Step 2: "Activate Service" CTA + "Skip for now" ghost button
8. Step 2 success: Inline confirmation with CheckCircle + summary card + "Go to Dashboard" + "Explore Your Plan"
9. Invalid/expired invite shows fallback screen (keep existing)
10. Loading shows skeleton (keep existing)
11. Step persistence to metadata survives refresh
12. All existing BYOC activation logic preserved

## Regression Risks

- Must preserve invite validation and activation logic
- Must preserve metadata persistence for step restoration
- Must keep `useByocOnboardingContext` contract intact
- No max-w-lg constraints (CLAUDE.md)
