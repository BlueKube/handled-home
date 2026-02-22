# Module 04: SKU Catalog

## Scope
Service definitions with inclusions/exclusions, fulfillment modes, photo requirements, pricing.

## Tables
- `service_skus` — name, description, inclusions (text[]), exclusions (text[]), duration_minutes, fulfillment_mode (enum), weather_sensitive, required_photos (jsonb), base_price_cents, status, created_at

## Enums
- `fulfillment_mode`: same_day_preferred, same_week_allowed, independent_cadence

## Key User Stories
- As an admin, I can create and manage service SKUs
- As a customer, I can browse available services with clear scope
- As a provider, I can see SKU details and requirements for each job

## Dependencies
- Module 01 (auth & roles)
- Module 03 (zones — zone availability)

## Acceptance Criteria
- [ ] Admin can CRUD SKUs
- [ ] SKUs have clear inclusions/exclusions
- [ ] Fulfillment mode governs scheduling logic
- [ ] Required photos are defined per SKU
