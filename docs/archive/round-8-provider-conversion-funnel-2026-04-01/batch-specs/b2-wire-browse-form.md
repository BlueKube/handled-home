# Batch 2: Wire Browse Page Form to DB + Admin Lead Count

## Phase
Phase 1 — Lead Capture Database + Provider Browse Integration

## Review: Quality

## Size: Small

## What
Connect the existing lead capture form on `/providers` to save leads to `provider_leads` table. Add category multi-select to the form. Add a provider leads stat card to the admin Growth page Funnels tab.

## Requirements

### ProviderBrowse.tsx Changes
1. Import supabase client
2. Add category multi-select using existing CATEGORIES array — providers can select which categories they're interested in
3. On form submit: insert into `provider_leads` with email, zip_code, selected categories, source='browse'
4. Handle errors with toast notification
5. Basic email validation before submit

### Admin Growth Page — Funnels Tab
1. Query `provider_leads` count grouped by status
2. Display as a "Provider Leads" funnel card in the Funnels tab alongside existing BYOC/Referral/BYOP funnels
3. Show: total leads, new, contacted, applied, declined

## Acceptance Criteria
- [ ] Lead capture form saves to provider_leads on submit
- [ ] Category multi-select lets providers pick their categories
- [ ] Error handling with toast on failure
- [ ] Admin Funnels tab shows provider leads funnel card
- [ ] Uses `as any` cast for Supabase types (provider_leads not in generated types)

## Files Changed
- `src/pages/ProviderBrowse.tsx` (edit)
- `src/pages/admin/Growth.tsx` (edit — FunnelsTab function)
