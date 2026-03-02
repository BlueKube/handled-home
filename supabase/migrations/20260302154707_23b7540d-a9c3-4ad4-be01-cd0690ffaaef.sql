-- review_provider_application RPC
-- Admin-only: sets application status, logs decision, emits notification, creates org on approval
CREATE OR REPLACE FUNCTION public.review_provider_application(
  p_application_id uuid,
  p_decision text,
  p_reason text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_app record;
  v_admin_role text;
  v_org_id uuid;
BEGIN
  -- 1. Verify admin
  SELECT admin_role INTO v_admin_role
  FROM public.admin_memberships
  WHERE user_id = auth.uid() AND is_active = true;

  IF v_admin_role IS NULL THEN
    RAISE EXCEPTION 'Not authorized: admin role required';
  END IF;

  -- 2. Validate decision
  IF p_decision NOT IN ('approved', 'approved_conditional', 'rejected', 'waitlisted', 'under_review') THEN
    RAISE EXCEPTION 'Invalid decision: %', p_decision;
  END IF;

  -- 3. Fetch application
  SELECT * INTO v_app FROM public.provider_applications WHERE id = p_application_id;
  IF v_app IS NULL THEN
    RAISE EXCEPTION 'Application not found';
  END IF;

  -- 4. Validate transition (only submitted/under_review can be decided)
  IF v_app.status NOT IN ('submitted', 'under_review', 'approved_conditional') THEN
    RAISE EXCEPTION 'Cannot review application in status: %', v_app.status;
  END IF;

  -- 5. Update application
  UPDATE public.provider_applications
  SET status = p_decision::provider_application_status,
      decision_reason = COALESCE(p_reason, decision_reason),
      reviewed_at = now(),
      updated_at = now()
  WHERE id = p_application_id;

  -- 6. On approval, create provider_org if not exists
  IF p_decision IN ('approved', 'approved_conditional') AND v_app.provider_org_id IS NULL THEN
    INSERT INTO public.provider_orgs (name, status, needs_review)
    VALUES (
      COALESCE((v_app.metadata->>'business_name')::text, 'New Provider'),
      'PENDING',
      true
    )
    RETURNING id INTO v_org_id;

    -- Link org to application
    UPDATE public.provider_applications
    SET provider_org_id = v_org_id, updated_at = now()
    WHERE id = p_application_id;

    -- Add applicant as org member
    INSERT INTO public.provider_members (provider_org_id, user_id, role, status)
    VALUES (v_org_id, v_app.user_id, 'owner', 'active')
    ON CONFLICT DO NOTHING;
  ELSE
    v_org_id := v_app.provider_org_id;
  END IF;

  -- 7. Emit notification to applicant
  PERFORM public.emit_notification_event(
    p_event_type := CASE
      WHEN p_decision = 'approved' THEN 'PROVIDER_APPLICATION_APPROVED'
      WHEN p_decision = 'approved_conditional' THEN 'PROVIDER_APPLICATION_APPROVED_CONDITIONAL'
      WHEN p_decision = 'rejected' THEN 'PROVIDER_APPLICATION_REJECTED'
      WHEN p_decision = 'waitlisted' THEN 'PROVIDER_APPLICATION_WAITLISTED'
      ELSE 'PROVIDER_APPLICATION_STATUS_CHANGED'
    END,
    p_audience_type := 'USER',
    p_audience_user_id := v_app.user_id,
    p_priority := 'critical',
    p_title := CASE
      WHEN p_decision = 'approved' THEN 'Application Approved!'
      WHEN p_decision = 'approved_conditional' THEN 'Application Conditionally Approved'
      WHEN p_decision = 'rejected' THEN 'Application Update'
      WHEN p_decision = 'waitlisted' THEN 'Application Update'
      ELSE 'Application Status Changed'
    END,
    p_body := COALESCE(p_reason, 'Your provider application status has been updated.'),
    p_data := jsonb_build_object(
      'application_id', p_application_id,
      'decision', p_decision,
      'org_id', v_org_id
    ),
    p_idempotency_key := 'app_review_' || p_application_id || '_' || p_decision
  );

  -- 8. Audit log
  INSERT INTO public.admin_audit_log (admin_user_id, action, entity_type, entity_id, reason, actor_admin_role, after)
  VALUES (
    auth.uid(),
    'review_application',
    'provider_applications',
    p_application_id::text,
    p_reason,
    v_admin_role,
    jsonb_build_object('decision', p_decision, 'org_id', v_org_id)
  );

  RETURN jsonb_build_object(
    'success', true,
    'application_id', p_application_id,
    'decision', p_decision,
    'org_id', v_org_id
  );
END;
$$;