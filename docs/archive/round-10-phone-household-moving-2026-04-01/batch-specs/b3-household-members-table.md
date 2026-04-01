# Batch 3: household_members Table + RLS

## Phase
Phase 2 — Household Members

## Review: Quality

## Size: Small

## What
Create the household_members table that links multiple auth users to one property. Include an auto-insert trigger for property owners.

## Requirements

### Table: household_members
| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK |
| property_id | uuid | FK to properties, NOT NULL |
| user_id | uuid | FK to auth.users, nullable (null = pending invite) |
| role | text | NOT NULL, CHECK IN ('owner', 'member') |
| invited_by | uuid | FK to auth.users |
| invite_email | text | nullable (for pending invites) |
| status | text | NOT NULL DEFAULT 'active', CHECK IN ('pending', 'active', 'removed') |
| created_at | timestamptz | DEFAULT now() |

### Unique constraints
- (property_id, user_id) — one membership per user per property
- (property_id, invite_email) where status = 'pending' — one pending invite per email per property

### RLS Policies
1. Users can read their own household memberships
2. Users can read other members of properties they belong to
3. Owner can insert new members (invites)
4. Owner can update/delete members
5. Admin full access

### Auto-insert trigger
- On properties INSERT: auto-create an 'owner' row in household_members for the property's user_id

## Acceptance Criteria
- [ ] Table created with all columns and constraints
- [ ] RLS policies correct
- [ ] Owner auto-inserted on property creation
- [ ] Unique constraints prevent duplicates

## Files Changed
- `supabase/migrations/20260402000000_household_members.sql` (new)
