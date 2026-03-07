
REVOKE ALL ON FUNCTION public.propose_provider_action(uuid, text, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.propose_provider_action(uuid, text, jsonb) TO authenticated;
