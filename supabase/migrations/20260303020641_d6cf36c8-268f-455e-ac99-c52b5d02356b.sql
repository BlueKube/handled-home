
-- Fix 1: Seed the 4 scheduling config keys
INSERT INTO public.admin_system_config (config_key, config_value, description)
VALUES
  ('scheduling.appointment_window_minutes', '120'::jsonb, 'Default appointment window length in minutes'),
  ('scheduling.eta_range_display', '"day_plus_range"'::jsonb, 'Customer promise display policy'),
  ('scheduling.arrival_notification_minutes', '15'::jsonb, 'Minutes before arrival to send notification'),
  ('scheduling.preference_pricing_mode', '"scarcity"'::jsonb, 'Paid preference pricing model')
ON CONFLICT (config_key) DO NOTHING;

-- Fix 2: Revert provider policy on provider_work_profiles from FOR ALL to granular SELECT + INSERT + UPDATE (no DELETE)
DROP POLICY IF EXISTS "Providers can manage own work profile" ON public.provider_work_profiles;

CREATE POLICY "Providers can view own work profile"
  ON public.provider_work_profiles
  FOR SELECT TO authenticated
  USING (public.user_is_provider_owner(auth.uid(), provider_org_id));

CREATE POLICY "Providers can create own work profile"
  ON public.provider_work_profiles
  FOR INSERT TO authenticated
  WITH CHECK (public.user_is_provider_owner(auth.uid(), provider_org_id));

CREATE POLICY "Providers can update own work profile"
  ON public.provider_work_profiles
  FOR UPDATE TO authenticated
  USING (public.user_is_provider_owner(auth.uid(), provider_org_id));
