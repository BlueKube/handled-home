

# Module 12 Code Review Fixes

Comprehensive fix plan addressing all 17 issues identified in the code review, organized by priority.

---

## MUST FIX (5 issues)

### P1 + P2: Enum mismatches in SupportNew.tsx

**File:** `src/pages/customer/SupportNew.tsx`

Fix the `ticketTypeMap` at lines 25-32:
- Change `missed: "missed_service"` to `missed: "missed_item"` (matches DB enum `missed_item`)
- Change `routine_change: "other"` to `routine_change: "routine_change"` (matches DB enum `routine_change`)

### R1: Customer can UPDATE admin-controlled ticket fields

**Database migration** — Add a `BEFORE UPDATE` trigger on `support_tickets` that, for non-admin users, prevents changes to protected columns: `status`, `resolution_summary`, `resolved_at`, `resolved_by_user_id`, `ai_summary`, `ai_evidence_score`, `ai_risk_score`, `ai_classification`, `sla_due_at`, `policy_version_id`, `policy_scope_chain`. If `OLD.value != NEW.value` for any of these columns and the caller is not an admin, raise an exception.

### R2: Customer acceptOffer fails — no UPDATE RLS on offers

**Database migration** — Create a `SECURITY DEFINER` RPC function `accept_support_offer(p_offer_id uuid)` that:
1. Verifies the caller owns the ticket (via offer -> ticket -> customer_id = auth.uid())
2. Verifies the offer is in `pending` status
3. Updates the offer to `accepted`, sets `accepted_at`
4. Expires all other pending offers on the same ticket
5. Updates the ticket status to `resolved`, sets `resolved_at` and `resolved_by_user_id`
6. Inserts an `offer_accepted` event

**File:** `src/hooks/useTicketActions.ts` — Replace the `acceptOffer` mutation body with a single `supabase.rpc("accept_support_offer", { p_offer_id: offerId })` call.

### P8: Admin cannot create/present resolution offers

**File:** `src/pages/admin/SupportTicketDetail.tsx` — Add a "Present Offer" UI section with:
- Offer type selector (credit, redo_intent, addon, refund, plan_change, review_by_time, no_action)
- Amount field (for credit/refund types)
- Description textarea
- Submit button

**File:** `src/hooks/useTicketActions.ts` — Add an `adminPresentOffer` mutation that inserts into `support_ticket_offers` and logs an `offer_presented` event. Also update ticket status to `awaiting_customer`.

---

## SHOULD FIX (6 issues)

### D1: No storage bucket for support attachments

**Database migration** — Create `support-attachments` storage bucket (private). Add RLS policies on `storage.objects`:
- Customers can upload to their own ticket paths
- Providers can upload to their org's ticket paths
- Admins have full access

### P4: Provider support not in sidebar or bottom tabs

**File:** `src/components/AppSidebar.tsx` — Add `{ title: "Support", url: "/provider/support", icon: HelpCircle }` to `providerNav` array (before Settings).

**File:** `src/components/BottomTabBar.tsx` — No change needed (provider already has "More" tab which covers overflow items).

**File:** `src/components/MoreMenu.tsx` — Add a Support entry for provider role if not already present.

### P6: SLA breach queue filter is wrong

**File:** `src/hooks/useSupportTickets.ts` — Change line 64 from:
```
query = query.not("sla_due_at", "is", null);
```
to:
```
query = query.not("sla_due_at", "is", null).lt("sla_due_at", new Date().toISOString());
```

### P7: SLA never computed on ticket creation

**File:** `src/hooks/useCreateTicket.ts` — After ticket insertion, compute `sla_due_at` based on a default SLA (48 hours for standard, 24 hours for high/critical severity). Update the ticket with the computed value. This is a simple default until the full policy engine wires SLA dials.

### P9: Admin cannot apply macros from ticket detail

**File:** `src/pages/admin/SupportTicketDetail.tsx` — Add an "Apply Macro" dropdown that:
1. Fetches active macros via `useSupportMacros`
2. On selection, creates an offer from the macro's patch data and logs a `macro_applied` event

### P11: Admin cannot change ticket status

**File:** `src/pages/admin/SupportTicketDetail.tsx` — Add a status transition dropdown/select allowing admin to move between: `open`, `awaiting_provider`, `awaiting_customer`, `in_review`, `escalated`. Each transition logs a `status_changed` event with the old and new status.

---

## NICE TO HAVE (5 issues)

### E1: support-ai-classify has no auth check

**File:** `supabase/functions/support-ai-classify/index.ts` — Add auth verification: extract the JWT from the Authorization header, verify the user owns the ticket or is an admin. Return 403 otherwise.

### E2: AI doesn't write ai_classification to ticket

**File:** `supabase/functions/support-ai-classify/index.ts` — Add `ai_classification: result.classification` to the ticket update call (line 197-202).

### P3 + P5: No photo upload for customer or provider

**Files:** `src/pages/customer/SupportNew.tsx`, `src/pages/provider/SupportTicketDetail.tsx` — Add a simple file input that uploads to the `support-attachments` bucket and inserts a row into `support_attachments`. Gated behind D1 (bucket must exist first).

### P10: No manual "Run AI" button for admin

**File:** `src/pages/admin/SupportTicketDetail.tsx` — Add a "Re-classify" button that calls `useSupportAiClassify` and invalidates the ticket query on success.

---

## Technical Details

### Database Migration (single migration file)

```text
1. BEFORE UPDATE trigger on support_tickets to protect admin fields (R1)
2. SECURITY DEFINER function accept_support_offer (R2)
3. Storage bucket support-attachments with RLS (D1)
4. Grant EXECUTE on accept_support_offer to authenticated
```

### Files Modified

| File | Changes |
|------|---------|
| `src/pages/customer/SupportNew.tsx` | Fix 2 enum values (P1, P2) |
| `src/hooks/useTicketActions.ts` | Replace acceptOffer with RPC call (R2), add adminPresentOffer + adminChangeStatus mutations |
| `src/hooks/useSupportTickets.ts` | Fix SLA breach filter (P6) |
| `src/hooks/useCreateTicket.ts` | Add SLA computation (P7) |
| `src/pages/admin/SupportTicketDetail.tsx` | Add offer creation UI (P8), macro apply (P9), status change (P11), re-classify button (P10) |
| `src/components/AppSidebar.tsx` | Add provider Support nav (P4) |
| `src/components/MoreMenu.tsx` | Add provider Support entry (P4) |
| `supabase/functions/support-ai-classify/index.ts` | Auth check (E1), write ai_classification (E2) |
| `src/pages/customer/SupportNew.tsx` | Photo upload UI (P3) |
| `src/pages/provider/SupportTicketDetail.tsx` | Photo upload UI (P5) |

