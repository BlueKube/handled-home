-- Fix seed key names to match edge function and UI lookups
-- This ensures a fresh db reset produces correct keys

UPDATE public.zone_state_threshold_configs
SET config_key = 'protect_quality_utilization_enter'
WHERE config_key = 'protect_quality_enter';

UPDATE public.zone_state_threshold_configs
SET config_key = 'protect_quality_utilization_exit'
WHERE config_key = 'protect_quality_exit';

UPDATE public.zone_state_threshold_configs
SET config_key = 'provider_recruiting_utilization_trigger'
WHERE config_key = 'provider_recruiting_trigger_util';

UPDATE public.zone_state_threshold_configs
SET config_key = 'min_time_in_state_days'
WHERE config_key = 'minimum_time_in_state_days';