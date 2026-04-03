
-- ============================================
-- CONSOLIDATED MIGRATION: Rounds 8-11
-- ============================================

-- ─── 1. delete_user_account RPC ───

CREATE OR REPLACE FUNCTION public.delete_user_account(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF auth.uid() IS NULL OR auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized: can only delete your own account';
  END IF;

  UPDATE public.subscriptions
  SET status = 'canceled', updated_at = now()
  WHERE customer_id = p_user_id AND status IN ('active', 'trialing', 'past_due', 'paused');

  UPDATE public.profiles
  SET full_name = 'Deleted User', phone = NULL, avatar_url = NULL, updated_at = now()
  WHERE user_id = p_user_id;

  UPDATE public.properties
  SET street_address = 'REDACTED', city = 'REDACTED', state = NULL, zip_code = 'REDACTED',
      access_instructions = NULL, gate_code = NULL, parking_instructions = NULL,
      pets = NULL, notes = NULL, lat = NULL, lng = NULL, geohash = NULL, h3_index = NULL, updated_at = now()
  WHERE user_id = p_user_id;

  DELETE FROM public.user_device_tokens WHERE user_id = p_user_id;
  DELETE FROM public.user_notification_preferences WHERE user_id = p_user_id;

  UPDATE public.referrals
  SET referrer_note = NULL, updated_at = now()
  WHERE referrer_user_id = p_user_id OR referred_user_id = p_user_id;

  UPDATE public.support_tickets
  SET metadata = jsonb_set(COALESCE(metadata, '{}'::jsonb), '{account_deleted}', 'true'::jsonb), updated_at = now()
  WHERE customer_id = p_user_id;
END;
$$;

-- ─── 2. provider_leads table ───

CREATE TABLE IF NOT EXISTS public.provider_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  zip_code TEXT NOT NULL,
  categories TEXT[] NOT NULL DEFAULT '{}',
  source TEXT NOT NULL CHECK (source IN ('browse', 'referral', 'manual')),
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'applied', 'declined', 'notified')),
  notes TEXT,
  phone TEXT,
  notified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_provider_leads_zip_code ON public.provider_leads(zip_code);
CREATE INDEX IF NOT EXISTS idx_provider_leads_status ON public.provider_leads(status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_provider_leads_email_unique ON public.provider_leads(email);

CREATE TRIGGER set_provider_leads_updated_at
  BEFORE UPDATE ON public.provider_leads
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.provider_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY anon_provider_leads_insert ON public.provider_leads
  FOR INSERT WITH CHECK (true);

CREATE POLICY admin_provider_leads_all ON public.provider_leads
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.admin_memberships WHERE user_id = auth.uid() AND is_active = true)
  );

-- ─── 3. provider_referrals table ───

CREATE TABLE IF NOT EXISTS public.provider_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_email TEXT NOT NULL,
  referred_name TEXT NOT NULL,
  referred_contact TEXT NOT NULL,
  referred_category TEXT NOT NULL,
  zip_code TEXT NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'applied', 'declined')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_provider_referrals_zip_code ON public.provider_referrals(zip_code);
CREATE INDEX IF NOT EXISTS idx_provider_referrals_status ON public.provider_referrals(status);

ALTER TABLE public.provider_referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY anon_provider_referrals_insert ON public.provider_referrals
  FOR INSERT WITH CHECK (true);

CREATE POLICY admin_provider_referrals_all ON public.provider_referrals
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.admin_memberships WHERE user_id = auth.uid() AND is_active = true)
  );

-- ─── 4. Link applications to leads ───

ALTER TABLE public.provider_applications
  ADD COLUMN IF NOT EXISTS provider_lead_id UUID REFERENCES public.provider_leads(id);

CREATE INDEX IF NOT EXISTS idx_provider_applications_lead_id
  ON public.provider_applications(provider_lead_id);

