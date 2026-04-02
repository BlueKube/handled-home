# Batch 2: ProviderLeads Decomposition

## Phase
Round 13: Phone Identity & Account Management

## Review: Quality

## Scope
Split `src/pages/admin/ProviderLeads.tsx` (604 lines) into:
- `src/pages/admin/ProviderLeads.tsx` — Main page (queries + tabs shell)
- `src/components/admin/leads/LeadsTab.tsx` — Leads table with filters
- `src/components/admin/leads/ReferralsTab.tsx` — Referrals table
- `src/components/admin/leads/CustomerLeadsTab.tsx` — Customer leads table

ZipAggregationTab stays inline since it's tightly coupled to the page's queryClient.

## Changes
1. Extract LeadsTab, ReferralsTab, CustomerLeadsTab into separate files
2. Move shared types and constants (Lead, Referral, STATUS_COLORS, status option arrays) to the main file or a shared location
3. Each extracted file under 300 lines

## Acceptance Criteria
- [ ] ProviderLeads.tsx under 300 lines after extraction
- [ ] All extracted components under 300 lines
- [ ] No behavioral changes — same queries, same filters, same UI
- [ ] TypeScript compiles clean
- [ ] All imports resolve correctly
