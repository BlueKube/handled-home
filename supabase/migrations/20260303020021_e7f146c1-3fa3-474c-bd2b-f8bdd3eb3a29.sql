
-- Clean up leftover snake_case provider_work_profiles policies
-- These are superseded by the new "Providers can manage own work profile" FOR ALL policy
DROP POLICY IF EXISTS "provider_insert_work_profile" ON public.provider_work_profiles;
DROP POLICY IF EXISTS "provider_select_work_profile" ON public.provider_work_profiles;
DROP POLICY IF EXISTS "provider_update_work_profile" ON public.provider_work_profiles;
