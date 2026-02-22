
-- R1: Prevent non-admin, non-SECURITY-DEFINER callers from setting job status to COMPLETED
-- SECURITY DEFINER RPCs run as the function owner (postgres), so current_setting('role') = '' or 'postgres'
-- Direct client calls run as 'authenticated'
CREATE OR REPLACE FUNCTION public.protect_job_status_completion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only fire when status is changing TO 'COMPLETED'
  IF NEW.status = 'COMPLETED' AND OLD.status IS DISTINCT FROM 'COMPLETED' THEN
    -- Allow if running inside a SECURITY DEFINER context (RPC) where role is not 'authenticated'
    -- Or if the caller is an admin
    IF current_setting('role', true) = 'authenticated' THEN
      -- Caller is a direct authenticated user, check if admin
      IF NOT public.has_role(auth.uid(), 'admin') THEN
        RAISE EXCEPTION 'Jobs can only be completed through the proper completion flow';
      END IF;
    END IF;
    -- If role is not 'authenticated' (e.g. empty string in SECURITY DEFINER context), allow
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER protect_job_status_completion
  BEFORE UPDATE ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_job_status_completion();
