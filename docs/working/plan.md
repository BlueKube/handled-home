# Round 8 — Provider Conversion Funnel & Lead Pipeline

## Phase 1 — Lead Capture Database + Provider Browse Integration ✅

| Batch | Title | Size | Status | Context |
|-------|-------|------|--------|---------|
| B1 | provider_leads migration + RLS policies | S | ✅ | 8% |
| B2 | Wire browse page form to DB + admin lead count | S | ✅ | 12% |

---

## Current Phase: Phase 2 — Post-Application Zone Messaging

### Phase Summary
Update the provider application flow to never show "closed" or negative messaging. Replace with opportunity-focused language, category gap display, and a "know someone?" referral form. Create `provider_referrals` table for provider-to-provider referrals.

### Batch Breakdown

| Batch | Title | Size | Status | Context |
|-------|-------|------|--------|---------|
| B3 | provider_referrals migration + rewrite OpportunityBanner CLOSED variant | S | ⬜ | |
| B4 | Post-application status screen: category gaps + referral form | M | ⬜ | |
| B5 | Apply.tsx: replace CLOSED/WAITLIST banner mapping + zone status badges | S | ⬜ | |

### Batch Details

**B3: provider_referrals migration + rewrite CLOSED variant**
- Create `provider_referrals` table: id, referrer_email, referred_name, referred_contact, referred_category, zip_code, notes, status, created_at
- RLS: anon insert, admin read/write
- Rewrite OpportunityBanner CLOSED variant to never say "full" or "closed" — reframe as "Help us launch"
- Rewrite WAITLIST to be more opportunity-focused

**B4: Post-application status screen: category gaps + referral form**
- Update the post-application status screen (Apply.tsx lines 169-218) for waitlisted/submitted providers
- Add category gap display: "We need providers in these categories to launch: [list]"
- Add "Know someone?" referral form: name, contact, category — saves to provider_referrals
- Show encouraging messaging instead of dead-end waitlist language

**B5: Apply.tsx: zone status banner mapping cleanup**
- Update `mapStateToBannerVariant` default case and CLOSED case to never map to "CLOSED"
- Remove "CLOSED" banner variant entirely or repurpose it
- Clean up zone status badges in matched zones list (line 391) — no "closed" labels

### Dependencies
- B4 depends on B3 (needs provider_referrals table + updated banner)
- B5 can run after B3

---

## Session Handoff
- **Branch:** claude/provider-conversion-funnel-N3IE5
- **Last completed:** B2 (Phase 1 complete)
- **Next up:** B3 — provider_referrals migration + rewrite CLOSED variant
- **Context at exit:** ~15%
- **Blockers:** None
- **Round progress:** Phase 1 of 5 complete, starting Phase 2
