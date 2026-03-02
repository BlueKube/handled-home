
-- Fix from failed migration 1: enum extensions, column additions, agreement table

-- 1) Extend provider_application_status enum
ALTER TYPE public.provider_application_status ADD VALUE IF NOT EXISTS 'under_review';
ALTER TYPE public.provider_application_status ADD VALUE IF NOT EXISTS 'approved_conditional';

-- 2) Add new columns to provider_applications
ALTER TABLE public.provider_applications
  ADD COLUMN IF NOT EXISTS requested_categories text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS requested_zone_ids uuid[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS byoc_estimate_json jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS pitch_variant_seen text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS compliance_json jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS submitted_at timestamptz DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS decision_reason text DEFAULT NULL;

-- 3) Add founding partner slots to market_zone_category_state
ALTER TABLE public.market_zone_category_state
  ADD COLUMN IF NOT EXISTS founding_partner_slots_total int DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS founding_partner_slots_filled int DEFAULT 0;

-- 4) Create provider_agreement_acceptance
CREATE TABLE IF NOT EXISTS public.provider_agreement_acceptance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.provider_applications(id) ON DELETE CASCADE,
  clause_key text NOT NULL,
  accepted_at timestamptz NOT NULL DEFAULT now(),
  ip_address text,
  device_id text,
  UNIQUE (application_id, clause_key)
);
ALTER TABLE public.provider_agreement_acceptance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "provider_select_own_agreement"
  ON public.provider_agreement_acceptance FOR SELECT TO authenticated
  USING (
    application_id IN (
      SELECT id FROM public.provider_applications WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "provider_insert_own_agreement"
  ON public.provider_agreement_acceptance FOR INSERT TO authenticated
  WITH CHECK (
    application_id IN (
      SELECT id FROM public.provider_applications WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "admin_select_all_agreement"
  ON public.provider_agreement_acceptance FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_agreement_acceptance_app_id
  ON public.provider_agreement_acceptance(application_id);

-- 5) Index on provider_applications
CREATE INDEX IF NOT EXISTS idx_provider_applications_status_created
  ON public.provider_applications(status, created_at);
