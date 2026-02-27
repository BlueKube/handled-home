# Sprint D6 — Contextual Add-ons Review

**Reviewed by:** Claude (spec-compliance reviewer)
**Date:** 2026-02-27
**Result:** PASS with 3 findings (all resolved)

## Findings

| ID | Severity | Description | Resolution |
|----|----------|-------------|------------|
| D6-F1 | HIGH | `spend_handles` called with wrong arg order — `(sub_id, amount, 'addon', NULL)` instead of `(sub_id, customer_id, amount, reference_id)`. Integer in UUID slot = runtime crash. | Fixed: `spend_handles(p_subscription_id, v_customer_id, v_sku.handle_cost, v_order_id)` |
| D6-F2 | HIGH | `refund_handles` same signature mismatch — missing `customer_id` arg. | Fixed: `refund_handles(v_order.subscription_id, v_order.customer_id, v_order.handle_cost, v_order.id, NULL)` |
| D6-F3 | MEDIUM | `refund_addon` RPC is SECURITY DEFINER with no auth check — any authenticated user could refund any order. | Fixed: Added `has_role(auth.uid(), 'admin')` guard at top of function. |

## Additional improvements in fix migration
- Both RPCs now use `SET search_path = public` for security linter compliance
- Order is created before `spend_handles` so `v_order_id` can be passed as `p_reference_id` for proper ledger traceability
