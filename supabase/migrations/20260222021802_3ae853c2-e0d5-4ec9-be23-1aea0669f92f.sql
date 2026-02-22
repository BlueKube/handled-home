
-- Add unique constraint on profiles.user_id if not already present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_user_id_key'
  ) THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id);
  END IF;
END $$;

-- Add unique constraint on user_roles(user_id, role)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_roles_user_id_role_key'
  ) THEN
    ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);
  END IF;
END $$;

-- Create bootstrap_new_user RPC (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.bootstrap_new_user(_full_name text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (auth.uid(), _full_name)
  ON CONFLICT (user_id) DO NOTHING;

  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid()
  ) THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (auth.uid(), 'customer');
  END IF;
END;
$$;

-- Remove the old permissive client-side INSERT policy on user_roles
DROP POLICY IF EXISTS "Service role can insert roles" ON public.user_roles;
