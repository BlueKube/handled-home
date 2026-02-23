
-- S1: Add first_visit milestone trigger to complete_job
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

  RETURN jsonb_build_object('status', 'COMPLETED', 'job_id', p_job_id, 'completed_at', now(), 'earning', v_earning_result);
END;
$function$;
