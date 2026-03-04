
-- Allow all authenticated users to read assignment_config (tuning dials are not secrets)
CREATE POLICY "Authenticated users can read assignment config"
ON public.assignment_config
FOR SELECT
TO authenticated
USING (true);
