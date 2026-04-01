# Full Implementation Plan: Round 9 — Provider Funnel Hardening & Automation

> **Created:** 2026-04-01
> **Purpose:** Close the gaps identified after Round 8's provider conversion funnel build. Focus on data integrity (deduplication, lead-to-application linking), real category gap intelligence, automated zone launch triggers, and referral attribution. These improvements make the funnel production-ready rather than prototype-grade.

---

## Context

Round 8 built the full provider acquisition funnel: browse page lead capture, post-application messaging, admin pipeline, and zone launch notifications. But several gaps exist:

1. **Duplicate leads** — No uniqueness constraint on email; resubmission creates duplicates
2. **Naive category gaps** — Post-application screen shows all categories minus the provider's, rather than querying actual zone provider coverage
3. **Referral form accessible without auth** — Could crash if auth context is missing
4. **No lead-to-application linking** — When a lead applies, their lead status doesn't auto-update
5. **No email integration** — notify-zone-leads marks leads but sends no emails
6. **No referral attribution** — When a referred provider applies, no automatic link back
7. **No progressive lead recognition** — Returning leads see the same generic form
8. **Manual zone launch triggers** — Admin must manually click "Notify" for each zone
9. **No referral incentives** — "Know someone?" form has no stated reward

### Strategy

- **Phase 1** fixes data integrity (dedup, auth guard, lead-application linking) — foundational
- **Phase 2** adds real category gap intelligence from zone data — improves messaging quality
- **Phase 3** automates zone launch notifications — removes manual admin step
- **Phase 4** adds referral attribution and incentive messaging — closes the viral loop
- **Phase 5** adds progressive lead recognition for returning visitors
- **Phase 6** doc sync

---

## Phase 1: Data Integrity & Lead-Application Linking

**Problem:** Duplicate leads accumulate, the referral form can crash without auth, and there's no connection between a lead record and the application they eventually submit.

**Goals:**
1. Add unique constraint on `provider_leads.email` with upsert logic
2. Guard referral form against missing auth context
3. Auto-update lead status to "applied" when matching email submits a provider application
4. Add `provider_lead_id` column to `provider_applications` for explicit linking

**Scope:**
- Migration: unique index on `provider_leads.email`, add `provider_lead_id` FK to `provider_applications`
- Update ProviderBrowse.tsx to use upsert instead of insert (update categories/zip on re-submit)
- Update Apply.tsx ProviderReferralForm to handle missing auth gracefully
- Database trigger or application-level hook: on provider_application insert, match email against provider_leads and update status

**Estimated batches:** 2 (S)

---

## Phase 2: Real Category Gap Intelligence

**Problem:** The post-application screen shows "needed categories" as all categories minus what the provider applied for. This is misleading — some of those categories may already have providers in the zone. Real category gaps should come from the zone's `market_zone_category_state` data.

**Goals:**
1. Query actual zone provider coverage to determine which categories truly lack providers
2. Show only genuinely needed categories on the post-application screen
3. Show category gap counts: "We need 2 more pest control providers in your area"

**Scope:**
- Create or reuse an RPC that returns category coverage for a set of ZIP codes
- Update Apply.tsx status screen to call this RPC and display real gaps
- Fallback to current behavior if RPC fails or zone data is unavailable

**Estimated batches:** 2 (S-M)

---

## Phase 3: Automated Zone Launch Notifications

**Problem:** When a zone transitions to `soft_launch` or `live`, an admin must manually navigate to the Provider Leads page and click "Notify" for each zone. This should be automatic.

**Goals:**
1. Database trigger on `zones.status` change that invokes the notify-zone-leads function
2. Or: pg_cron job that checks for recently launched zones and notifies matching leads
3. Notification log: track which zones triggered notifications and when

**Scope:**
- Migration: add `notified_at` column to `provider_leads` for timestamp tracking
- Create a `notify_zone_leads_on_launch` database function or pg_cron entry
- The function calls the existing notify-zone-leads edge function logic (or implements it directly in SQL)
- Add a notification log view on the admin Provider Leads page

**Estimated batches:** 2 (S)

---

## Phase 4: Referral Attribution & Incentive Messaging

**Problem:** When a referred provider applies, there's no automatic link back to the referral record. Also, the "Know someone?" form has no stated incentive — providers have no reason to refer beyond goodwill.

**Goals:**
1. Auto-match: when a new provider application is submitted, check `provider_referrals` for matching name/contact and update referral status to "applied"
2. Add referral incentive messaging: "Refer 3 providers and get priority review" or similar
3. Show referral count on the post-application status screen: "You've referred X providers"

**Scope:**
- Application-level or trigger-based matching: on application insert, query provider_referrals by contact info
- Update ProviderReferralForm to show incentive messaging
- Add referral count query to post-application status screen
- Update admin Referrals tab to show attribution status

**Estimated batches:** 2 (S-M)

---

## Phase 5: Progressive Lead Recognition

**Problem:** If a lead returns to `/providers` after submitting the form, they see the same generic form. They should see a personalized message acknowledging they're already in the pipeline.

**Goals:**
1. On page load, check if the visitor's email exists in provider_leads (requires them to enter email first, or use localStorage)
2. If recognized: show "Welcome back — we're at X% of launch readiness in your ZIP. Apply now!"
3. If they've already applied: show "Your application is under review" with a link to check status

**Scope:**
- Add a "check lead status" mechanism — either localStorage flag after submission, or an email lookup endpoint
- Update ProviderBrowse.tsx to show returning-lead messaging
- Keep it lightweight — no auth required, just email-based recognition

**Estimated batches:** 2 (S)

---

## Phase 6: Doc Sync

**Estimated batches:** 1 (Micro)

---

## Execution Order

1. **Phase 1** — data integrity (foundation for everything else)
2. **Phase 2** — real category gaps (improves post-application messaging quality)
3. **Phase 3** — automated notifications (removes manual admin step)
4. **Phase 4** — referral attribution (closes the viral loop)
5. **Phase 5** — progressive lead recognition (improves returning visitor conversion)
6. **Phase 6** — doc sync

**Estimated total:** 11 batches across 6 phases

---

## Success Criteria

1. No duplicate leads in provider_leads table (unique email constraint)
2. Lead status auto-updates to "applied" when a matching provider application is submitted
3. Category gaps on post-application screen reflect actual zone provider coverage
4. Zone launch triggers automatic notification to matching leads (no manual admin action)
5. Referred providers are automatically attributed to their referral record
6. Returning leads see personalized messaging on the browse page
