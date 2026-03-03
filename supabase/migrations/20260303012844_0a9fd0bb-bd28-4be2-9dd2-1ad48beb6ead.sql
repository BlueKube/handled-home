
-- Code review fix: remove redundant admin SELECT policy on visits (admin_all_visits already covers SELECT)
DROP POLICY IF EXISTS "admin_select_visits" ON public.visits;
