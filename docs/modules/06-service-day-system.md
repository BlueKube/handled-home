# Module 06: Service Day System

## Scope
Auto-assignment by zone, rejection flow, controlled alternatives, cutoff enforcement.

## Tables
- `service_days` — user_id, zone_id, assigned_date, status (enum), cycle_month, created_at
- `service_day_alternatives` — service_day_id, alternate_date, status

## Enums
- `service_day_status`: scheduled, rejected, alternate_offered, locked, completed

## Key User Stories
- As a customer, I see my assigned Service Day
- As a customer, I can reject once and pick from alternatives
- As the system, I enforce cutoff windows and late fees
- As an admin, I can override assignments

## Dependencies
- Modules 01–05

## Acceptance Criteria
- [ ] Auto-assignment based on zone default day
- [ ] Rejection offers 2–3 alternatives
- [ ] Cutoff enforced (e.g., 48hrs)
- [ ] Status transitions are correct
