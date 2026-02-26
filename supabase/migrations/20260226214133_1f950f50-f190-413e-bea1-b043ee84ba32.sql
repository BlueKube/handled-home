
-- Sprint C4: Wire notification events into RPCs

-- 1. confirm_service_day → CUSTOMER_SERVICE_CONFIRMED
CREATE OR REPLACE FUNCTION public.confirm_service_day(p_assignment_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_assignment service_day_assignments%ROWTYPE;
BEGIN
  SELECT * INTO v_assignment FROM service_day_assignments
    WHERE id = p_assignment_id AND customer_id = auth.uid() AND status = 'offered'
    FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Assignment not found or not in offered status';
  END IF;

  UPDATE service_day_assignments SET status = 'confirmed', reserved_until = NULL WHERE id = p_assignment_id;
  UPDATE service_day_offers SET accepted = true
    WHERE assignment_id = p_assignment_id AND offered_day_of_week = v_assignment.day_of_week AND offered_window = v_assignment.service_window;

  -- C4: Emit service day confirmed notification
  PERFORM emit_notification_event(
    p_event_type := 'CUSTOMER_SERVICE_CONFIRMED',
    p_idempotency_key := 'svc_confirmed:' || p_assignment_id::text,
    p_audience_type := 'CUSTOMER',
    p_audience_user_id := v_assignment.customer_id,
    p_priority := 'NORMAL',
    p_payload := jsonb_build_object(
      'day_of_week', v_assignment.day_of_week,
      'service_window', v_assignment.service_window
    )
  );

  RETURN jsonb_build_object('status', 'confirmed', 'assignment_id', p_assignment_id);
END;
$$;

-- 2. start_job → CUSTOMER_JOB_STARTED
CREATE OR REPLACE FUNCTION public.start_job(p_job_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_job jobs%ROWTYPE;
  v_property properties%ROWTYPE;
BEGIN
  SELECT * INTO v_job FROM jobs WHERE id = p_job_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Job not found';
  END IF;

  IF NOT is_provider_org_member(v_job.provider_org_id) THEN
    RAISE EXCEPTION 'Not a member of the assigned provider org';
  END IF;

  IF v_job.status != 'NOT_STARTED' THEN
    RAISE EXCEPTION 'Job is not in NOT_STARTED status (current: %)', v_job.status;
  END IF;

  UPDATE jobs SET status = 'IN_PROGRESS', started_at = now() WHERE id = p_job_id;

  INSERT INTO job_events (job_id, actor_user_id, actor_role, event_type, metadata)
    VALUES (p_job_id, auth.uid(), 'provider', 'JOB_STARTED', jsonb_build_object('started_at', now()));

  -- C4: Emit job started notification to customer
  SELECT * INTO v_property FROM properties WHERE id = v_job.property_id;
  PERFORM emit_notification_event(
    p_event_type := 'CUSTOMER_JOB_STARTED',
    p_idempotency_key := 'job_started:' || p_job_id::text,
    p_audience_type := 'CUSTOMER',
    p_audience_user_id := v_job.customer_id,
    p_priority := 'NORMAL',
    p_payload := jsonb_build_object(
      'job_id', p_job_id,
      'address', COALESCE(v_property.street_address, 'your property')
    )
  );

  RETURN jsonb_build_object('status', 'IN_PROGRESS', 'job_id', p_job_id, 'started_at', now());
END;
$$;

-- 3. complete_job → CUSTOMER_RECEIPT_READY
CREATE OR REPLACE FUNCTION public.complete_job(p_job_id uuid, p_provider_summary text DEFAULT NULL::text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_job jobs%ROWTYPE;
  v_missing_checklist int;
  v_missing_photos int;
  v_open_issues int;
  v_missing_details jsonb := '[]'::jsonb;
  v_earning_result jsonb;
  v_referral_id uuid;
  v_completed_count int;
BEGIN
  SELECT * INTO v_job FROM jobs WHERE id = p_job_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Job not found';
  END IF;

  IF NOT is_provider_org_member(v_job.provider_org_id) THEN
    RAISE EXCEPTION 'Not a member of the assigned provider org';
  END IF;

  IF v_job.status NOT IN ('IN_PROGRESS', 'ISSUE_REPORTED', 'PARTIAL_COMPLETE') THEN
    RAISE EXCEPTION 'Job cannot be completed from status %', v_job.status;
  END IF;

  SELECT count(*) INTO v_missing_checklist
    FROM job_checklist_items WHERE job_id = p_job_id AND is_required = true AND status = 'PENDING';
  SELECT count(*) INTO v_missing_photos
    FROM job_photos WHERE job_id = p_job_id AND slot_key IS NOT NULL AND upload_status != 'UPLOADED';
  SELECT count(*) INTO v_open_issues
    FROM job_issues WHERE job_id = p_job_id AND status = 'OPEN';

  IF v_missing_checklist > 0 THEN
    v_missing_details := v_missing_details || jsonb_build_object('type', 'checklist', 'count', v_missing_checklist);
  END IF;
  IF v_missing_photos > 0 THEN
    v_missing_details := v_missing_details || jsonb_build_object('type', 'photos', 'count', v_missing_photos);
  END IF;

  IF v_missing_checklist > 0 OR v_missing_photos > 0 THEN
    RETURN jsonb_build_object('status', 'INCOMPLETE', 'job_id', p_job_id, 'missing', v_missing_details);
  END IF;

  IF v_open_issues > 0 THEN
    UPDATE jobs SET status = 'PARTIAL_COMPLETE', provider_summary = p_provider_summary WHERE id = p_job_id;
    INSERT INTO job_events (job_id, actor_user_id, actor_role, event_type, metadata)
      VALUES (p_job_id, auth.uid(), 'provider', 'JOB_PARTIAL_COMPLETE',
        jsonb_build_object('open_issues', v_open_issues, 'provider_summary', p_provider_summary));
    RETURN jsonb_build_object('status', 'PARTIAL_COMPLETE', 'job_id', p_job_id, 'open_issues', v_open_issues);
  END IF;

  UPDATE jobs SET status = 'COMPLETED', completed_at = now(), provider_summary = p_provider_summary WHERE id = p_job_id;
  INSERT INTO job_events (job_id, actor_user_id, actor_role, event_type, metadata)
    VALUES (p_job_id, auth.uid(), 'provider', 'JOB_COMPLETED',
      jsonb_build_object('completed_at', now(), 'provider_summary', p_provider_summary));

  -- Create provider earning
  BEGIN
    SELECT create_provider_earning(p_job_id) INTO v_earning_result;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Failed to create earning for job %: %', p_job_id, SQLERRM;
  END;

  -- S1: Fire first_visit milestone if this is customer's first completed job
  BEGIN
    SELECT count(*) INTO v_completed_count
    FROM jobs WHERE customer_id = v_job.customer_id AND status = 'COMPLETED';

    IF v_completed_count = 1 THEN
      SELECT r.id INTO v_referral_id
      FROM referrals r
      WHERE r.referred_user_id = v_job.customer_id AND r.status = 'active'
      LIMIT 1;

      IF v_referral_id IS NOT NULL THEN
        PERFORM record_referral_milestone(v_referral_id, 'first_visit'::referral_milestone_type);
      END IF;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Referral milestone (first_visit) failed for job %: %', p_job_id, SQLERRM;
  END;

  -- C4: Emit receipt ready notification to customer
  PERFORM emit_notification_event(
    p_event_type := 'CUSTOMER_RECEIPT_READY',
    p_idempotency_key := 'receipt_ready:' || p_job_id::text,
    p_audience_type := 'CUSTOMER',
    p_audience_user_id := v_job.customer_id,
    p_priority := 'NORMAL',
    p_payload := jsonb_build_object(
      'job_id', p_job_id,
      'completed_at', now()
    )
  );

  RETURN jsonb_build_object('status', 'COMPLETED', 'job_id', p_job_id, 'completed_at', now(), 'earning', v_earning_result);
END;
$function$;

-- 4. admin_resolve_customer_issue → CUSTOMER_ISSUE_STATUS_CHANGED
CREATE OR REPLACE FUNCTION public.admin_resolve_customer_issue(
  p_issue_id uuid,
  p_resolution_note text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_issue customer_issues%ROWTYPE;
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  SELECT * INTO v_issue FROM customer_issues WHERE id = p_issue_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Issue not found';
  END IF;

  IF v_issue.status = 'resolved' THEN
    RAISE EXCEPTION 'Issue already resolved';
  END IF;

  UPDATE customer_issues
    SET status = 'resolved',
        resolution_note = p_resolution_note,
        resolved_at = now(),
        resolved_by_admin_user_id = auth.uid()
    WHERE id = p_issue_id;

  INSERT INTO admin_audit_log (admin_user_id, entity_type, entity_id, action, before, after, reason)
    VALUES (auth.uid(), 'customer_issue', p_issue_id, 'resolve_customer_issue',
      jsonb_build_object('status', v_issue.status),
      jsonb_build_object('status', 'resolved', 'resolution_note', p_resolution_note),
      p_resolution_note);

  -- C4: Emit issue status changed notification to customer
  PERFORM emit_notification_event(
    p_event_type := 'CUSTOMER_ISSUE_STATUS_CHANGED',
    p_idempotency_key := 'issue_resolved:' || p_issue_id::text,
    p_audience_type := 'CUSTOMER',
    p_audience_user_id := v_issue.customer_id,
    p_priority := 'NORMAL',
    p_payload := jsonb_build_object(
      'issue_id', p_issue_id,
      'job_id', v_issue.job_id,
      'new_status', 'resolved',
      'resolution_note', p_resolution_note
    )
  );

  RETURN jsonb_build_object('status', 'resolved', 'issue_id', p_issue_id);
END;
$$;
