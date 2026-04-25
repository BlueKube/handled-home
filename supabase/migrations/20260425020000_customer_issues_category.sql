-- Previous migration: 20260422210000_assign_bkennington_test_user_roles.sql
-- Batch 5.5 — add a `category` column to customer_issues for the 4-category
-- UI (Fix didn't hold / Damage / Task skipped / Feedback). Coexists with the
-- legacy `reason` column so existing consumers (admin dashboard, AI classifier)
-- keep working while the new UI ships. Legacy `reason` is derived on write
-- via a mapping in `src/hooks/useCustomerIssues.ts`; existing rows leave
-- `category` NULL and are not backfilled.
--
-- Retroactive backfill + admin-dashboard surface of the new column are
-- deferred; see docs/working/batch-specs/batch-5.5-report-issue-sheet-4-category.md
-- Out-of-scope section.

ALTER TABLE public.customer_issues
  ADD COLUMN IF NOT EXISTS category text
    CHECK (category IN ('fix_didnt_hold', 'damage', 'task_skipped', 'feedback'));

COMMENT ON COLUMN public.customer_issues.category IS
  'Batch 5.5 category taxonomy. Nullable for back-compat with existing rows; legacy `reason` column remains the operational source until a future migration retires it.';