CREATE OR REPLACE FUNCTION public.link_application_to_lead()
RETURNS TRIGGER AS $$
DECLARE
  v_email TEXT;
  v_phone TEXT;
  v_lead_id UUID;
BEGIN
  SELECT email INTO v_email FROM auth.users WHERE id = NEW.user_id;
  SELECT phone INTO v_phone FROM public.profiles WHERE user_id = NEW.user_id;

  IF v_email IS NULL AND v_phone IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT id INTO v_lead_id
  FROM public.provider_leads
  WHERE (v_email IS NOT NULL AND email = v_email)
     OR (v_phone IS NOT NULL AND v_phone != '' AND phone = v_phone)
  ORDER BY CASE WHEN email = v_email THEN 0 ELSE 1 END
  LIMIT 1;

  IF v_lead_id IS NOT NULL THEN
    UPDATE public.provider_leads SET status = 'applied' WHERE id = v_lead_id;
    NEW.provider_lead_id := v_lead_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_link_application_to_lead ON public.provider_applications;
CREATE TRIGGER trg_link_application_to_lead
  BEFORE INSERT ON public.provider_applications
  FOR EACH ROW EXECUTE FUNCTION public.link_application_to_lead();

-- ─── 5. get_category_gaps RPC ───

CREATE OR REPLACE FUNCTION public.get_category_gaps(p_zip_codes TEXT[])
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT COALESCE(jsonb_agg(row_to_json(gaps)), '[]'::jsonb)
  INTO v_result
  FROM (
    SELECT DISTINCT mzcs.category, mzcs.status::text AS status, z.name AS zone_name
    FROM public.zones z
    JOIN public.market_zone_category_state mzcs ON mzcs.zone_id = z.id
    WHERE z.zip_codes && p_zip_codes
      AND mzcs.status IN ('CLOSED', 'WAITLIST_ONLY', 'PROVIDER_RECRUITING')
    ORDER BY mzcs.category
  ) gaps;
  RETURN v_result;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_category_gaps(TEXT[]) TO authenticated;

-- ─── 6. Auto-notify provider leads on zone launch ───

CREATE OR REPLACE FUNCTION public.auto_notify_zone_leads()
RETURNS TRIGGER AS $$
DECLARE
  v_zone_zips TEXT[];
BEGIN
  IF NEW.status NOT IN ('SOFT_LAUNCH', 'OPEN') THEN RETURN NEW; END IF;
  IF OLD.status = NEW.status THEN RETURN NEW; END IF;

  SELECT zip_codes INTO v_zone_zips FROM public.zones WHERE id = NEW.zone_id;
  IF v_zone_zips IS NULL OR array_length(v_zone_zips, 1) IS NULL THEN RETURN NEW; END IF;

  UPDATE public.provider_leads
  SET status = 'notified', notified_at = now()
  WHERE zip_code = ANY(v_zone_zips) AND status = 'new'
    AND (categories && ARRAY[NEW.category] OR categories = '{}');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_auto_notify_zone_leads ON public.market_zone_category_state;
CREATE TRIGGER trg_auto_notify_zone_leads
  AFTER UPDATE OF status ON public.market_zone_category_state
  FOR EACH ROW EXECUTE FUNCTION public.auto_notify_zone_leads();

-- ─── 7. Referral attribution trigger ───

CREATE OR REPLACE FUNCTION public.attribute_referral_on_application()
RETURNS TRIGGER AS $$
DECLARE
  v_email TEXT;
  v_phone TEXT;
