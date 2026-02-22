
-- =============================================
-- Module 13.1: Referral & Attribution Core
-- =============================================

-- 1. Enums
CREATE TYPE public.referral_program_status AS ENUM ('draft', 'active', 'paused', 'archived');
CREATE TYPE public.referral_milestone_type AS ENUM ('installed', 'subscribed', 'first_visit', 'paid_cycle', 'provider_ready', 'provider_first_job');
CREATE TYPE public.referral_reward_type AS ENUM ('customer_credit', 'provider_bonus');
CREATE TYPE public.referral_reward_status AS ENUM ('pending', 'on_hold', 'earned', 'applied', 'paid', 'voided');
CREATE TYPE public.referral_risk_flag_status AS ENUM ('open', 'reviewed', 'dismissed');

-- 2. Tables

-- 2.1 referral_programs
CREATE TABLE public.referral_programs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  referrer_type text NOT NULL DEFAULT 'customer', -- customer, provider, any
  milestone_triggers referral_milestone_type[] NOT NULL DEFAULT '{}',
  referrer_reward_amount_cents int NOT NULL DEFAULT 0,
  referred_reward_amount_cents int NOT NULL DEFAULT 0,
  referrer_reward_type referral_reward_type NOT NULL DEFAULT 'customer_credit',
  referred_reward_type referral_reward_type NOT NULL DEFAULT 'customer_credit',
  hold_days int NOT NULL DEFAULT 7,
  max_rewards_per_referrer_per_week int,
  max_reward_dollars_per_referrer_per_4weeks int,
  status referral_program_status NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2.2 referral_codes
CREATE TABLE public.referral_codes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  program_id uuid NOT NULL REFERENCES public.referral_programs(id),
  user_id uuid NOT NULL,
  code text NOT NULL,
  uses_count int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT referral_codes_code_unique UNIQUE (code)
);
CREATE INDEX idx_referral_codes_user ON public.referral_codes(user_id);
CREATE INDEX idx_referral_codes_program ON public.referral_codes(program_id);

-- 2.3 referrals (first-touch attribution)
CREATE TABLE public.referrals (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  program_id uuid NOT NULL REFERENCES public.referral_programs(id),
  code_id uuid NOT NULL REFERENCES public.referral_codes(id),
  referrer_user_id uuid NOT NULL,
  referred_user_id uuid NOT NULL,
  attributed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT referrals_first_touch UNIQUE (program_id, referred_user_id)
);
CREATE INDEX idx_referrals_referrer ON public.referrals(referrer_user_id);
CREATE INDEX idx_referrals_referred ON public.referrals(referred_user_id);

-- 2.4 referral_milestones (idempotent)
CREATE TABLE public.referral_milestones (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referral_id uuid NOT NULL REFERENCES public.referrals(id),
  milestone referral_milestone_type NOT NULL,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT referral_milestones_idempotent UNIQUE (referral_id, milestone)
);

-- 2.5 referral_rewards (idempotent lifecycle)
CREATE TABLE public.referral_rewards (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  program_id uuid NOT NULL REFERENCES public.referral_programs(id),
  referral_id uuid NOT NULL REFERENCES public.referrals(id),
  referred_user_id uuid NOT NULL,
  milestone referral_milestone_type NOT NULL,
  reward_type referral_reward_type NOT NULL,
  recipient_user_id uuid NOT NULL,
  amount_cents int NOT NULL DEFAULT 0,
  status referral_reward_status NOT NULL DEFAULT 'pending',
  hold_until timestamptz,
  hold_reason text,
  applied_at timestamptz,
  voided_at timestamptz,
  void_reason text,
  ledger_event_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT referral_rewards_idempotent UNIQUE (program_id, referred_user_id, milestone, reward_type)
);
CREATE INDEX idx_referral_rewards_recipient ON public.referral_rewards(recipient_user_id);
CREATE INDEX idx_referral_rewards_status ON public.referral_rewards(status);

