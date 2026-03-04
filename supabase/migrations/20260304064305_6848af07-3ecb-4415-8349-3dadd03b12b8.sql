-- P2: Allow customers to update their own visits (for confirming appointment windows)
CREATE POLICY "Customers can update own visits"
ON public.visits
FOR UPDATE
TO authenticated
USING (user_owns_property(auth.uid(), property_id))
WITH CHECK (user_owns_property(auth.uid(), property_id));