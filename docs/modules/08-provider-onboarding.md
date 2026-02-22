# Module 08: Provider Onboarding

## Scope
Organization setup, team roles, coverage areas, insurance/license tracking, vetting.

## Tables
- `provider_orgs` — name, status, insurance_expiry, license_info, created_at
- `provider_members` — org_id, user_id, role (owner/dispatcher/tech), status
- `provider_coverage` — org_id, zone_id, sku_ids (uuid[]), max_daily_stops

## Key User Stories
- As a provider owner, I can set up my organization
- As a provider, I can define coverage zones and SKUs
- As an admin, I can review and approve provider applications
- As the system, I track insurance/license expiry

## Dependencies
- Module 01 (auth & roles)
- Module 03 (zones)
- Module 04 (SKU catalog)

## Acceptance Criteria
- [ ] Provider org onboarding flow complete
- [ ] Coverage and capacity defined
- [ ] Admin approval workflow
- [ ] Expiry alerts