-- 2.6 referral_risk_flags
CREATE TABLE public.referral_risk_flags (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referral_id uuid REFERENCES public.referrals(id),
  reward_id uuid REFERENCES public.referral_rewards(id),
  flag_type text NOT NULL,
  reason text,
  status referral_risk_flag_status NOT NULL DEFAULT 'open',
  reviewed_by_admin_user_id uuid,
  reviewed_at timestamptz,
  review_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_referral_risk_flags_status ON public.referral_risk_flags(status);

-- 2.7 market_cohorts (lightweight, used more in 13.3)
CREATE TABLE public.market_cohorts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  zone_id uuid REFERENCES public.zones(id),
  label text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Enable RLS
ALTER TABLE public.referral_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_risk_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_cohorts ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies

-- referral_programs: everyone can read active, admin full
CREATE POLICY "Anyone can read active programs" ON public.referral_programs FOR SELECT USING (status = 'active');
CREATE POLICY "Admins full access programs" ON public.referral_programs FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- referral_codes: customer reads own, admin full
CREATE POLICY "Users read own codes" ON public.referral_codes FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users insert own codes" ON public.referral_codes FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins full access codes" ON public.referral_codes FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- referrals: customer reads own (as referrer or referred), admin full
CREATE POLICY "Users read own referrals" ON public.referrals FOR SELECT USING (referrer_user_id = auth.uid() OR referred_user_id = auth.uid());
CREATE POLICY "Admins full access referrals" ON public.referrals FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- referral_milestones: read via referral ownership, admin full
CREATE POLICY "Users read own milestones" ON public.referral_milestones FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.referrals r WHERE r.id = referral_id AND (r.referrer_user_id = auth.uid() OR r.referred_user_id = auth.uid())));
CREATE POLICY "Admins full access milestones" ON public.referral_milestones FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- referral_rewards: recipient reads own, provider reads org rewards, admin full
CREATE POLICY "Users read own rewards" ON public.referral_rewards FOR SELECT USING (recipient_user_id = auth.uid());
CREATE POLICY "Admins full access rewards" ON public.referral_rewards FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- referral_risk_flags: admin only
CREATE POLICY "Admins full access risk flags" ON public.referral_risk_flags FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- market_cohorts: everyone reads, admin full
CREATE POLICY "Anyone can read cohorts" ON public.market_cohorts FOR SELECT USING (true);
CREATE POLICY "Admins full access cohorts" ON public.market_cohorts FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- 5. Updated_at triggers
CREATE TRIGGER update_referral_programs_updated_at BEFORE UPDATE ON public.referral_programs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_referral_rewards_updated_at BEFORE UPDATE ON public.referral_rewards FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_referral_risk_flags_updated_at BEFORE UPDATE ON public.referral_risk_flags FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_market_cohorts_updated_at BEFORE UPDATE ON public.market_cohorts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6. SECURITY DEFINER RPCs

-- 6.1 record_referral_milestone: idempotent milestone + reward creation
CREATE OR REPLACE FUNCTION public.record_referral_milestone(p_referral_id uuid, p_milestone referral_milestone_type)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_referral referrals%ROWTYPE;
  v_program referral_programs%ROWTYPE;
  v_milestone_id uuid;
  v_reward_id uuid;
  v_hold_until timestamptz;
BEGIN
  SELECT * INTO v_referral FROM referrals WHERE id = p_referral_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Referral not found'; END IF;

  SELECT * INTO v_program FROM referral_programs WHERE id = v_referral.program_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Program not found'; END IF;

  -- Check milestone is in program triggers
  IF NOT (p_milestone = ANY(v_program.milestone_triggers)) THEN
    RETURN jsonb_build_object('status', 'skipped', 'reason', 'milestone not in program triggers');
  END IF;

  -- Idempotent milestone insert
  INSERT INTO referral_milestones (referral_id, milestone)
  VALUES (p_referral_id, p_milestone)
  ON CONFLICT (referral_id, milestone) DO NOTHING
  RETURNING id INTO v_milestone_id;

  IF v_milestone_id IS NULL THEN
    RETURN jsonb_build_object('status', 'already_exists', 'referral_id', p_referral_id, 'milestone', p_milestone::text);
  END IF;

  -- Compute hold
  v_hold_until := now() + (v_program.hold_days || ' days')::interval;

  -- Create referrer reward (idempotent)
  INSERT INTO referral_rewards (program_id, referral_id, referred_user_id, milestone, reward_type, recipient_user_id, amount_cents, status, hold_until)
  VALUES (v_program.id, p_referral_id, v_referral.referred_user_id, p_milestone, v_program.referrer_reward_type, v_referral.referrer_user_id, v_program.referrer_reward_amount_cents, 'on_hold', v_hold_until)
  ON CONFLICT (program_id, referred_user_id, milestone, reward_type) DO NOTHING
  RETURNING id INTO v_reward_id;

  -- Create referred reward (if amount > 0, different type)
  IF v_program.referred_reward_amount_cents > 0 THEN
    INSERT INTO referral_rewards (program_id, referral_id, referred_user_id, milestone, reward_type, recipient_user_id, amount_cents, status, hold_until)
    VALUES (v_program.id, p_referral_id, v_referral.referred_user_id, p_milestone, v_program.referred_reward_type, v_referral.referred_user_id, v_program.referred_reward_amount_cents, 'on_hold', v_hold_until)
    ON CONFLICT (program_id, referred_user_id, milestone, reward_type) DO NOTHING;
  END IF;

  RETURN jsonb_build_object('status', 'recorded', 'milestone_id', v_milestone_id, 'reward_id', v_reward_id);
END;
$$;

