# Batch 7 — F21 Earnings Payout Button + F24 Support Ticket Creation + Duplicate Card Bug

## Scope
Three fixes across provider earnings and support flows.

## Requirements

### 1. F21 Earnings — "Set Up Payout Account" button
- Screen 21.1 spec: When payout account not ready, show accent sm button "Set Up Payout Account"
- Currently: Card shows status text only, no action button
- Button should navigate to provider settings (payout setup is a settings concern)

### 2. F24 Support — Ticket creation
- Spec: Providers should be able to create support tickets (category + description, min 10 chars)
- Currently: No "Create Ticket" button or flow exists for providers
- Add a "New Ticket" CTA button on Support page + create a provider ticket page
- Can mirror the customer SupportNew.tsx pattern but adapted for provider categories

### 3. F24 Support Detail — Duplicate resolution_summary card
- Lines 127-132 and 217-222 render identical resolution_summary cards
- Remove the duplicate at lines 217-222

## Files to Modify
- `src/pages/provider/Earnings.tsx` — Add "Set Up Payout Account" button
- `src/pages/provider/Support.tsx` — Add "New Ticket" CTA
- `src/pages/provider/SupportTicketDetail.tsx` — Remove duplicate card
- `src/pages/provider/SupportNew.tsx` — NEW: Provider ticket creation page

## Acceptance Criteria
- [ ] "Set Up Payout Account" accent button when account not ready
- [ ] "New Ticket" CTA on provider support page
- [ ] Provider ticket creation with category + description (min 10 chars)
- [ ] Duplicate resolution card removed from SupportTicketDetail
- [ ] Build passes
