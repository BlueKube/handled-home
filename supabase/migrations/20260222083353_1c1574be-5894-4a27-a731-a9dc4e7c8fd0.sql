
-- =============================================
-- MODULE 08: Provider Onboarding
-- =============================================

-- 1) provider_invites
CREATE TABLE public.provider_invites (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code text NOT NULL UNIQUE,
  allowed_zone_ids uuid[] NOT NULL DEFAULT '{}',
  max_uses integer,
  uses_count integer NOT NULL DEFAULT 0,
  expires_at timestamp with time zone,
  is_active boolean NOT NULL DEFAULT true,
  created_by_admin_user_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.provider_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage invites" ON public.provider_invites
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Providers can read active invites for validation" ON public.provider_invites
  FOR SELECT USING (is_active = true);

CREATE TRIGGER update_provider_invites_updated_at
  BEFORE UPDATE ON public.provider_invites
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) provider_orgs
CREATE TABLE public.provider_orgs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'DRAFT',
  contact_phone text,
  home_base_zip text,
  website text,
  logo_url text,
  invite_id uuid REFERENCES public.provider_invites(id),
  accountable_owner_user_id uuid NOT NULL,
  created_by_user_id uuid NOT NULL,
  needs_review boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.provider_orgs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all provider orgs" ON public.provider_orgs
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Owners can read own org" ON public.provider_orgs
  FOR SELECT USING (auth.uid() = accountable_owner_user_id);

CREATE POLICY "Owners can insert own org" ON public.provider_orgs
  FOR INSERT WITH CHECK (auth.uid() = created_by_user_id AND auth.uid() = accountable_owner_user_id);

CREATE POLICY "Owners can update own org limited" ON public.provider_orgs
  FOR UPDATE USING (auth.uid() = accountable_owner_user_id);

CREATE TRIGGER update_provider_orgs_updated_at
  BEFORE UPDATE ON public.provider_orgs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3) provider_members
CREATE TABLE public.provider_members (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_org_id uuid NOT NULL REFERENCES public.provider_orgs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role_in_org text NOT NULL DEFAULT 'OWNER',
  status text NOT NULL DEFAULT 'ACTIVE',
  display_name text,
  phone text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.provider_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all members" ON public.provider_members
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Members can read own org members" ON public.provider_members
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.provider_orgs po WHERE po.id = provider_org_id AND po.accountable_owner_user_id = auth.uid())
  );

CREATE POLICY "Owners can insert members" ON public.provider_members
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.provider_orgs po WHERE po.id = provider_org_id AND po.accountable_owner_user_id = auth.uid())
  );

CREATE POLICY "Owners can update members" ON public.provider_members
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.provider_orgs po WHERE po.id = provider_org_id AND po.accountable_owner_user_id = auth.uid())
  );

CREATE TRIGGER update_provider_members_updated_at
  BEFORE UPDATE ON public.provider_members
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4) provider_coverage
CREATE TABLE public.provider_coverage (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_org_id uuid NOT NULL REFERENCES public.provider_orgs(id) ON DELETE CASCADE,
  zone_id uuid NOT NULL REFERENCES public.zones(id),
  request_status text NOT NULL DEFAULT 'REQUESTED',
  coverage_type text DEFAULT 'PRIMARY',
  max_travel_miles integer,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.provider_coverage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all coverage" ON public.provider_coverage
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Owners can read own coverage" ON public.provider_coverage
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.provider_orgs po WHERE po.id = provider_org_id AND po.accountable_owner_user_id = auth.uid())
  );

CREATE POLICY "Owners can insert coverage" ON public.provider_coverage
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.provider_orgs po WHERE po.id = provider_org_id AND po.accountable_owner_user_id = auth.uid())
  );

CREATE POLICY "Owners can update coverage" ON public.provider_coverage
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.provider_orgs po WHERE po.id = provider_org_id AND po.accountable_owner_user_id = auth.uid())
  );

CREATE POLICY "Owners can delete coverage" ON public.provider_coverage
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.provider_orgs po WHERE po.id = provider_org_id AND po.accountable_owner_user_id = auth.uid())
  );

CREATE TRIGGER update_provider_coverage_updated_at
  BEFORE UPDATE ON public.provider_coverage
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5) provider_capabilities
CREATE TABLE public.provider_capabilities (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_org_id uuid NOT NULL REFERENCES public.provider_orgs(id) ON DELETE CASCADE,
  capability_type text NOT NULL DEFAULT 'SKU',
  capability_key text NOT NULL,
  sku_id uuid REFERENCES public.service_skus(id),
  is_enabled boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.provider_capabilities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all capabilities" ON public.provider_capabilities
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Owners can read own capabilities" ON public.provider_capabilities
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.provider_orgs po WHERE po.id = provider_org_id AND po.accountable_owner_user_id = auth.uid())
  );

