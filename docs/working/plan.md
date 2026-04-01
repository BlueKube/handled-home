# Round 8 — Provider Conversion Funnel & Lead Pipeline

## Current Phase: Phase 1 — Lead Capture Database + Provider Browse Integration

### Phase Summary
Create the `provider_leads` table and wire the existing browse page lead capture form to persist leads via Supabase. Add admin visibility into leads.

### Batch Breakdown

| Batch | Title | Size | Status | Context |
|-------|-------|------|--------|---------|
| B1 | provider_leads migration + RLS policies | S | ⬜ | |
| B2 | Wire browse page form to DB + admin lead count | S | ⬜ | |

### Batch Details

**B1: provider_leads migration + RLS policies**
- Create `provider_leads` table: id, email, zip_code, categories (text[]), source, status, notes, created_at, updated_at
- RLS: anon insert, admin read/write
- Size: Small (1 migration file)

**B2: Wire browse page form to DB + admin lead count**
- Update ProviderBrowse.tsx to insert leads via Supabase on form submit
- Add category selection to the lead capture form
- Add lead count display to admin Growth page
- Size: Small (2-3 files)

### Dependencies
- B2 depends on B1 (needs the table)

### Risk Areas
- `as any` casts needed for Supabase types until Lovable regenerates types.ts

---

## Session Handoff
- **Branch:** claude/provider-conversion-funnel-N3IE5
- **Last completed:** None (Round 8 just starting)
- **Next up:** B1 — provider_leads migration + RLS policies
- **Context at exit:** N/A
- **Blockers:** None
- **Round progress:** Phase 1 of 5, batch 0 of 2 complete
