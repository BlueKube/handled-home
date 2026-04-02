# Full Implementation Plan: Round 11 — Moving Pipeline Completion & Operational Automation

> **Created:** 2026-04-02
> **Purpose:** Close the operational gaps from Round 10's moving wizard. Auto-pause subscriptions on move date, notify customer leads on zone launch, and send new homeowner warm handoff communications.

---

## Context

Round 10 built the moving wizard, household members, and phone identity. But three critical operational gaps remain:
1. Subscriptions aren't auto-paused on move date — customers get billed after moving
2. Customer leads have no zone launch notification trigger (providers do)
3. New homeowner contact info is captured but never acted on

### Strategy
- **Phase 1**: Auto-pause subscriptions on move date (highest urgency — billing impact)
- **Phase 2**: Customer lead zone launch trigger (copy provider pattern)
- **Phase 3**: New homeowner warm handoff edge function + admin visibility
- **Phase 4**: Doc sync

---

## Phase 1: Subscription Pause on Move Date

**Problem:** The moving wizard saves `keep_services_until_move` and `move_date`, but nothing auto-cancels the subscription. Customers will be billed after they leave.

**Goals:**
1. Database function that checks for property_transitions where move_date <= today AND status = 'planned'
2. Auto-cancel matching subscriptions (set cancel_at_period_end)
3. Update transition status to 'completed'

**Scope:**
- Migration: `process_move_date_transitions()` function
- pg_cron job or daily trigger: run the function daily
- Edge function alternative if pg_cron isn't suitable

**Estimated batches:** 1 (S)

---

## Phase 2: Customer Lead Zone Launch Notifications

**Problem:** `customer_leads` table has no auto-notify trigger. When a zone launches, moving customers saved as leads should be notified — same pattern as `auto_notify_zone_leads` for providers.

**Goals:**
1. When market_zone_category_state transitions to SOFT_LAUNCH/OPEN, notify matching customer_leads
2. Add notified_at column to customer_leads
3. Reuse the same trigger pattern from provider leads

**Scope:**
- Migration: add notified_at to customer_leads
- Migration: `auto_notify_customer_leads()` trigger on market_zone_category_state

**Estimated batches:** 1 (S)

---

## Phase 3: New Homeowner Warm Handoff

**Problem:** The moving wizard captures new homeowner contact info but nothing is done with it. This is the highest-value lead in the system.

**Goals:**
1. Edge function that processes property_transitions with new homeowner info
2. Queries the property's service history to personalize the outreach
3. Creates a customer_lead for the new homeowner
4. Admin visibility: show pending handoffs on an admin page

**Scope:**
- Edge function: `process-new-homeowner-handoff`
- Queries property's subscription + service categories for context
- Inserts customer_lead with source='referral' for the new homeowner
- Admin ProviderLeads page: add "Customer Leads" tab (or new page)

**Estimated batches:** 2 (S)

---

## Phase 4: Doc Sync

**Estimated batches:** 1 (Micro)

---

## Execution Order

1. **Phase 1** — Subscription pause (billing urgency)
2. **Phase 2** — Customer lead notifications (completes the pipeline)
3. **Phase 3** — New homeowner handoff (retention opportunity)
4. **Phase 4** — Doc sync

**Estimated total:** 5 batches across 4 phases

---

## Success Criteria

1. Subscriptions auto-cancel on move date (no post-move billing)
2. Customer leads notified when their target zone launches
3. New homeowner contact info creates a customer lead and is visible to admins
4. Full pipeline: customer moves → services pause → new homeowner contacted → customer re-engaged at new address when zone launches
