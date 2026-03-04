
-- Sprint 6: Seed 20 config dials for route sequencing, bundling, ETA, availability, anchored, late
INSERT INTO public.assignment_config (config_key, config_value, description) VALUES
  -- Bundling
  ('setup_base_minutes',        to_jsonb(5::numeric),    'Base setup‑time discount per additional task at same stop'),
  ('setup_cap_minutes',         to_jsonb(15::numeric),   'Maximum total setup discount at a single stop'),
  ('split_penalty_minutes',     to_jsonb(20::numeric),   'Penalty minutes when a multi-task stop must be split across providers'),
  -- Sequencing
  ('min_improvement_minutes',   to_jsonb(8::numeric),    'Minimum travel-time savings to accept a 2-opt swap'),
  ('min_improvement_percent',   to_jsonb(7::numeric),    'Minimum % improvement to accept a 2-opt swap'),
  ('overtime_weight',           to_jsonb(2.0::numeric),  'Cost multiplier for each minute of provider overtime'),
  ('window_violation_weight',   to_jsonb(5.0::numeric),  'Cost multiplier for each minute a stop violates its time window'),
  ('reorder_thrash_weight',     to_jsonb(1.0::numeric),  'Penalty weight for reordering stops vs prior night sequence'),
  ('split_penalty_weight',      to_jsonb(1.0::numeric),  'Weight applied to split_penalty_minutes in the objective function'),
  -- ETA
  ('base_range_minutes',        to_jsonb(60::numeric),   'Base ETA window width in minutes (±half applied to planned arrival)'),
  ('increment_per_bucket',      to_jsonb(15::numeric),   'Additional ETA width per stop-index bucket'),
  -- Availability
  ('min_handled_hours_per_week',      to_jsonb(8::numeric),  'Minimum weekly Handled-available hours for a provider'),
  ('full_marketplace_hours_per_week', to_jsonb(12::numeric), 'Weekly hours needed for full marketplace participation'),
  ('max_recurring_blocks_per_week',   to_jsonb(3::numeric),  'Maximum recurring blocked windows per week'),
  ('max_segments_per_day',            to_jsonb(3::numeric),  'Maximum schedulable segments per provider per day'),
  ('min_segment_minutes',             to_jsonb(90::numeric), 'Minimum duration of a schedulable segment'),
  -- Anchored
  ('anchor_buffer_minutes',           to_jsonb(30::numeric), 'Buffer before/after an anchored blocked window'),
  ('max_added_drive_minutes_per_day', to_jsonb(20::numeric), 'Max additional drive minutes from anchored inserts per day'),
  ('max_extra_stops_per_day',         to_jsonb(1::numeric),  'Max extra stops inserted around anchored windows per day'),
  -- Late
  ('late_grace_minutes',              to_jsonb(15::numeric), 'Grace period before a provider is flagged as late')
ON CONFLICT (config_key) DO NOTHING;
