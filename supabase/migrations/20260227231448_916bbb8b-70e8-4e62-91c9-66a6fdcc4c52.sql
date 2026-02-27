
-- ==========================================
-- Sprint 2G-A1: Admin memberships + sub-roles
-- ==========================================

-- 1. Create admin_role enum
CREATE TYPE public.admin_role AS ENUM ('superuser', 'ops', 'dispatcher', 'growth_manager');

-- 2. Create admin_memberships table
CREATE TABLE public.admin_memberships (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  admin_role public.admin_role NOT NULL DEFAULT 'dispatcher',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Updated_at trigger
CREATE TRIGGER trg_admin_memberships_set_updated_at
  BEFORE UPDATE ON public.admin_memberships
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- 4. Enable RLS
ALTER TABLE public.admin_memberships ENABLE ROW LEVEL SECURITY;

-- 5. Helper functions (SECURITY DEFINER to avoid recursion)

-- is_admin: checks if user has an active admin membership
CREATE OR REPLACE FUNCTION public.is_admin_member(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_memberships
    WHERE user_id = p_user_id
      AND is_active = true
  );
$$;

-- admin_role: returns the admin sub-role for a user
CREATE OR REPLACE FUNCTION public.get_admin_role(p_user_id uuid)
RETURNS public.admin_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT admin_role FROM public.admin_memberships
  WHERE user_id = p_user_id
    AND is_active = true
  LIMIT 1;
$$;

-- has_admin_role: checks if user has a specific admin sub-role
CREATE OR REPLACE FUNCTION public.has_admin_role(p_user_id uuid, p_role public.admin_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_memberships
    WHERE user_id = p_user_id
      AND admin_role = p_role
      AND is_active = true
  );
$$;

-- is_superuser shorthand
CREATE OR REPLACE FUNCTION public.is_superuser(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT public.has_admin_role(p_user_id, 'superuser');
$$;

-- 6. RLS policies
-- All active admin members can read all memberships
CREATE POLICY "admin_memberships_select"
  ON public.admin_memberships
  FOR SELECT
  TO authenticated
  USING (public.is_admin_member(auth.uid()));

-- Only superusers can insert/update/delete memberships
CREATE POLICY "admin_memberships_manage_superuser"
  ON public.admin_memberships
  FOR ALL
  TO authenticated
  USING (public.is_superuser(auth.uid()))
  WITH CHECK (public.is_superuser(auth.uid()));

-- 7. Index for quick lookups
CREATE INDEX idx_admin_memberships_active ON public.admin_memberships (is_active) WHERE is_active = true;

-- 8. Comments
COMMENT ON TABLE public.admin_memberships IS 'Admin sub-role assignments. All admin users have role=admin in user_roles; this table subdivides permissions within admin.';
COMMENT ON COLUMN public.admin_memberships.admin_role IS 'Sub-role: superuser (full control), ops (zone/SKU/provider management), dispatcher (day-of execution), growth_manager (zone launch/incentives)';
