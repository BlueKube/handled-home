-- Seed autopilot health threshold dials into assignment_config
INSERT INTO public.assignment_config (config_key, config_value, description)
VALUES
  ('autopilot_max_unassigned_locked', '0'::jsonb, 'Maximum unassigned jobs in LOCKED window before RED status'),
  ('autopilot_sla_risk_threshold', '3'::jsonb, 'Number of SLA-risk jobs before YELLOW status'),
  ('autopilot_max_proof_missing_rate', '10'::jsonb, 'Max proof missing rate (%) before YELLOW status'),
  ('autopilot_max_reschedule_rate_locked', '5'::jsonb, 'Max reschedule rate (%) inside LOCKED before YELLOW status'),
  ('autopilot_max_provider_callouts_day', '2'::jsonb, 'Max provider call-outs per day before YELLOW status'),
  ('autopilot_max_avg_drive_minutes', '45'::jsonb, 'Max avg drive minutes per route before YELLOW status'),
  ('autopilot_max_open_exceptions', '5'::jsonb, 'Max open ops exceptions before RED status'),
  ('autopilot_max_issue_rate_7d', '5'::jsonb, 'Max issue rate (%) over 7 days before YELLOW status'),
  ('autopilot_max_redo_intents_7d', '2'::jsonb, 'Max redo intents in 7 days before YELLOW status')
ON CONFLICT (config_key) DO NOTHING;