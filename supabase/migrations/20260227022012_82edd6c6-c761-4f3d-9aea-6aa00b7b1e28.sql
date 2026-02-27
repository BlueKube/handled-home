
-- Ensure set_updated_at function exists
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Sprint D1: Customer onboarding progress tracking
CREATE TABLE public.customer_onboarding_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  current_step text NOT NULL DEFAULT 'property',
  completed_steps text[] NOT NULL DEFAULT '{}',
  selected_plan_id uuid REFERENCES public.plans(id),
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.customer_onboarding_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own onboarding progress"
  ON public.customer_onboarding_progress
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins view all onboarding progress"
  ON public.customer_onboarding_progress
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE INDEX idx_onboarding_progress_user ON public.customer_onboarding_progress(user_id);

CREATE TRIGGER set_onboarding_progress_updated_at
  BEFORE UPDATE ON public.customer_onboarding_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
