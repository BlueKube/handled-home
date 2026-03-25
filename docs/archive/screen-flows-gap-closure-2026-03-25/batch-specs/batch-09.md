# Batch 9 — F30 Support Assignment/Attachments + F31 Bundle Savings

## Scope

### 1. F30 Admin Support — Assignment dropdown
- Add assigned_to_user_id to ticket queries in useSupportTickets
- Add assignment dropdown on SupportDashboard ticket rows
- Add assign mutation to useTicketActions

### 2. F30 Admin Support Ticket Detail — Attachments section
- Render attachments from existing hook data (already fetched)
- Show file type icon, description, download link, timestamp
- No upload UI (storage policy not confirmed — deferred)

### 3. F31 Bundle Savings Card — CTA, dismiss, states
- Add "View Your Plan" CTA button (accent, sm)
- Add X dismiss button (persists via localStorage)
- Add empty state when savings <= 0
- Add loading skeleton

## Acceptance Criteria
- [ ] Assignment dropdown on admin support tickets
- [ ] Attachments displayed on ticket detail
- [ ] BundleSavingsCard has CTA, dismiss, empty state, loading skeleton
- [ ] Build passes
