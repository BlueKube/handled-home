
-- ============================================================
-- Sprint 3F/3G Phase 1 — Schema Foundation (Part 2)
-- Tables that reference provider_members
-- ============================================================

-- 4) provider_compliance_documents
CREATE TABLE IF NOT EXISTS public.provider_compliance_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.provider_orgs(id) ON DELETE CASCADE,
  doc_type text NOT NULL,
  storage_path text NOT NULL,
  expires_at date,
  status text NOT NULL DEFAULT 'uploaded',
  verified_by uuid,
  verified_at timestamptz,
  rejection_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.provider_compliance_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "provider_select_own_compliance_docs"
  ON public.provider_compliance_documents FOR SELECT TO authenticated
  USING (
    org_id IN (
      SELECT provider_org_id FROM public.provider_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "provider_insert_own_compliance_docs"
  ON public.provider_compliance_documents FOR INSERT TO authenticated
  WITH CHECK (
    org_id IN (
      SELECT provider_org_id FROM public.provider_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "admin_all_compliance_docs"
  ON public.provider_compliance_documents FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_compliance_docs_org_status
  ON public.provider_compliance_documents(org_id, status);

-- 5) BYOC invite links
CREATE TABLE IF NOT EXISTS public.byoc_invite_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.provider_orgs(id) ON DELETE CASCADE,
  zone_id uuid NOT NULL REFERENCES public.zones(id),
  category_key text NOT NULL,
  sku_id uuid REFERENCES public.service_skus(id),
  default_level_id uuid REFERENCES public.sku_levels(id),
  default_cadence text NOT NULL DEFAULT 'weekly',
  token text NOT NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.byoc_invite_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "provider_select_own_invite_links"
  ON public.byoc_invite_links FOR SELECT TO authenticated
  USING (
    org_id IN (
      SELECT provider_org_id FROM public.provider_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "provider_insert_own_invite_links"
  ON public.byoc_invite_links FOR INSERT TO authenticated
  WITH CHECK (
    org_id IN (
      SELECT provider_org_id FROM public.provider_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "admin_all_invite_links"
  ON public.byoc_invite_links FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 6) BYOC invite events
CREATE TABLE IF NOT EXISTS public.byoc_invite_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invite_id uuid NOT NULL REFERENCES public.byoc_invite_links(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  actor text NOT NULL DEFAULT 'system',
  payload jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.byoc_invite_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "provider_select_own_invite_events"
  ON public.byoc_invite_events FOR SELECT TO authenticated
  USING (
    invite_id IN (
      SELECT id FROM public.byoc_invite_links WHERE org_id IN (
        SELECT provider_org_id FROM public.provider_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "admin_all_invite_events"
  ON public.byoc_invite_events FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_invite_events_invite_created
  ON public.byoc_invite_events(invite_id, created_at);

-- 7) BYOC activations
CREATE TABLE IF NOT EXISTS public.byoc_activations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invite_id uuid NOT NULL REFERENCES public.byoc_invite_links(id) ON DELETE CASCADE,
  customer_user_id uuid NOT NULL,
  property_id uuid REFERENCES public.properties(id),
  provider_org_id uuid NOT NULL REFERENCES public.provider_orgs(id),
  sku_id uuid REFERENCES public.service_skus(id),
  level_id uuid REFERENCES public.sku_levels(id),
  cadence text NOT NULL DEFAULT 'weekly',
  status text NOT NULL DEFAULT 'active',
  activated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.byoc_activations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "provider_select_own_activations"
  ON public.byoc_activations FOR SELECT TO authenticated
  USING (
    provider_org_id IN (
      SELECT provider_org_id FROM public.provider_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "customer_select_own_activations"
  ON public.byoc_activations FOR SELECT TO authenticated
  USING (customer_user_id = auth.uid());

CREATE POLICY "admin_all_activations"
  ON public.byoc_activations FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_activations_provider_org
  ON public.byoc_activations(provider_org_id, activated_at);

-- 8) Additional indexes
CREATE INDEX IF NOT EXISTS idx_provider_applications_status_created
  ON public.provider_applications(status, created_at);
