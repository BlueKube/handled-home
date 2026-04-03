

## Plan: Apply Unapplied Migrations + Fix Remaining Build Errors

### Context from lessons-learned.md
The #1 lesson from this project is: **apply migrations before touching code**. Unapplied migrations cause Lovable to stub working code, and the generated types.ts won't include the missing tables/RPCs. These migrations were written by Claude Code across Rounds 8-11 and flagged in TODO.md as human action items.

### Step 1: Apply all 19 missing migrations via the database migration tool
These already exist as SQL files in `supabase/migrations/` but were never run against the database. I'll apply them as a consolidated migration. This creates:
- `provider_leads`, `provider_referrals`, `customer_leads`, `property_transitions`, `household_members` tables
- `accept_household_invites`, `get_category_gaps`, `delete_user_account` RPCs
- Various triggers (lead-application linking, zone notifications, referral attribution, phone matching)
- RLS policies for all new tables

After applying, the generated types auto-refresh → most build errors resolve automatically.

### Step 2: Fix 2 code-level errors that won't resolve from migrations alone

1. **`create-setup-intent/index.ts`** — Change `npm:@supabase/supabase-js@2.57.2` to `https://esm.sh/@supabase/supabase-js@2.57.2` (matches all other edge functions)

2. **`useCreateTicket.ts` line 31** — Replace `"ai_reviewing"` and `"in_progress"` with valid enum values (`"in_review"` and `"open"`)

### Step 3: Update TODO.md
Mark the Round 8, 9, and 10 migration items as complete.

### What this does NOT do
- No new features added
- No schema changes beyond what Claude Code already designed
- Email sending, pg_cron scheduling, Stripe Connect — all remain on TODO.md as before

