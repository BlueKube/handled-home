
-- D8-F1: Fix submit_private_review to use randomized 7-21 day release delay
CREATE OR REPLACE FUNCTION public.submit_private_review(
  p_job_id uuid,
  p_rating int,
  p_tags jsonb DEFAULT '[]'::jsonb,
  p_comment_public_candidate text DEFAULT NULL,
  p_comment_private text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_customer_id uuid := auth.uid();
  v_job record;
  v_review_id uuid;
  v_delay_days int;
BEGIN
  -- Verify job belongs to caller and is completed
  SELECT id, provider_org_id, zone_id, completed_at INTO v_job
  FROM jobs
  WHERE id = p_job_id AND customer_id = v_customer_id AND status = 'COMPLETED';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Job not found or not completed';
  END IF;

  -- D8-F1: Randomized 7-21 day delay for anonymity protection
  v_delay_days := 7 + floor(random() * 15)::int;  -- 7 to 21 inclusive

  INSERT INTO visit_ratings_private (
    job_id, customer_id, provider_org_id, zone_id,
    rating, tags, comment_public_candidate, comment_private,
    scheduled_release_at, submitted_at
  )
  VALUES (
    p_job_id, v_customer_id, v_job.provider_org_id, v_job.zone_id,
    p_rating, p_tags, p_comment_public_candidate, p_comment_private,
    now() + (v_delay_days || ' days')::interval, now()
  )
  ON CONFLICT (job_id, customer_id) DO UPDATE
    SET rating = EXCLUDED.rating,
        tags = EXCLUDED.tags,
        comment_public_candidate = EXCLUDED.comment_public_candidate,
        comment_private = EXCLUDED.comment_private,
        submitted_at = now()
  RETURNING id INTO v_review_id;

  RETURN jsonb_build_object('id', v_review_id);
END;
$$;

-- D8-F3: Add foreign key constraints on customer_id for cascade delete
ALTER TABLE visit_feedback_quick
  ADD CONSTRAINT visit_feedback_quick_customer_id_fkey
  FOREIGN KEY (customer_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE visit_ratings_private
  ADD CONSTRAINT visit_ratings_private_customer_id_fkey
  FOREIGN KEY (customer_id) REFERENCES auth.users(id) ON DELETE CASCADE;
