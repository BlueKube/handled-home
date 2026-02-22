
-- 1a. New table: zone_service_week_config
CREATE TABLE public.zone_service_week_config (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  zone_id uuid NOT NULL REFERENCES public.zones(id) ON DELETE CASCADE,
  anchor_day integer NOT NULL DEFAULT 1,
  anchor_time_local time NOT NULL DEFAULT '00:00',
  cutoff_day_offset integer NOT NULL DEFAULT -1,
  cutoff_time_local time NOT NULL DEFAULT '18:00',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT zone_service_week_config_zone_id_key UNIQUE (zone_id),
  CONSTRAINT anchor_day_range CHECK (anchor_day >= 0 AND anchor_day <= 6)
);

ALTER TABLE public.zone_service_week_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage zone service week config"
  ON public.zone_service_week_config FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated can read zone service week config"
  ON public.zone_service_week_config FOR SELECT
  USING (true);

CREATE TRIGGER update_zone_service_week_config_updated_at
  BEFORE UPDATE ON public.zone_service_week_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 1b. Add columns to subscriptions
ALTER TABLE public.subscriptions
  ADD COLUMN access_activated_at timestamptz,
  ADD COLUMN billing_cycle_start_at timestamptz,
  ADD COLUMN billing_cycle_end_at timestamptz,
  ADD COLUMN next_billing_at timestamptz,
  ADD COLUMN billing_cycle_length_days integer NOT NULL DEFAULT 28,
  ADD COLUMN current_service_week_start_at timestamptz,
  ADD COLUMN current_service_week_end_at timestamptz,
  ADD COLUMN next_service_week_start_at timestamptz,
  ADD COLUMN next_service_week_end_at timestamptz;

-- 1c. Add column to plan_entitlement_versions
ALTER TABLE public.plan_entitlement_versions
  ADD COLUMN included_service_weeks_per_billing_cycle integer NOT NULL DEFAULT 4;

-- 1d. Add columns to customer_plan_selections
ALTER TABLE public.customer_plan_selections
  ADD COLUMN effective_billing_cycle_start_at timestamptz,
  ADD COLUMN effective_service_week_start_at timestamptz,
  ADD COLUMN is_locked_for_service_week boolean NOT NULL DEFAULT false,
  ADD COLUMN locked_at timestamptz;
