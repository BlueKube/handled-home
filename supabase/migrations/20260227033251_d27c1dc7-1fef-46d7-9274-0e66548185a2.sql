-- D1.5-F3: CHECK constraint on must_be_home_window values
ALTER TABLE public.service_day_preferences
  ADD CONSTRAINT must_be_home_window_check
  CHECK (must_be_home_window IS NULL OR must_be_home_window IN ('morning', 'afternoon'));

-- Also enforce consistency: if must_be_home is false, window must be null
ALTER TABLE public.service_day_preferences
  ADD CONSTRAINT must_be_home_window_consistency
  CHECK (must_be_home = true OR must_be_home_window IS NULL);