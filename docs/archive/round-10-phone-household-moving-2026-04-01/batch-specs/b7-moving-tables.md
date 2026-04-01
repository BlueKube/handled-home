# Batch 7: property_transitions + customer_leads Tables

## Phase
Phase 3 — "I'm Moving" Wizard

## Review: Quality

## Size: Small

## What
Create the data model for tracking property transitions (moves) and customer leads for uncovered zones.

## Requirements

### Table: property_transitions
| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK |
| property_id | uuid | FK to properties |
| old_owner_user_id | uuid | FK to auth.users, NOT NULL |
| new_owner_name | text | |
| new_owner_email | text | |
| new_owner_phone | text | |
| move_date | date | NOT NULL |
| new_address | text | |
| new_zip | text | |
| new_zip_covered | boolean | |
| status | text | NOT NULL DEFAULT 'planned', CHECK IN ('planned', 'completed', 'cancelled') |
| keep_services_until_move | boolean | DEFAULT true |
| notify_on_launch | boolean | DEFAULT false |
| created_at | timestamptz | DEFAULT now() |

### Table: customer_leads
| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK |
| email | text | NOT NULL |
| phone | text | |
| zip_code | text | NOT NULL |
| source | text | NOT NULL, CHECK IN ('moving', 'waitlist', 'referral') |
| status | text | NOT NULL DEFAULT 'new' |
| notify_on_launch | boolean | DEFAULT true |
| created_at | timestamptz | DEFAULT now() |

### RLS
- Both tables: user can read/insert own records, admin full access

## Files Changed
- `supabase/migrations/20260402200000_moving_wizard_tables.sql` (new)
