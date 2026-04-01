# Batch 1: provider_leads Migration + RLS Policies

## Phase
Phase 1 — Lead Capture Database + Provider Browse Integration

## Review: Quality

## Size: Small

## What
Create the `provider_leads` table to store provider interest from the browse page, referrals, and manual admin entry.

## Requirements

### Table: provider_leads
| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK, default gen_random_uuid() |
| email | text | NOT NULL |
| zip_code | text | NOT NULL |
| categories | text[] | DEFAULT '{}' |
| source | text | NOT NULL, CHECK IN ('browse', 'referral', 'manual') |
| status | text | NOT NULL DEFAULT 'new', CHECK IN ('new', 'contacted', 'applied', 'declined', 'notified') |
| notes | text | |
| created_at | timestamptz | DEFAULT now() |
| updated_at | timestamptz | DEFAULT now() |

### RLS Policies
1. **Anon insert** — anyone can submit a lead (public form)
2. **Admin read** — admins can view all leads
3. **Admin update** — admins can update status/notes
4. **No public read** — leads are not publicly visible

### Indexes
- Index on zip_code (for zone launch notification queries)
- Index on status (for pipeline filtering)

## Acceptance Criteria
- [ ] Migration file creates table with all columns and constraints
- [ ] RLS enabled with correct policies
- [ ] Indexes on zip_code and status
- [ ] updated_at trigger for automatic timestamp updates

## Files Changed
- `supabase/migrations/20260401100000_provider_leads.sql` (new)
