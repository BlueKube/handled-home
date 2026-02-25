
-- S5-F4, S5-F5: Add admin check + decision validation to review_expansion_suggestion
CREATE OR REPLACE FUNCTION public.review_expansion_suggestion(
  p_suggestion_id uuid,
  p_decision text,
  p_note text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- S5-F4: Admin authorization check
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin role required';
  END IF;

  -- S5-F5: Validate decision parameter
  IF p_decision NOT IN ('approved', 'rejected') THEN
    RAISE EXCEPTION 'Decision must be approved or rejected';
  END IF;

  UPDATE expansion_suggestions
  SET status = p_decision,
      reviewed_by_admin_user_id = auth.uid(),
      reviewed_at = now(),
      review_note = p_note,
      updated_at = now()
  WHERE id = p_suggestion_id AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Suggestion not found or not pending';
  END IF;
END;
$$;

-- S5-F6: Add admin check to notify_waitlist_on_launch
CREATE OR REPLACE FUNCTION public.notify_waitlist_on_launch(p_zone_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_zone record;
  v_count int := 0;
  v_entry record;
BEGIN
  -- S5-F6: Admin authorization check
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin role required';
  END IF;

  SELECT * INTO v_zone FROM zones WHERE id = p_zone_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('status', 'error', 'reason', 'zone_not_found');
  END IF;

  -- NOTE: This marks entries as 'notified' but does NOT send email.
  -- Actual email delivery requires external integration (e.g., SendGrid edge function).
  -- The notified_at timestamp serves as a record for when the admin triggered notification.
  FOR v_entry IN
    SELECT * FROM waitlist_entries
    WHERE zone_id = p_zone_id AND status = 'waiting'
  LOOP
    UPDATE waitlist_entries
    SET status = 'notified', notified_at = now(), updated_at = now()
    WHERE id = v_entry.id;
    
    v_count := v_count + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'status', 'ok',
    'notified_count', v_count,
    'zone_name', v_zone.name,
    'email_delivery', 'pending_external_integration'
  );
END;
$$;

-- S5-F9 (from plan): Add admin check to get_waitlist_summary (convert from SQL to PL/pgSQL)
CREATE OR REPLACE FUNCTION public.get_waitlist_summary()
RETURNS TABLE(
  zip_code text,
  zone_id uuid,
  zone_name text,
  entry_count bigint,
  earliest_entry timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Admin authorization check
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin role required';
  END IF;

  RETURN QUERY
  SELECT 
    w.zip_code,
    w.zone_id,
    z.name as zone_name,
    count(*) as entry_count,
    min(w.created_at) as earliest_entry
  FROM waitlist_entries w
  LEFT JOIN zones z ON z.id = w.zone_id
  WHERE w.status = 'waiting'
  GROUP BY w.zip_code, w.zone_id, z.name
  ORDER BY entry_count DESC;
END;
$$;

-- S5-F1: Remove public INSERT policy — waitlist signups now go through edge function
DROP POLICY IF EXISTS "Anyone can join waitlist" ON waitlist_entries;
