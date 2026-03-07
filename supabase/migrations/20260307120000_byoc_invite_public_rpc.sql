-- Public RPC to fetch BYOC invite preview data (no auth required)
-- Returns invite details with provider org name for the public landing page
CREATE OR REPLACE FUNCTION public.get_byoc_invite_public(p_token text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'token', bil.token,
    'category_key', bil.category_key,
    'default_cadence', bil.default_cadence,
    'is_active', bil.is_active,
    'provider_name', po.name,
    'provider_logo_url', po.logo_url,
    'service_name', ss.name,
    'duration_minutes', ss.duration_minutes,
    'level_label', sl.label,
    'zone_name', z.name
  )
  INTO result
  FROM public.byoc_invite_links bil
  LEFT JOIN public.provider_orgs po ON po.id = bil.org_id
  LEFT JOIN public.service_skus ss ON ss.id = bil.sku_id
  LEFT JOIN public.sku_levels sl ON sl.id = bil.default_level_id
  LEFT JOIN public.zones z ON z.id = bil.zone_id
  WHERE bil.token = p_token
    AND bil.is_active = true;

  RETURN result;
END;
$$;

-- Allow anon and authenticated to call this function
GRANT EXECUTE ON FUNCTION public.get_byoc_invite_public(text) TO anon, authenticated;
