
-- Sprint 7 Phase 1: Appointment Windows v1 — Schema Foundation

-- 1) Create scheduling profile enum
CREATE TYPE public.scheduling_profile AS ENUM ('appointment_window', 'day_commit', 'service_week');

-- 2) Create access mode enum
CREATE TYPE public.access_mode AS ENUM ('customer_present', 'provider_access', 'exterior_only');

-- 3) Add scheduling_profile + access_mode to service_skus
ALTER TABLE public.service_skus
  ADD COLUMN scheduling_profile public.scheduling_profile NOT NULL DEFAULT 'day_commit',
  ADD COLUMN access_mode public.access_mode NOT NULL DEFAULT 'exterior_only';

-- 4) Add service-week + scheduling columns to visits
ALTER TABLE public.visits
  ADD COLUMN scheduling_profile public.scheduling_profile NULL,
  ADD COLUMN service_week_start date NULL,
  ADD COLUMN service_week_end date NULL,
  ADD COLUMN due_status text NULL DEFAULT NULL,
  ADD COLUMN customer_window_preference text NULL,
  ADD COLUMN piggybacked_onto_visit_id uuid NULL REFERENCES public.visits(id);

-- 5) Create appointment_window_templates table (zone/category window slots)
CREATE TABLE public.appointment_window_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id uuid NOT NULL REFERENCES public.zones(id),
  category_key text NOT NULL,
  window_label text NOT NULL,
  window_start time NOT NULL,
  window_end time NOT NULL,
  day_of_week smallint NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(zone_id, category_key, window_label, day_of_week)
);

ALTER TABLE public.appointment_window_templates ENABLE ROW LEVEL SECURITY;

-- Admin-only management
CREATE POLICY "Admin full access on appointment_window_templates"
  ON public.appointment_window_templates
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.admin_memberships WHERE user_id = auth.uid() AND is_active = true)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.admin_memberships WHERE user_id = auth.uid() AND is_active = true)
  );

-- Authenticated users can read templates (needed for window offering)
CREATE POLICY "Authenticated read appointment_window_templates"
  ON public.appointment_window_templates
  FOR SELECT TO authenticated
  USING (true);

-- 6) Indexes
CREATE INDEX idx_visits_scheduling_profile ON public.visits (scheduling_profile) WHERE scheduling_profile IS NOT NULL;
CREATE INDEX idx_visits_service_week ON public.visits (service_week_end, due_status) WHERE service_week_end IS NOT NULL;
CREATE INDEX idx_visits_piggybacked ON public.visits (piggybacked_onto_visit_id) WHERE piggybacked_onto_visit_id IS NOT NULL;
CREATE INDEX idx_awt_zone_category ON public.appointment_window_templates (zone_id, category_key, is_active);
CREATE INDEX idx_service_skus_scheduling ON public.service_skus (scheduling_profile, access_mode);
