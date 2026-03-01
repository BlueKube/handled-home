CREATE OR REPLACE FUNCTION public.cleanup_stale_predictions()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM public.property_service_predictions
  WHERE expires_at < now() - interval '30 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN jsonb_build_object('deleted', deleted_count);
END;
$$;