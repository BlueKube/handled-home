-- ============================================
-- Phase 3 B1: Provider Accountability Tables
-- ============================================
-- Tracks provider incidents (no-shows, quality issues) and
-- probation status for the escalation ladder system.
-- ============================================

-- ============================================
-- PART 1: provider_incidents
-- ============================================

CREATE TABLE IF NOT EXISTS public.provider_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_org_id UUID NOT NULL REFERENCES public.provider_orgs(id),
  incident_type TEXT NOT NULL CHECK (incident_type IN ('no_show', 'quality_issue', 'access_failure', 'late_arrival', 'proof_missing')),
  severity TEXT NOT NULL DEFAULT 'minor' CHECK (severity IN ('minor', 'major', 'critical')),
  is_excused BOOLEAN NOT NULL DEFAULT false,
  excuse_reason TEXT,
  classified_by_user_id UUID,
  visit_id UUID,
  zone_id UUID REFERENCES public.zones(id),
  details JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_provider_incidents_org ON public.provider_incidents(provider_org_id);
CREATE INDEX IF NOT EXISTS idx_provider_incidents_type ON public.provider_incidents(incident_type);
CREATE INDEX IF NOT EXISTS idx_provider_incidents_created ON public.provider_incidents(created_at DESC);

COMMENT ON TABLE public.provider_incidents IS 'Tracks provider incidents (no-shows, quality issues, etc.) for the escalation ladder. Rolling window queries determine escalation tier.';

-- ============================================
-- PART 2: provider_probation
-- ============================================

CREATE TABLE IF NOT EXISTS public.provider_probation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_org_id UUID NOT NULL REFERENCES public.provider_orgs(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'failed', 'revoked')),
  entry_reason TEXT NOT NULL CHECK (entry_reason IN ('sla_orange', 'no_show_tier3', 'quality_sustained_red', 'manual')),
  sla_level_at_entry TEXT,
  targets JSONB NOT NULL DEFAULT '{}',
  deadline_at TIMESTAMPTZ NOT NULL,
  progress_notes TEXT,
  outcome TEXT CHECK (outcome IS NULL OR outcome IN ('improved', 'suspended', 'extended')),
  resolved_at TIMESTAMPTZ,
  resolved_by_user_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_provider_probation_org ON public.provider_probation(provider_org_id);
CREATE INDEX IF NOT EXISTS idx_provider_probation_status ON public.provider_probation(status);

COMMENT ON TABLE public.provider_probation IS 'Tracks provider probation periods with improvement targets and deadlines. Part of the 4-step accountability ladder: warning → probation → restricted → suspended.';

-- ============================================
-- PART 3: RLS Policies
-- ============================================

ALTER TABLE public.provider_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_probation ENABLE ROW LEVEL SECURITY;

-- Admin full access
CREATE POLICY admin_incidents_all ON public.provider_incidents
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.admin_memberships WHERE user_id = auth.uid() AND is_active = true)
  );

CREATE POLICY admin_probation_all ON public.provider_probation
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.admin_memberships WHERE user_id = auth.uid() AND is_active = true)
  );

-- Providers can read their own incidents
CREATE POLICY provider_incidents_read ON public.provider_incidents
  FOR SELECT USING (
    provider_org_id IN (
      SELECT org_id FROM public.provider_members WHERE user_id = auth.uid()
    )
  );

-- Providers can read their own probation
CREATE POLICY provider_probation_read ON public.provider_probation
  FOR SELECT USING (
    provider_org_id IN (
      SELECT org_id FROM public.provider_members WHERE user_id = auth.uid()
    )
  );
