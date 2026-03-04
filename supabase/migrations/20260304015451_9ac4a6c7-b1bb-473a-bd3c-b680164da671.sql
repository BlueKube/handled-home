
-- Sprint 7 P1: Seed 11 appointment-window config dials
INSERT INTO public.assignment_config (config_key, config_value, description) VALUES
  ('max_windows_shown',                                  to_jsonb(6::numeric),    'Maximum appointment windows to show customer'),
  ('min_windows_to_show',                                to_jsonb(3::numeric),    'Minimum windows required before offering'),
  ('min_lead_time_hours',                                to_jsonb(24::numeric),   'Minimum hours before earliest offered window'),
  ('max_home_required_stops_per_provider_per_day',       to_jsonb(3::numeric),    'Cap on home-required stops per provider per day'),
  ('max_home_required_stops_per_zone_per_day',           to_jsonb(20::numeric),   'Cap on home-required stops per zone per day'),
  ('max_piggyback_added_minutes',                        to_jsonb(30::numeric),   'Max minutes a piggybacked task can add'),
  ('max_piggyback_added_percent',                        to_jsonb(0.25::numeric), 'Max percent duration increase from piggybacking'),
  ('due_soon_lead_hours',                                to_jsonb(48::numeric),   'Hours before due date to mark visit due_soon'),
  ('max_provider_committed_flexible_stops_per_day',      to_jsonb(1::numeric),    'Max flexible committed stops per provider per day'),
  ('max_provider_committed_flexible_minutes_per_day',    to_jsonb(60::numeric),   'Max flexible committed minutes per provider per day'),
  ('default_appointment_window_length_hours',            to_jsonb(3::numeric),    'Default appointment window length in hours')
ON CONFLICT (config_key) DO NOTHING;
