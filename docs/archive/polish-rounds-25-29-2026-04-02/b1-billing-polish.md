# B1 — Billing & Payments Polish

## Issues to Fix

### 1. BillingReceipt missing REFERRAL_CREDIT type (MUST-FIX)
**File:** `src/pages/customer/BillingReceipt.tsx:47`
**Problem:** `typeGroups` only has PLAN, ADD_ON, CREDIT, TAX. REFERRAL_CREDIT line items fall into PLAN bucket via else clause, making them display incorrectly.
**Fix:** Add REFERRAL_CREDIT to typeGroups.

### 2. BillingReceipt missing error state (SHOULD-FIX)
**File:** `src/pages/customer/BillingReceipt.tsx:44-45`
**Problem:** Only checks loading + null. If invoice query errors, shows "Invoice not found" instead of an error with retry.
**Fix:** Add isError check with QueryErrorCard.

### 3. useCustomerBilling credits loading not in isLoading (SHOULD-FIX)
**File:** `src/hooks/useCustomerBilling.ts:62`
**Problem:** `isLoading` checks invoices + paymentMethods but not credits. Credits could show stale 0 while loading.
**Fix:** Add `creditsQuery.isLoading` to isLoading.

### 4. formatCents duplication (SHOULD-FIX)
**Files:** Billing.tsx, BillingHistory.tsx, BillingReceipt.tsx, admin/Billing.tsx, admin/OpsBilling.tsx
**Problem:** Same `formatCents` function duplicated in 5 files.
**Fix:** Extract to `src/lib/formatCents.ts` and import everywhere.

## Acceptance Criteria
- [ ] REFERRAL_CREDIT line items render under their own section
- [ ] BillingReceipt shows error card on query failure
- [ ] Credits loading state included in useCustomerBilling.isLoading
- [ ] formatCents defined once, imported in all 5 files
- [ ] `npm run build` passes
- [ ] `npx tsc --noEmit` passes
