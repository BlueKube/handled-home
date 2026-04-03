# Batch Spec: R62-B4 — Policy Engine Runtime + Chargeback Intercept

## Review: Quality (Medium→Large tier)

## Problem
1. Policy engine schema exists but dials are never loaded at resolution time. $50 cap is hardcoded.
2. No scope assignment UI — admins can create policies but can't assign them to zones/categories/SKUs.
3. Billing disputes have no evidence-first intercept step.

## Files
- `supabase/functions/auto-resolve-dispute/index.ts` — load policy dials, use max_credit_cents
- `src/pages/admin/SupportPolicies.tsx` — add scope assignment section
- `src/pages/customer/SupportNew.tsx` — billing intercept step

## Changes

### 1. Wire policy dials into auto-resolve-dispute
- Query `support_policy_scopes` with precedence: provider → sku → category → zone → global
- Use `max_credit_cents` from policy dials instead of hardcoded 5000
- Use `evidence_required` and `generosity` from dials

### 2. Add scope assignment UI
- Below the policy list, add a "Scope Assignments" section showing existing assignments
- Form to create new scope: scope_type dropdown + scope_ref_id input + policy selector

### 3. Billing intercept step
- In SupportNew.tsx, when category = 'billing', show a "before you submit" step
- Fetch the customer's latest completed job evidence (photos, time-on-site)
- Display proof + offer to accept a credit directly without filing a ticket

## Acceptance Criteria
- [ ] auto-resolve-dispute loads policy dials from DB (falls back to defaults)
- [ ] Admin can assign policies to scopes (zone, category, SKU, provider, global)
- [ ] Billing category shows evidence + credit offer before ticket submission
- [ ] All existing auto-resolve behavior preserved when no policy scopes are configured
- [ ] npm run build + tsc --noEmit pass
