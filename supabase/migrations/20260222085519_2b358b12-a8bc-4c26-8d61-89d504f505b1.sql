
-- =============================================================
-- Module 08 Code Review Fixes — Single consolidated migration
-- =============================================================

-- D1: provider_members missing UNIQUE constraint
ALTER TABLE public.provider_members
  ADD CONSTRAINT provider_members_org_user_unique UNIQUE (provider_org_id, user_id);

-- D2/S2: provider_risk_flags dedup constraint
ALTER TABLE public.provider_risk_flags
  ADD CONSTRAINT provider_risk_flags_org_flag_unique UNIQUE (provider_org_id, flag_type);

-- S4: One org per owner
ALTER TABLE public.provider_orgs
  ADD CONSTRAINT provider_orgs_owner_unique UNIQUE (accountable_owner_user_id);

-- D3: CHECK constraint on provider_orgs.status
ALTER TABLE public.provider_orgs
  ADD CONSTRAINT provider_orgs_status_check CHECK (status IN ('DRAFT','PENDING','ACTIVE','PROBATION','SUSPENDED'));

-- D4: CHECK constraint on provider_coverage.request_status
ALTER TABLE public.provider_coverage
  ADD CONSTRAINT provider_coverage_request_status_check CHECK (request_status IN ('REQUESTED','APPROVED','DENIED'));

-- D5: CHECK constraint on provider_coverage.coverage_type
ALTER TABLE public.provider_coverage
  ADD CONSTRAINT provider_coverage_coverage_type_check CHECK (coverage_type IN ('PRIMARY','SECONDARY'));

-- =============================================================
-- R1: Trigger to prevent non-admin updates to protected fields
-- =============================================================
CREATE OR REPLACE FUNCTION public.protect_provider_org_admin_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- If status, needs_review, or accountable_owner changed, verify caller is admin
  IF (OLD.status IS DISTINCT FROM NEW.status)
    OR (OLD.needs_review IS DISTINCT FROM NEW.needs_review)
    OR (OLD.accountable_owner_user_id IS DISTINCT FROM NEW.accountable_owner_user_id)
  THEN
    IF NOT public.has_role(auth.uid(), 'admin') THEN
      -- Allow the submit_provider_onboarding RPC (SECURITY DEFINER) to set PENDING + needs_review
      -- by checking if this is a DRAFT→PENDING transition with needs_review becoming true
      IF OLD.status = 'DRAFT' AND NEW.status = 'PENDING' AND NEW.needs_review = true
        AND OLD.accountable_owner_user_id = NEW.accountable_owner_user_id
      THEN
        -- This is the submit flow — allowed
        RETURN NEW;
      END IF;
      RAISE EXCEPTION 'Only admins can modify status, needs_review, or accountable_owner_user_id';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_protect_provider_org_admin_fields
  BEFORE UPDATE ON public.provider_orgs
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_provider_org_admin_fields();

-- =============================================================
-- S2: Fix submit_provider_onboarding — correct ON CONFLICT target
-- S1: Add comment clarifying audit log actor
-- =============================================================
CREATE OR REPLACE FUNCTION public.submit_provider_onboarding(p_org_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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

  IF v_org.name IS NULL OR v_org.name = '' THEN
    RAISE EXCEPTION 'Organization name is required';
  END IF;

  SELECT * INTO v_compliance FROM provider_compliance WHERE provider_org_id = p_org_id;
  IF NOT FOUND OR v_compliance.terms_accepted_at IS NULL THEN
    RAISE EXCEPTION 'Terms must be accepted before submission';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM provider_coverage WHERE provider_org_id = p_org_id) THEN
    RAISE EXCEPTION 'At least one zone coverage request is required';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM provider_capabilities WHERE provider_org_id = p_org_id AND is_enabled = true) THEN
    RAISE EXCEPTION 'At least one capability must be selected';
  END IF;

  -- Generate risk flags with proper conflict target (D2/S2 fix)
  IF v_compliance.insurance_doc_url IS NULL AND v_compliance.insurance_attested THEN
    INSERT INTO provider_risk_flags (provider_org_id, flag_type, severity)
      VALUES (p_org_id, 'MISSING_INSURANCE_DOC', 'MED')
      ON CONFLICT (provider_org_id, flag_type) DO NOTHING;
  END IF;
  IF v_compliance.tax_doc_url IS NULL AND v_compliance.tax_form_attested THEN
    INSERT INTO provider_risk_flags (provider_org_id, flag_type, severity)
      VALUES (p_org_id, 'MISSING_TAX_DOC', 'LOW')
      ON CONFLICT (provider_org_id, flag_type) DO NOTHING;
  END IF;

  IF v_org.invite_id IS NOT NULL THEN
    UPDATE provider_invites SET uses_count = uses_count + 1 WHERE id = v_org.invite_id;
  END IF;

  UPDATE provider_orgs SET status = 'PENDING', needs_review = true WHERE id = p_org_id;

  -- S1: admin_user_id stores the acting user (may be a provider during self-submission)
  INSERT INTO admin_audit_log (admin_user_id, entity_type, entity_id, action, after)
    VALUES (auth.uid(), 'provider_org', p_org_id, 'submit_onboarding',
      jsonb_build_object('status', 'PENDING'));

  RETURN jsonb_build_object('status', 'PENDING', 'org_id', p_org_id);
