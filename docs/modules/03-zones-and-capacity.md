# Module 03: Zones & Capacity

## Scope
Geographic regions, zip-based zones, default service day assignment, capacity tracking.

## Tables
- `regions` — name, status, created_at
- `zones` — region_id, name, zip_codes (text[]), default_service_day (day_of_week enum), max_stops_per_day, max_minutes_per_day, status, created_at

## Key User Stories
- As an admin, I can create regions and zones
- As an admin, I can assign zip codes and default service days to zones
- As an admin, I can set capacity limits per zone
- As the system, I assign customers to zones based on their zip code

## Dependencies
- Module 01 (auth & roles)

## Acceptance Criteria
- [ ] Admin can CRUD regions and zones
- [ ] Zones have capacity guardrails
- [ ] Zip code lookup maps to correct zone
- [ ] Only admins can modify zones