-- 6.2 apply_referral_reward: move to applied/paid, write ledger
CREATE OR REPLACE FUNCTION public.apply_referral_reward(p_reward_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_reward referral_rewards%ROWTYPE;
  v_ledger_id uuid;
  v_new_status referral_reward_status;
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  SELECT * INTO v_reward FROM referral_rewards WHERE id = p_reward_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Reward not found'; END IF;

  IF v_reward.status NOT IN ('earned', 'on_hold') THEN
    RAISE EXCEPTION 'Reward must be in earned or on_hold status to apply (current: %)', v_reward.status;
  END IF;

  IF v_reward.reward_type = 'customer_credit' THEN
    v_new_status := 'applied';
    INSERT INTO customer_ledger_events (customer_id, event_type, amount_cents, balance_after_cents, metadata)
    VALUES (v_reward.recipient_user_id, 'REFERRAL_CREDIT', v_reward.amount_cents, 0,
      jsonb_build_object('reward_id', v_reward.id, 'program_id', v_reward.program_id))
    RETURNING id INTO v_ledger_id;
  ELSIF v_reward.reward_type = 'provider_bonus' THEN
    v_new_status := 'applied';
    -- Find provider_org for this user
    INSERT INTO provider_ledger_events (provider_org_id, event_type, amount_cents, balance_after_cents, metadata)
    SELECT pm.provider_org_id, 'REFERRAL_BONUS', v_reward.amount_cents, 0,
      jsonb_build_object('reward_id', v_reward.id, 'program_id', v_reward.program_id)
    FROM provider_members pm
    WHERE pm.user_id = v_reward.recipient_user_id AND pm.status = 'ACTIVE'
    LIMIT 1
    RETURNING id INTO v_ledger_id;
  END IF;

  UPDATE referral_rewards SET status = v_new_status, applied_at = now(), ledger_event_id = v_ledger_id WHERE id = p_reward_id;

  INSERT INTO admin_audit_log (admin_user_id, entity_type, entity_id, action, after)
  VALUES (auth.uid(), 'referral_reward', p_reward_id, 'apply_reward',
    jsonb_build_object('status', v_new_status, 'amount_cents', v_reward.amount_cents, 'ledger_event_id', v_ledger_id));

  RETURN jsonb_build_object('status', v_new_status, 'reward_id', p_reward_id, 'ledger_event_id', v_ledger_id);
END;
$$;

-- 6.3 void_referral_reward
CREATE OR REPLACE FUNCTION public.void_referral_reward(p_reward_id uuid, p_reason text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_reward referral_rewards%ROWTYPE;
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  SELECT * INTO v_reward FROM referral_rewards WHERE id = p_reward_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Reward not found'; END IF;

  IF v_reward.status IN ('applied', 'paid', 'voided') THEN
    RAISE EXCEPTION 'Cannot void reward in % status', v_reward.status;
  END IF;

  UPDATE referral_rewards SET status = 'voided', voided_at = now(), void_reason = p_reason WHERE id = p_reward_id;

  INSERT INTO admin_audit_log (admin_user_id, entity_type, entity_id, action, before, after, reason)
  VALUES (auth.uid(), 'referral_reward', p_reward_id, 'void_reward',
    jsonb_build_object('status', v_reward.status),
    jsonb_build_object('status', 'voided'),
    p_reason);

  RETURN jsonb_build_object('status', 'voided', 'reward_id', p_reward_id);
END;
$$;

-- 6.4 release_referral_hold
CREATE OR REPLACE FUNCTION public.release_referral_hold(p_reward_id uuid, p_reason text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_reward referral_rewards%ROWTYPE;
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  SELECT * INTO v_reward FROM referral_rewards WHERE id = p_reward_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Reward not found'; END IF;

  IF v_reward.status != 'on_hold' THEN
    RAISE EXCEPTION 'Reward is not on hold (current: %)', v_reward.status;
  END IF;

  UPDATE referral_rewards SET status = 'earned', hold_until = NULL, hold_reason = NULL WHERE id = p_reward_id;

  INSERT INTO admin_audit_log (admin_user_id, entity_type, entity_id, action, before, after, reason)
  VALUES (auth.uid(), 'referral_reward', p_reward_id, 'release_hold',
    jsonb_build_object('status', 'on_hold'),
    jsonb_build_object('status', 'earned'),
    p_reason);

  RETURN jsonb_build_object('status', 'earned', 'reward_id', p_reward_id);
END;
$$;

-- 6.5 override_referral_attribution
CREATE OR REPLACE FUNCTION public.override_referral_attribution(p_referral_id uuid, p_new_referrer_id uuid, p_reason text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_referral referrals%ROWTYPE;
  v_old_referrer uuid;
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  SELECT * INTO v_referral FROM referrals WHERE id = p_referral_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Referral not found'; END IF;

  v_old_referrer := v_referral.referrer_user_id;

  UPDATE referrals SET referrer_user_id = p_new_referrer_id WHERE id = p_referral_id;

  INSERT INTO admin_audit_log (admin_user_id, entity_type, entity_id, action, before, after, reason)
  VALUES (auth.uid(), 'referral', p_referral_id, 'override_attribution',
    jsonb_build_object('referrer_user_id', v_old_referrer),
    jsonb_build_object('referrer_user_id', p_new_referrer_id),
    p_reason);

  RETURN jsonb_build_object('status', 'overridden', 'old_referrer', v_old_referrer, 'new_referrer', p_new_referrer_id);
END;
$$;

-- 7. Grant execute on RPCs
GRANT EXECUTE ON FUNCTION public.record_referral_milestone(uuid, referral_milestone_type) TO authenticated;
GRANT EXECUTE ON FUNCTION public.apply_referral_reward(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.void_referral_reward(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.release_referral_hold(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.override_referral_attribution(uuid, uuid, text) TO authenticated;
