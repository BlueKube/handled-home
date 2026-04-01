# Full Implementation Plan: Round 8 — Provider Conversion Funnel & Lead Pipeline

> **Created:** 2026-04-01
> **Purpose:** Build the full provider acquisition funnel from first touch through application. The browse page is built — this round adds the interactive investment layer, lead capture database, post-application zone messaging, and category gap recruitment.

---

## Context

Round 7 built the provider browse page (`/providers`) with earnings calculator, benefits, BYOC math, and a lead capture form. But the lead capture currently doesn't save anywhere — it's a UI placeholder. The provider application flow (`/provider/apply`) also reveals zone status before application, which can turn away providers from closed zones.

### Strategy

1. **Never show "closed"** — always show opportunity
2. **Collect every lead** — email + ZIP + categories, even if the zone isn't open
3. **Post-application messaging** — after they apply, tell them zone status + ask for help filling category gaps
4. **Category gap recruitment** — "We need 2 more pest control providers in your area. Know someone?"
5. **Notify pipeline** — when a zone is ready to launch, notify all leads in that ZIP

---

## Phase 1: Lead Capture Database + Provider Browse Integration

**Problem:** The lead capture form on `/providers` doesn't save data. We need a `provider_leads` table and an API to persist leads.

**Goals:**
1. Create `provider_leads` table (email, zip, categories, source, status, created_at)
2. Wire the browse page form to save leads via Supabase insert
3. Add admin visibility into the leads pipeline

**Scope:**
- Migration: `provider_leads` table with columns: id, email, zip_code, categories (text[]), source (browse/referral/manual), status (new/contacted/applied/declined), notes, created_at
- RLS: public insert (anon can submit), admin read/write
- Update `ProviderBrowse.tsx` to save leads on form submit
- Add lead count to admin Growth Console or a new "Provider Leads" section

**Estimated batches:** 2 (S)

---

## Phase 2: Post-Application Zone Messaging

**Problem:** After a provider applies, the current flow shows zone status immediately. If the zone is closed/waitlist, they see a dead end. Instead, we should always show encouragement and ask for help.

**Goals:**
1. Update post-application status messaging to never say "closed" or "not available"
2. Add "Help us launch" messaging: "We're working on launching in your area. Help us get there faster — know other service providers who might be interested?"
3. Add category gap display: "We need providers in these categories to launch: [Pest Control, Pool Service]"
4. Add referral form: provider can submit names/contacts of other providers they know

**Scope:**
- Update `src/pages/provider/Apply.tsx` — replace closed/waitlist messaging with opportunity messaging
- Create `provider_referrals` or reuse existing referral system for provider-to-provider referrals
- Show category gaps from zone data (which categories have providers vs which don't)
- "Know someone?" form: name, phone/email, category — saved to a referral/lead table

**Estimated batches:** 3 (S-M)

---

## Phase 3: Admin Provider Lead Pipeline

**Problem:** Admins need to see and act on provider leads — contact them, track status, see which ZIPs have demand.

**Goals:**
1. Admin page showing all provider leads with filtering (ZIP, category, status)
2. Lead-to-application conversion tracking
3. ZIP heat map: which ZIPs have the most provider interest
4. One-click "invite to apply" action (sends email)

**Scope:**
- `src/pages/admin/ProviderLeads.tsx` — lead pipeline page with table, filters, status management
- Route at `/admin/provider-leads`, nav entry under Growth
- Lead status workflow: new → contacted → applied → declined
- ZIP aggregation view: count of leads per ZIP code

**Estimated batches:** 2 (S-M)

---

## Phase 4: Zone Launch Notification Pipeline

**Problem:** When a zone is ready to launch, we need to notify all leads in that ZIP automatically.

**Goals:**
1. When a zone transitions to `soft_launch` or `live`, query provider_leads for matching ZIP codes
2. Send notification email: "Great news — we're launching in [ZIP]! Apply now to be a Founding Partner."
3. Track which leads were notified and their response

**Scope:**
- Edge function or cron trigger on zone status change
- Email template for provider launch notification
- Update lead status to "notified" after sending
- Link in email goes to `/providers` → "Apply Now"

**Estimated batches:** 2 (S)

---

## Phase 5: Doc Sync & Feature List Update

**Estimated batches:** 1 (Micro)

---

## Execution Order

1. **Phase 1** — database + form wiring (foundation)
2. **Phase 2** — post-application messaging (depends on knowing zone categories)
3. **Phase 3** — admin pipeline (depends on leads table)
4. **Phase 4** — launch notifications (depends on leads + zone status)
5. **Phase 5** — doc sync

**Estimated total:** 10 batches across 5 phases

---

## Success Criteria

1. Provider leads saved to database with email, ZIP, and categories
2. No "closed zone" messaging visible to providers at any point before or after application
3. Post-application screen shows category gaps and "know someone?" referral form
4. Admin can view, filter, and manage provider leads
5. Zone launch triggers automatic notification to matching leads