CREATE POLICY "Owners can insert capabilities" ON public.provider_capabilities
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.provider_orgs po WHERE po.id = provider_org_id AND po.accountable_owner_user_id = auth.uid())
  );

CREATE POLICY "Owners can update capabilities" ON public.provider_capabilities
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.provider_orgs po WHERE po.id = provider_org_id AND po.accountable_owner_user_id = auth.uid())
  );

CREATE POLICY "Owners can delete capabilities" ON public.provider_capabilities
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.provider_orgs po WHERE po.id = provider_org_id AND po.accountable_owner_user_id = auth.uid())
  );

CREATE TRIGGER update_provider_capabilities_updated_at
  BEFORE UPDATE ON public.provider_capabilities
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6) provider_compliance
CREATE TABLE public.provider_compliance (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_org_id uuid NOT NULL REFERENCES public.provider_orgs(id) ON DELETE CASCADE UNIQUE,
  terms_accepted_at timestamp with time zone,
  insurance_attested boolean NOT NULL DEFAULT false,
  insurance_doc_url text,
  business_type text DEFAULT 'individual',
  tax_form_attested boolean NOT NULL DEFAULT false,
  tax_doc_url text,
  background_check_consented boolean NOT NULL DEFAULT false,
  other_doc_url text,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.provider_compliance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all compliance" ON public.provider_compliance
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Owners can read own compliance" ON public.provider_compliance
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.provider_orgs po WHERE po.id = provider_org_id AND po.accountable_owner_user_id = auth.uid())
  );

CREATE POLICY "Owners can insert compliance" ON public.provider_compliance
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.provider_orgs po WHERE po.id = provider_org_id AND po.accountable_owner_user_id = auth.uid())
  );

CREATE POLICY "Owners can update compliance" ON public.provider_compliance
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.provider_orgs po WHERE po.id = provider_org_id AND po.accountable_owner_user_id = auth.uid())
  );

CREATE TRIGGER update_provider_compliance_updated_at
  BEFORE UPDATE ON public.provider_compliance
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 7) provider_risk_flags
CREATE TABLE public.provider_risk_flags (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_org_id uuid NOT NULL REFERENCES public.provider_orgs(id) ON DELETE CASCADE,
  flag_type text NOT NULL,
  severity text NOT NULL DEFAULT 'LOW',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.provider_risk_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all risk flags" ON public.provider_risk_flags
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Owners can read own risk flags" ON public.provider_risk_flags
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.provider_orgs po WHERE po.id = provider_org_id AND po.accountable_owner_user_id = auth.uid())
  );

CREATE TRIGGER update_provider_risk_flags_updated_at
  BEFORE UPDATE ON public.provider_risk_flags
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 8) provider_enforcement_actions
CREATE TABLE public.provider_enforcement_actions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_org_id uuid NOT NULL REFERENCES public.provider_orgs(id) ON DELETE CASCADE,
  action_type text NOT NULL,
  reason text,
  metadata jsonb,
  created_by_admin_user_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.provider_enforcement_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage enforcement actions" ON public.provider_enforcement_actions
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Owners can read own enforcement actions" ON public.provider_enforcement_actions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.provider_orgs po WHERE po.id = provider_org_id AND po.accountable_owner_user_id = auth.uid())
  );

-- Storage bucket for provider documents
INSERT INTO storage.buckets (id, name, public) VALUES ('provider-documents', 'provider-documents', false);

CREATE POLICY "Provider owners can upload documents" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'provider-documents' AND auth.uid() IS NOT NULL
  );

CREATE POLICY "Provider owners and admins can read documents" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'provider-documents' AND (
      auth.uid()::text = (storage.foldername(name))[1]
      OR public.has_role(auth.uid(), 'admin')
    )
  );

-- RPC: validate_provider_invite
CREATE OR REPLACE FUNCTION public.validate_provider_invite(p_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_invite provider_invites%ROWTYPE;
BEGIN
  SELECT * INTO v_invite FROM provider_invites
    WHERE code = p_code AND is_active = true;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'Invalid invite code');
  END IF;
  IF v_invite.expires_at IS NOT NULL AND v_invite.expires_at < now() THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'Invite code has expired');
  END IF;
  IF v_invite.max_uses IS NOT NULL AND v_invite.uses_count >= v_invite.max_uses THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'Invite code has reached maximum uses');
  END IF;
  RETURN jsonb_build_object(
    'valid', true,
    'invite_id', v_invite.id,
    'allowed_zone_ids', v_invite.allowed_zone_ids
  );
END;
$$;

