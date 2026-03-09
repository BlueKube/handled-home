-- Add optional _role parameter to bootstrap_new_user so the signup form
-- can assign 'customer' or 'provider' based on user selection.
-- Defaults to 'customer' for backward compatibility (AuthContext self-heal).

CREATE OR REPLACE FUNCTION public.bootstrap_new_user(
  _full_name text,
  _role text DEFAULT 'customer'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _safe_role public.app_role;
BEGIN
  -- Validate role — only allow customer or provider from client.
  -- Admin role must be assigned by an existing admin via user_roles directly.
  IF _role = 'provider' THEN
    _safe_role := 'provider';
  ELSE
    _safe_role := 'customer';
  END IF;

  INSERT INTO public.profiles (user_id, full_name)
  VALUES (auth.uid(), _full_name)
  ON CONFLICT (user_id) DO NOTHING;

  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid()
  ) THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (auth.uid(), _safe_role);
  END IF;
END;
$$;
