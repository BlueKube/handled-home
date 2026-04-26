-- Previous migration: 20260426010000_bundles_schema.sql
--
-- Round 64 Phase 6 Batch 6.3 review fix (Lane 4 MF-1):
-- public.replace_bundle_items(p_bundle_id, p_items jsonb) — atomic
-- replace-set RPC for the admin SeasonalBundles edit flow. Replaces
-- the three-round-trip (delete → insert → update separate_credits)
-- pattern in useReplaceBundleItems with a single transactional call.
-- Mid-flight failure now leaves the bundle untouched instead of
-- corrupting it (zero items + non-zero separate_credits).
--
-- SECURITY DEFINER + admin-role check inside the function — only the
-- admin role can call it. Bypasses bundle_items RLS via DEFINER while
-- still gating on auth.uid().

CREATE OR REPLACE FUNCTION public.replace_bundle_items(
  p_bundle_id uuid,
  p_items jsonb
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_separate int;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden: replace_bundle_items requires admin role';
  END IF;

  -- All three steps run inside the implicit transaction the function
  -- body opens. Any RAISE / error rolls back the entire change set.
  DELETE FROM public.bundle_items WHERE bundle_id = p_bundle_id;

  IF jsonb_typeof(p_items) = 'array' AND jsonb_array_length(p_items) > 0 THEN
    INSERT INTO public.bundle_items
      (bundle_id, label, est_minutes, credits, sort_order, sku_id)
    SELECT
      p_bundle_id,
      item->>'label',
      (item->>'est_minutes')::int,
      (item->>'credits')::int,
      (item->>'sort_order')::int,
      NULLIF(item->>'sku_id', '')::uuid
    FROM jsonb_array_elements(p_items) AS item;
  END IF;

  SELECT COALESCE(SUM(credits), 0)::int
    INTO v_separate
  FROM public.bundle_items
  WHERE bundle_id = p_bundle_id;

  UPDATE public.bundles
    SET separate_credits = v_separate
  WHERE id = p_bundle_id;

  RETURN jsonb_build_object(
    'bundle_id', p_bundle_id,
    'separate_credits', v_separate,
    'item_count', COALESCE(jsonb_array_length(p_items), 0)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.replace_bundle_items(uuid, jsonb) TO authenticated;

COMMENT ON FUNCTION public.replace_bundle_items(uuid, jsonb) IS
  'Round 64 Phase 6 Batch 6.3 — admin atomic replace-set for bundle_items. Recomputes bundles.separate_credits in the same transaction.';
