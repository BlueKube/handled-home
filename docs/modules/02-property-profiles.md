# Module 02: Property Profiles

## Scope
Customer property records — address, access info, pets, gate codes, lot size, HOA constraints.

## Tables
- `properties` — user_id, address fields, access_instructions, gate_code, pets (jsonb), parking_instructions, lot_size, notes, created_at, updated_at

## Key User Stories
- As a customer, I can add/edit my property details
- As a customer, I can specify access instructions and pet info
- As a provider, I can view property details for assigned jobs
- As an admin, I can view any property

## Dependencies
- Module 01 (auth & roles)

## Acceptance Criteria
- [ ] Customer can CRUD their own property
- [ ] Provider can read properties for their assigned jobs
- [ ] Admin can read all properties
- [ ] RLS enforces ownership
