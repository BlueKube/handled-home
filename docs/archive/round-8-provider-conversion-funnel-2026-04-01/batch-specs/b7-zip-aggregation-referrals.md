# Batch 7: ZIP Aggregation + Referrals Tab

## Phase
Phase 3 — Admin Provider Lead Pipeline

## Review: Quality

## Size: Small

## What
Add tabs to the ProviderLeads page: Leads tab (existing table), ZIPs tab (aggregated counts), Referrals tab (provider_referrals data).

## Requirements

### Tabs Structure
1. "Leads" tab: existing lead table (move current content here)
2. "By ZIP" tab: ZIP code aggregation — count of leads per ZIP, sorted by count desc
3. "Referrals" tab: table of provider_referrals with referrer, referred name/contact/category, status

### ZIP Aggregation
- Group leads by zip_code
- Show count per ZIP, sorted highest first
- Show category breakdown per ZIP

### Referrals Tab
- Fetch provider_referrals
- Show: referrer_email, referred_name, referred_contact, referred_category, zip_code, status, created_at
- Status update same as leads

## Acceptance Criteria
- [ ] Three tabs: Leads, By ZIP, Referrals
- [ ] ZIP aggregation shows counts sorted by volume
- [ ] Referrals table shows all provider_referrals
- [ ] Status update works on referrals

## Files Changed
- `src/pages/admin/ProviderLeads.tsx` (edit)
