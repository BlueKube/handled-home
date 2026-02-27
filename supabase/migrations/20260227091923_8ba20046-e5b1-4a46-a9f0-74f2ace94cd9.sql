
-- Fix: properties uses zip_code not zip, and has no zone_id column.
-- Use subscriptions.zone_id instead.

-- Fix the density RPCs and index
CREATE OR REPLACE FUNCTION public.refresh_neighborhood_density()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_updated int := 0;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  INSERT INTO public.neighborhood_density (zone_id, zip_code, active_subscriptions, total_properties, updated_at)
  SELECT
    s.zone_id,
    p.zip_code,
    count(*) FILTER (WHERE s.status = 'active'),
    count(*),
    now()
  FROM public.properties p
  JOIN public.subscriptions s ON s.customer_id = p.user_id
  WHERE s.zone_id IS NOT NULL AND p.zip_code IS NOT NULL
  GROUP BY s.zone_id, p.zip_code
  ON CONFLICT (zone_id, zip_code) DO UPDATE SET
    active_subscriptions = EXCLUDED.active_subscriptions,
    total_properties = EXCLUDED.total_properties,
    updated_at = now();

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN jsonb_build_object('updated', v_updated);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_neighborhood_density(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_zip text;
  v_zone_id uuid;
  v_count int;
  v_milestone int;
BEGIN
  SELECT p.zip_code, s.zone_id INTO v_zip, v_zone_id
  FROM public.properties p
  JOIN public.subscriptions s ON s.customer_id = p.user_id AND s.status = 'active'
  WHERE p.user_id = p_user_id
  LIMIT 1;

  IF v_zip IS NULL THEN
    RETURN jsonb_build_object('count', 0, 'zip', null, 'milestone', 0);
  END IF;

  SELECT nd.active_subscriptions, nd.milestone_reached
  INTO v_count, v_milestone
  FROM public.neighborhood_density nd
  WHERE nd.zone_id = v_zone_id AND nd.zip_code = v_zip;

  RETURN jsonb_build_object(
    'count', COALESCE(v_count, 0),
    'zip', v_zip,
    'milestone', COALESCE(v_milestone, 0),
    'zone_id', v_zone_id
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.check_density_milestones()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_nd record;
  v_new_milestone int;
  v_notified int := 0;
  v_customer record;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  FOR v_nd IN
    SELECT * FROM public.neighborhood_density
    WHERE active_subscriptions > 0
  LOOP
    v_new_milestone := CASE
      WHEN v_nd.active_subscriptions >= 100 THEN 100
      WHEN v_nd.active_subscriptions >= 50 THEN 50
      WHEN v_nd.active_subscriptions >= 25 THEN 25
      WHEN v_nd.active_subscriptions >= 10 THEN 10
      WHEN v_nd.active_subscriptions >= 5 THEN 5
      ELSE 0
    END;

    IF v_new_milestone > v_nd.milestone_reached THEN
      UPDATE public.neighborhood_density SET
        milestone_reached = v_new_milestone,
        last_milestone_notified_at = now(),
        updated_at = now()
      WHERE id = v_nd.id;

      FOR v_customer IN
        SELECT p.user_id FROM public.properties p
        JOIN public.subscriptions s ON s.customer_id = p.user_id AND s.status = 'active'
        WHERE p.zip_code = v_nd.zip_code AND s.zone_id = v_nd.zone_id
      LOOP
        PERFORM public.emit_notification(
          v_customer.user_id,
          'neighborhood_milestone',
          format('Your neighborhood hit %s homes! 🎉', v_new_milestone),
          format('%s homes in your area now use Handled Home. Your neighborhood is getting handled!', v_new_milestone),
          jsonb_build_object('milestone', v_new_milestone, 'zip', v_nd.zip_code)
        );
        v_notified := v_notified + 1;
      END LOOP;
    END IF;
  END LOOP;

  RETURN jsonb_build_object('milestones_triggered', v_notified);
END;
$$;

-- Fix index to use correct column
CREATE INDEX IF NOT EXISTS idx_properties_zip_code
  ON public.properties(zip_code) WHERE zip_code IS NOT NULL;
