# Round 8 — Provider Conversion Funnel & Lead Pipeline

## Phase 1 — Lead Capture Database + Provider Browse Integration ✅

| Batch | Title | Size | Status | Context |
|-------|-------|------|--------|---------|
| B1 | provider_leads migration + RLS policies | S | ✅ | 8% |
| B2 | Wire browse page form to DB + admin lead count | S | ✅ | 12% |

## Phase 2 — Post-Application Zone Messaging ✅

| Batch | Title | Size | Status | Context |
|-------|-------|------|--------|---------|
| B3 | provider_referrals migration + CLOSED→HELP_LAUNCH banner rewrite | S | ✅ | 18% |
| B4 | Post-application status: category gaps + referral form | M | ✅ | 24% |
| B5 | Apply.tsx banner mapping cleanup + zone status labels | S | ✅ | 27% |

---

## Current Phase: Phase 3 — Admin Provider Lead Pipeline

### Phase Summary
Build an admin page showing all provider leads with filtering, status management, ZIP aggregation, and referral tracking.

### Batch Breakdown

| Batch | Title | Size | Status | Context |
|-------|-------|------|--------|---------|
| B6 | Admin ProviderLeads page + route + nav | M | ⬜ | |
| B7 | ZIP aggregation view + referrals tab | S | ⬜ | |

### Batch Details

**B6: Admin ProviderLeads page + route + nav**
- Create `src/pages/admin/ProviderLeads.tsx` with leads table, filters (ZIP, category, status), status update actions
- Add route at `/admin/provider-leads`
- Add nav entry under Growth section in AdminShell
- Lead status workflow: new → contacted → applied → declined

**B7: ZIP aggregation view + referrals tab**
- Add ZIP aggregation view: count of leads per ZIP code
- Add referrals tab showing provider_referrals data
- Lead-to-application conversion stat

### Dependencies
- B7 depends on B6 (extends the page)

---

## Session Handoff
- **Branch:** claude/provider-conversion-funnel-N3IE5
- **Last completed:** B5 (Phase 2 complete)
- **Next up:** B6 — Admin ProviderLeads page
- **Context at exit:** ~30%
- **Blockers:** None
- **Round progress:** Phases 1-2 of 5 complete, starting Phase 3
