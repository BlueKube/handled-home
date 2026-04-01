-- ============================================
-- Round 10, Phase 2, B3: Household Members
-- ============================================
-- Links multiple auth users to one property.
-- Enables shared access for spouses/household members.
-- ============================================

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

-- One active membership per user per property
CREATE UNIQUE INDEX IF NOT EXISTS idx_household_members_user_property
  ON public.household_members (property_id, user_id)
  WHERE user_id IS NOT NULL AND status != 'removed';

-- One pending invite per email per property
CREATE UNIQUE INDEX IF NOT EXISTS idx_household_members_invite_email
  ON public.household_members (property_id, invite_email)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_household_members_user_id
  ON public.household_members (user_id);

CREATE INDEX IF NOT EXISTS idx_household_members_invite_email_lookup
  ON public.household_members (invite_email)
  WHERE status = 'pending';

COMMENT ON TABLE public.household_members IS 'Links multiple auth users to one property. Owner manages billing, members can view services and schedule.';

-- RLS
ALTER TABLE public.household_members ENABLE ROW LEVEL SECURITY;

-- Users can read memberships for properties they belong to
CREATE POLICY household_members_read ON public.household_members
  FOR SELECT USING (
    property_id IN (
      SELECT property_id FROM public.household_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- Property owners can insert new members (invites)
CREATE POLICY household_members_owner_insert ON public.household_members
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.household_members
      WHERE property_id = household_members.property_id
        AND user_id = auth.uid()
        AND role = 'owner'
        AND status = 'active'
    )
  );

-- Property owners can update members (accept, remove)
CREATE POLICY household_members_owner_update ON public.household_members
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.household_members hm
      WHERE hm.property_id = household_members.property_id
        AND hm.user_id = auth.uid()
        AND hm.role = 'owner'
        AND hm.status = 'active'
    )
  );

-- Admin full access
CREATE POLICY admin_household_members_all ON public.household_members
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.admin_members WHERE user_id = auth.uid())
  );

-- ─── Auto-insert owner on property creation ───

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
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_insert_household_owner();

-- Backfill: create owner rows for existing properties
INSERT INTO public.household_members (property_id, user_id, role, status)
SELECT id, user_id, 'owner', 'active'
FROM public.properties
WHERE user_id IS NOT NULL
ON CONFLICT DO NOTHING;