BEGIN
  SELECT email INTO v_email FROM auth.users WHERE id = NEW.user_id;
  SELECT phone INTO v_phone FROM public.profiles WHERE user_id = NEW.user_id;

  IF (v_email IS NULL OR v_email = '') AND (v_phone IS NULL OR v_phone = '') THEN
    RETURN NEW;
  END IF;

  UPDATE public.provider_referrals
  SET status = 'applied'
  WHERE status IN ('new', 'contacted')
    AND ((v_email IS NOT NULL AND v_email != '' AND referred_contact = v_email)
      OR (v_phone IS NOT NULL AND v_phone != '' AND referred_contact = v_phone));

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_attribute_referral ON public.provider_applications;
CREATE TRIGGER trg_attribute_referral
  AFTER INSERT ON public.provider_applications
  FOR EACH ROW EXECUTE FUNCTION public.attribute_referral_on_application();

-- ─── 8. household_members table ───

CREATE TABLE IF NOT EXISTS public.household_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'member')),
  invited_by UUID REFERENCES auth.users(id),
  invite_email TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'active', 'removed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_household_members_user_property
  ON public.household_members (property_id, user_id)
  WHERE user_id IS NOT NULL AND status != 'removed';

CREATE UNIQUE INDEX IF NOT EXISTS idx_household_members_invite_email
  ON public.household_members (property_id, invite_email)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_household_members_user_id ON public.household_members(user_id);
CREATE INDEX IF NOT EXISTS idx_household_members_invite_email_lookup
  ON public.household_members(invite_email) WHERE status = 'pending';

CREATE OR REPLACE FUNCTION public.get_user_household_property_ids(p_user_id UUID)
RETURNS UUID[] AS $$
  SELECT COALESCE(array_agg(property_id), '{}')
  FROM public.household_members
  WHERE user_id = p_user_id AND status = 'active';
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_household_owner(p_user_id UUID, p_property_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.household_members
    WHERE user_id = p_user_id AND property_id = p_property_id AND role = 'owner' AND status = 'active'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

ALTER TABLE public.household_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY household_members_read ON public.household_members
  FOR SELECT USING (property_id = ANY(public.get_user_household_property_ids(auth.uid())));

CREATE POLICY household_members_owner_insert ON public.household_members
  FOR INSERT WITH CHECK (public.is_household_owner(auth.uid(), property_id));

CREATE POLICY household_members_owner_update ON public.household_members
  FOR UPDATE USING (public.is_household_owner(auth.uid(), property_id));

CREATE POLICY admin_household_members_all ON public.household_members
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.admin_memberships WHERE user_id = auth.uid() AND is_active = true)
  );

CREATE OR REPLACE FUNCTION public.auto_insert_household_owner()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.household_members (property_id, user_id, role, status)
  VALUES (NEW.id, NEW.user_id, 'owner', 'active')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_auto_insert_household_owner ON public.properties;
CREATE TRIGGER trg_auto_insert_household_owner
  AFTER INSERT ON public.properties
  FOR EACH ROW EXECUTE FUNCTION public.auto_insert_household_owner();

-- Backfill existing properties
INSERT INTO public.household_members (property_id, user_id, role, status)
SELECT id, user_id, 'owner', 'active'
FROM public.properties
WHERE user_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- ─── 9. accept_household_invites RPC ───

CREATE OR REPLACE FUNCTION public.accept_household_invites()
RETURNS INTEGER AS $$
DECLARE
  v_email TEXT;
  v_count INTEGER;
BEGIN
  SELECT email INTO v_email FROM auth.users WHERE id = auth.uid();
  IF v_email IS NULL THEN RETURN 0; END IF;

  UPDATE public.household_members
  SET user_id = auth.uid(), status = 'active'
  WHERE invite_email = v_email AND status = 'pending' AND user_id IS NULL;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.accept_household_invites() TO authenticated;

-- ─── 10. property_transitions table ───

CREATE TABLE IF NOT EXISTS public.property_transitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  old_owner_user_id UUID NOT NULL REFERENCES auth.users(id),
  new_owner_name TEXT,
  new_owner_email TEXT,
  new_owner_phone TEXT,
  move_date DATE NOT NULL,
  new_address TEXT,
  new_zip TEXT,
  new_zip_covered BOOLEAN,
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'completed', 'cancelled')),
  keep_services_until_move BOOLEAN NOT NULL DEFAULT true,
  notify_on_launch BOOLEAN NOT NULL DEFAULT false,
  handoff_processed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_property_transitions_user ON public.property_transitions(old_owner_user_id);

