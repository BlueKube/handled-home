
-- Create category_requirements (was in failed migration 1)
CREATE TABLE IF NOT EXISTS public.category_requirements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_key text NOT NULL UNIQUE,
  risk_tier int NOT NULL DEFAULT 0,
  requires_gl_insurance boolean NOT NULL DEFAULT false,
  requires_coi_upload boolean NOT NULL DEFAULT false,
  requires_workers_comp_if_employees boolean NOT NULL DEFAULT false,
  requires_background_check boolean NOT NULL DEFAULT false,
  requires_license boolean NOT NULL DEFAULT false,
  license_authority text,
  requires_in_home_access boolean NOT NULL DEFAULT false,
  ops_review_required boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.category_requirements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_select_category_requirements"
  ON public.category_requirements FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "admin_manage_category_requirements"
  ON public.category_requirements FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Seed CA v1 defaults
INSERT INTO public.category_requirements (category_key, risk_tier, requires_gl_insurance, requires_coi_upload, requires_workers_comp_if_employees, requires_background_check, requires_license, license_authority, requires_in_home_access, ops_review_required)
VALUES
  ('trash_bins', 0, false, false, false, false, false, NULL, false, true),
  ('pet_yard', 0, false, false, false, false, false, NULL, false, true),
  ('windows', 1, true, true, false, false, false, NULL, false, true),
  ('gutters', 1, true, true, false, false, false, NULL, false, true),
  ('pressure_wash', 1, true, true, false, false, false, NULL, false, true),
  ('yard_cleanup', 1, true, true, false, false, false, NULL, false, true),
  ('lawn', 2, true, true, true, false, false, NULL, false, true),
  ('pool', 1, true, true, false, false, false, NULL, false, true),
  ('cleaning', 2, true, true, true, true, false, NULL, true, true),
  ('handyman', 2, true, true, true, true, true, 'CSLB', true, true)
ON CONFLICT (category_key) DO NOTHING;