END;
$function$;

-- =============================================================
-- S3: Extend admin_provider_action with NOTE + REASSIGN_OWNER
-- =============================================================
CREATE OR REPLACE FUNCTION public.admin_provider_action(p_org_id uuid, p_action text, p_reason text DEFAULT NULL::text, p_metadata jsonb DEFAULT NULL::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_org provider_orgs%ROWTYPE;
  v_new_status text;
  v_new_owner uuid;
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
    WHEN 'NOTE' THEN
      -- No status change, just log the enforcement action
      INSERT INTO provider_enforcement_actions (provider_org_id, action_type, reason, metadata, created_by_admin_user_id)
        VALUES (p_org_id, 'NOTE', p_reason, p_metadata, auth.uid());
      INSERT INTO admin_audit_log (admin_user_id, entity_type, entity_id, action, reason)
        VALUES (auth.uid(), 'provider_org', p_org_id, 'provider_note', p_reason);
      RETURN jsonb_build_object('status', v_org.status, 'org_id', p_org_id, 'action', 'NOTE');
    WHEN 'REASSIGN_OWNER' THEN
      v_new_owner := (p_metadata->>'new_owner_user_id')::uuid;
      IF v_new_owner IS NULL THEN
        RAISE EXCEPTION 'new_owner_user_id required in metadata for REASSIGN_OWNER';
      END IF;
      UPDATE provider_orgs SET accountable_owner_user_id = v_new_owner WHERE id = p_org_id;
      INSERT INTO provider_enforcement_actions (provider_org_id, action_type, reason, metadata, created_by_admin_user_id)
        VALUES (p_org_id, 'REASSIGN_OWNER', p_reason, p_metadata, auth.uid());
      INSERT INTO admin_audit_log (admin_user_id, entity_type, entity_id, action, before, after, reason)
        VALUES (auth.uid(), 'provider_org', p_org_id, 'provider_reassign_owner',
          jsonb_build_object('accountable_owner_user_id', v_org.accountable_owner_user_id),
          jsonb_build_object('accountable_owner_user_id', v_new_owner),
          p_reason);
      RETURN jsonb_build_object('status', v_org.status, 'org_id', p_org_id, 'action', 'REASSIGN_OWNER', 'new_owner', v_new_owner);
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
$function$;

-- =============================================================
-- A1: New RPC for audit-logged coverage status updates
-- =============================================================
CREATE OR REPLACE FUNCTION public.admin_update_coverage_status(p_coverage_id uuid, p_new_status text, p_reason text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_coverage provider_coverage%ROWTYPE;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  SELECT * INTO v_coverage FROM provider_coverage WHERE id = p_coverage_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Coverage record not found';
  END IF;

  UPDATE provider_coverage SET request_status = p_new_status WHERE id = p_coverage_id;

  INSERT INTO provider_enforcement_actions (provider_org_id, action_type, reason, metadata, created_by_admin_user_id)
    VALUES (v_coverage.provider_org_id, 'COVERAGE_' || p_new_status,
      p_reason,
      jsonb_build_object('coverage_id', p_coverage_id, 'zone_id', v_coverage.zone_id, 'old_status', v_coverage.request_status, 'new_status', p_new_status),
      auth.uid());

  INSERT INTO admin_audit_log (admin_user_id, entity_type, entity_id, action, before, after, reason)
    VALUES (auth.uid(), 'provider_coverage', p_coverage_id, 'coverage_status_change',
      jsonb_build_object('request_status', v_coverage.request_status),
      jsonb_build_object('request_status', p_new_status),
      p_reason);

  RETURN jsonb_build_object('status', p_new_status, 'coverage_id', p_coverage_id);
END;
$function$;