ALTER TABLE public.property_transitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY property_transitions_own ON public.property_transitions
  FOR ALL USING (old_owner_user_id = auth.uid());

CREATE POLICY admin_property_transitions_all ON public.property_transitions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.admin_memberships WHERE user_id = auth.uid() AND is_active = true)
  );

-- ─── 11. customer_leads table ───

CREATE TABLE IF NOT EXISTS public.customer_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  phone TEXT,
  zip_code TEXT NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('moving', 'waitlist', 'referral')),
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'notified', 'subscribed', 'declined')),
  notify_on_launch BOOLEAN NOT NULL DEFAULT true,
  notified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_customer_leads_email ON public.customer_leads(email);
CREATE INDEX IF NOT EXISTS idx_customer_leads_zip ON public.customer_leads(zip_code);

ALTER TABLE public.customer_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY customer_leads_insert ON public.customer_leads
  FOR INSERT WITH CHECK (true);

CREATE POLICY admin_customer_leads_all ON public.customer_leads
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.admin_memberships WHERE user_id = auth.uid() AND is_active = true)
  );

-- ─── 12. process_move_date_transitions RPC ───

CREATE OR REPLACE FUNCTION public.process_move_date_transitions()
RETURNS INTEGER AS $$
DECLARE
  v_transition RECORD;
  v_count INTEGER := 0;
BEGIN
  FOR v_transition IN
    SELECT pt.id, pt.property_id, pt.old_owner_user_id
    FROM public.property_transitions pt
    WHERE pt.move_date <= CURRENT_DATE AND pt.status = 'planned' AND pt.keep_services_until_move = true
  LOOP
    UPDATE public.subscriptions
    SET cancel_at_period_end = true, status = 'canceling',
        cancel_reason = 'moving', cancel_feedback = 'Auto-cancelled on move date', updated_at = now()
    WHERE property_id = v_transition.property_id AND status IN ('active', 'trialing');

    UPDATE public.property_transitions SET status = 'completed' WHERE id = v_transition.id;
    v_count := v_count + 1;
  END LOOP;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ─── 13. Auto-notify customer leads on zone launch ───

CREATE OR REPLACE FUNCTION public.auto_notify_customer_leads()
RETURNS TRIGGER AS $$
DECLARE
  v_zone_zips TEXT[];
BEGIN
  IF NEW.status NOT IN ('SOFT_LAUNCH', 'OPEN') THEN RETURN NEW; END IF;
  IF OLD.status = NEW.status THEN RETURN NEW; END IF;

  SELECT zip_codes INTO v_zone_zips FROM public.zones WHERE id = NEW.zone_id;
  IF v_zone_zips IS NULL OR array_length(v_zone_zips, 1) IS NULL THEN RETURN NEW; END IF;

  UPDATE public.customer_leads
  SET status = 'notified', notified_at = now()
  WHERE zip_code = ANY(v_zone_zips) AND status = 'new' AND notify_on_launch = true;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_auto_notify_customer_leads ON public.market_zone_category_state;
CREATE TRIGGER trg_auto_notify_customer_leads
  AFTER UPDATE OF status ON public.market_zone_category_state
  FOR EACH ROW EXECUTE FUNCTION public.auto_notify_customer_leads();

-- ─── 14. Fix support_policy_scopes constraints ───

ALTER TABLE public.support_policy_scopes ALTER COLUMN scope_ref_id TYPE text USING scope_ref_id::text;

CREATE UNIQUE INDEX IF NOT EXISTS uq_support_policy_scopes_type_ref
  ON public.support_policy_scopes (scope_type, scope_ref_id);