-- RPC: submit_provider_onboarding
CREATE OR REPLACE FUNCTION public.submit_provider_onboarding(p_org_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_org provider_orgs%ROWTYPE;
  v_compliance provider_compliance%ROWTYPE;
BEGIN
  SELECT * INTO v_org FROM provider_orgs
    WHERE id = p_org_id AND accountable_owner_user_id = auth.uid() AND status = 'DRAFT'
    FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Provider org not found or not in DRAFT status';
  END IF;

  -- Verify minimum requirements
  IF v_org.name IS NULL OR v_org.name = '' THEN
    RAISE EXCEPTION 'Organization name is required';
  END IF;

  -- Check compliance exists
  SELECT * INTO v_compliance FROM provider_compliance WHERE provider_org_id = p_org_id;
  IF NOT FOUND OR v_compliance.terms_accepted_at IS NULL THEN
    RAISE EXCEPTION 'Terms must be accepted before submission';
  END IF;

  -- Check at least one coverage request
  IF NOT EXISTS (SELECT 1 FROM provider_coverage WHERE provider_org_id = p_org_id) THEN
    RAISE EXCEPTION 'At least one zone coverage request is required';
  END IF;

  -- Check at least one capability
  IF NOT EXISTS (SELECT 1 FROM provider_capabilities WHERE provider_org_id = p_org_id AND is_enabled = true) THEN
    RAISE EXCEPTION 'At least one capability must be selected';
  END IF;

  -- Generate risk flags for missing documents
  IF v_compliance.insurance_doc_url IS NULL AND v_compliance.insurance_attested THEN
    INSERT INTO provider_risk_flags (provider_org_id, flag_type, severity)
      VALUES (p_org_id, 'MISSING_INSURANCE_DOC', 'MED')
      ON CONFLICT DO NOTHING;
  END IF;
  IF v_compliance.tax_doc_url IS NULL AND v_compliance.tax_form_attested THEN
    INSERT INTO provider_risk_flags (provider_org_id, flag_type, severity)
      VALUES (p_org_id, 'MISSING_TAX_DOC', 'LOW')
      ON CONFLICT DO NOTHING;
  END IF;

  -- Increment invite usage
  IF v_org.invite_id IS NOT NULL THEN
    UPDATE provider_invites SET uses_count = uses_count + 1 WHERE id = v_org.invite_id;
  END IF;

  -- Update status
  UPDATE provider_orgs SET status = 'PENDING', needs_review = true WHERE id = p_org_id;

  -- Audit log
  INSERT INTO admin_audit_log (admin_user_id, entity_type, entity_id, action, after)
    VALUES (auth.uid(), 'provider_org', p_org_id, 'submit_onboarding',
      jsonb_build_object('status', 'PENDING'));

  RETURN jsonb_build_object('status', 'PENDING', 'org_id', p_org_id);
END;
$$;

-- RPC: admin_provider_action
CREATE OR REPLACE FUNCTION public.admin_provider_action(
  p_org_id uuid,
  p_action text,
  p_reason text DEFAULT NULL,
  p_metadata jsonb DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_org provider_orgs%ROWTYPE;
  v_new_status text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  SELECT * INTO v_org FROM provider_orgs WHERE id = p_org_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Provider org not found';
  END IF;

  CASE p_action
    WHEN 'APPROVE' THEN v_new_status := 'ACTIVE';
    WHEN 'PROBATION' THEN v_new_status := 'PROBATION';
    WHEN 'SUSPEND' THEN v_new_status := 'SUSPENDED';
    WHEN 'REINSTATE' THEN v_new_status := 'ACTIVE';
    ELSE RAISE EXCEPTION 'Invalid action: %', p_action;
  END CASE;

  UPDATE provider_orgs SET status = v_new_status, needs_review = false WHERE id = p_org_id;

  INSERT INTO provider_enforcement_actions (provider_org_id, action_type, reason, metadata, created_by_admin_user_id)
    VALUES (p_org_id, p_action, p_reason, p_metadata, auth.uid());

  INSERT INTO admin_audit_log (admin_user_id, entity_type, entity_id, action, before, after, reason)
    VALUES (auth.uid(), 'provider_org', p_org_id, 'provider_' || lower(p_action),
      jsonb_build_object('status', v_org.status),
      jsonb_build_object('status', v_new_status),
      p_reason);

  RETURN jsonb_build_object('status', v_new_status, 'org_id', p_org_id);
END;
$$;

-- RPC: check_provider_sku_zone_eligibility
CREATE OR REPLACE FUNCTION public.check_provider_sku_zone_eligibility(
  p_provider_org_id uuid,
  p_sku_id uuid,
  p_zone_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM provider_orgs po
    WHERE po.id = p_provider_org_id
      AND po.status = 'ACTIVE'
      AND EXISTS (
        SELECT 1 FROM provider_coverage pc
        WHERE pc.provider_org_id = po.id
          AND pc.zone_id = p_zone_id
          AND pc.request_status = 'APPROVED'
      )
      AND EXISTS (
        SELECT 1 FROM provider_capabilities cap
        WHERE cap.provider_org_id = po.id
          AND cap.sku_id = p_sku_id
          AND cap.is_enabled = true
      )
  );
END;
$$;
