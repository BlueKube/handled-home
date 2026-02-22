# Module 07: Bundle Builder

## Scope
Per-cycle SKU selection, eligibility checks, prep instructions, confirmation.

## Tables
- `service_day_bundles` — service_day_id, created_at
- `bundle_items` — bundle_id, sku_id, status, prep_confirmed

## Key User Stories
- As a customer, I can select services for my upcoming Service Day
- As a customer, I see prep instructions before confirming
- As the system, I check eligibility (plan limits, SKU availability)

## Dependencies
- Module 04 (SKU catalog)
- Module 06 (Service Day system)

## Acceptance Criteria
- [ ] Customer can add/remove SKUs from bundle
- [ ] Eligibility enforced (plan limits)
- [ ] Prep instructions shown per SKU
- [ ] Bundle locks after cutoff
