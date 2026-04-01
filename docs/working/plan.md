# Round 9 — Provider Funnel Hardening & Automation

## Current Phase: Phase 1 — Data Integrity & Lead-Application Linking

### Phase Summary
Fix duplicate leads, guard referral form auth, and auto-link leads to applications when providers apply.

### Batch Breakdown

| Batch | Title | Size | Status | Context |
|-------|-------|------|--------|---------|
| B1 | Unique email constraint + upsert + auth guard | S | ⬜ | |
| B2 | Lead-to-application linking trigger | S | ⬜ | |

### Batch Details

**B1: Unique email constraint + upsert + auth guard**
- Migration: unique index on provider_leads.email
- ProviderBrowse.tsx: use upsert (ON CONFLICT UPDATE categories, zip_code, updated_at)
- Apply.tsx ProviderReferralForm: guard against missing user with fallback

**B2: Lead-to-application linking trigger**
- Migration: add provider_lead_id FK column to provider_applications
- Database trigger: on provider_applications insert, match user email against provider_leads and update status to 'applied', set provider_lead_id
- Requires joining auth.users to get email from user_id

### Dependencies
- B2 depends on B1 (unique email needed for reliable matching)

---

## Session Handoff
- **Branch:** claude/provider-conversion-funnel-N3IE5
- **Last completed:** Round 8 complete, docs synced
- **Next up:** B1 — Unique email constraint + upsert + auth guard
- **Context at exit:** N/A
- **Blockers:** None
- **Round progress:** Phase 1 of 6, batch 0 of 2 complete
