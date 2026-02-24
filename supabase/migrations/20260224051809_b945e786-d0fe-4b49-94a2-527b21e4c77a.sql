-- Add SELECT RLS policies for referral tables so non-admin users can query them

-- referral_programs: all authenticated users can read active programs
CREATE POLICY "Authenticated users can read active referral programs"
ON public.referral_programs
FOR SELECT
TO authenticated
USING (status = 'active');

-- referral_codes: users can read their own codes
CREATE POLICY "Users can read their own referral codes"
ON public.referral_codes
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- referral_milestones: users can read milestones for referrals they're part of
CREATE POLICY "Users can read milestones for their referrals"
ON public.referral_milestones
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.referrals r
    WHERE r.id = referral_milestones.referral_id
      AND (r.referrer_user_id = auth.uid() OR r.referred_user_id = auth.uid())
  )
);