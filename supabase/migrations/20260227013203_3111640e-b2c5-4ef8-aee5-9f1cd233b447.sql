
-- ============================================================
-- Sprint D0: Handles v0 Schema
-- Tables: plan_handles, handle_transactions
-- Cache column: subscriptions.handles_balance
-- RPCs: recalc_handles_balance, get_handle_balance, spend_handles,
--        grant_cycle_handles, expire_stale_handles, refund_handles
-- ============================================================

-- 1) plan_handles — per-plan handle configuration
CREATE TABLE public.plan_handles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id UUID NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
  handles_per_cycle INTEGER NOT NULL DEFAULT 0,
  rollover_cap INTEGER NOT NULL DEFAULT 0,
  rollover_expiry_days INTEGER NOT NULL DEFAULT 60,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(plan_id)
);

ALTER TABLE public.plan_handles ENABLE ROW LEVEL SECURITY;

-- Public read (plan cards need this)
CREATE POLICY "plan_handles_select_all" ON public.plan_handles
  FOR SELECT USING (true);

-- Admin write
CREATE POLICY "plan_handles_admin_write" ON public.plan_handles
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- 2) handle_transactions — append-only ledger (source of truth)
CREATE TABLE public.handle_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subscription_id UUID NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL,
  txn_type TEXT NOT NULL, -- grant, spend, expire, rollover, refund
  amount INTEGER NOT NULL, -- positive = credit, negative = debit
  balance_after INTEGER NOT NULL DEFAULT 0,
  reference_type TEXT, -- 'job', 'cycle_grant', 'expiry_run', 'rollover', 'cancellation_refund'
  reference_id UUID, -- job_id, billing_cycle id, etc.
  expires_at TIMESTAMPTZ, -- when these handles expire (for grant/refund rows)
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.handle_transactions ENABLE ROW LEVEL SECURITY;

-- Customers see own transactions
CREATE POLICY "handle_txn_customer_select" ON public.handle_transactions
  FOR SELECT USING (customer_id = auth.uid());

-- Admin sees all
CREATE POLICY "handle_txn_admin_select" ON public.handle_transactions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Only RPCs insert (SECURITY DEFINER functions)
-- No direct INSERT/UPDATE/DELETE policies for regular users

-- Indexes for common queries
CREATE INDEX idx_handle_txn_sub_id ON public.handle_transactions(subscription_id, created_at DESC);
CREATE INDEX idx_handle_txn_customer ON public.handle_transactions(customer_id, created_at DESC);
CREATE INDEX idx_handle_txn_expires ON public.handle_transactions(expires_at) WHERE expires_at IS NOT NULL AND txn_type IN ('grant', 'refund');

-- 3) Add handles_balance cache to subscriptions
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS handles_balance INTEGER NOT NULL DEFAULT 0;

-- 4) Add handle_cost to service_skus
ALTER TABLE public.service_skus ADD COLUMN IF NOT EXISTS handle_cost INTEGER NOT NULL DEFAULT 1;

-- ============================================================
-- RPCs
-- ============================================================

-- 4a) recalc_handles_balance — recompute cache from ledger
CREATE OR REPLACE FUNCTION public.recalc_handles_balance(p_subscription_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_balance INTEGER;
BEGIN
  SELECT COALESCE(SUM(amount), 0) INTO v_balance
  FROM handle_transactions
  WHERE subscription_id = p_subscription_id;

  UPDATE subscriptions
  SET handles_balance = GREATEST(0, v_balance), updated_at = now()
  WHERE id = p_subscription_id;

  RETURN GREATEST(0, v_balance);
END;
$$;

-- 4b) get_handle_balance — read balance (from cache, fast)
CREATE OR REPLACE FUNCTION public.get_handle_balance(p_subscription_id UUID)
RETURNS INTEGER
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT GREATEST(0, handles_balance) FROM subscriptions WHERE id = p_subscription_id;
$$;

-- 4c) spend_handles — deduct at booking/confirmation
CREATE OR REPLACE FUNCTION public.spend_handles(
  p_subscription_id UUID,
  p_customer_id UUID,
  p_amount INTEGER,
  p_reference_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_balance INTEGER;
  v_new_balance INTEGER;
BEGIN
  -- Lock subscription row
  SELECT handles_balance INTO v_current_balance
  FROM subscriptions
  WHERE id = p_subscription_id
  FOR UPDATE;

  IF v_current_balance IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'subscription_not_found');
  END IF;

  IF v_current_balance < p_amount THEN
    RETURN jsonb_build_object('success', false, 'error', 'insufficient_handles', 'balance', v_current_balance, 'required', p_amount);
  END IF;

  v_new_balance := GREATEST(0, v_current_balance - p_amount);

  INSERT INTO handle_transactions (subscription_id, customer_id, txn_type, amount, balance_after, reference_type, reference_id)
  VALUES (p_subscription_id, p_customer_id, 'spend', -p_amount, v_new_balance, 'job', p_reference_id);

  UPDATE subscriptions SET handles_balance = v_new_balance, updated_at = now() WHERE id = p_subscription_id;

  RETURN jsonb_build_object('success', true, 'balance_after', v_new_balance);
END;
$$;

-- 4d) grant_cycle_handles — monthly/cycle grant with rollover cap + expiry
CREATE OR REPLACE FUNCTION public.grant_cycle_handles(
  p_subscription_id UUID,
  p_customer_id UUID,
  p_idempotency_key TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan_id UUID;
  v_handles_per_cycle INTEGER;
  v_rollover_cap INTEGER;
  v_rollover_expiry_days INTEGER;
  v_current_balance INTEGER;
  v_capped_balance INTEGER;
  v_expire_amount INTEGER;
  v_grant_amount INTEGER;
  v_new_balance INTEGER;
  v_expires_at TIMESTAMPTZ;
BEGIN
  -- Idempotency check
  IF p_idempotency_key IS NOT NULL AND EXISTS (
    SELECT 1 FROM handle_transactions
    WHERE subscription_id = p_subscription_id AND metadata->>'idempotency_key' = p_idempotency_key
  ) THEN
    RETURN jsonb_build_object('success', true, 'skipped', true, 'reason', 'idempotent_duplicate');
  END IF;

  -- Get plan config
  SELECT s.plan_id, s.handles_balance INTO v_plan_id, v_current_balance
  FROM subscriptions s WHERE s.id = p_subscription_id FOR UPDATE;

  SELECT ph.handles_per_cycle, ph.rollover_cap, ph.rollover_expiry_days
  INTO v_handles_per_cycle, v_rollover_cap, v_rollover_expiry_days
  FROM plan_handles ph WHERE ph.plan_id = v_plan_id;

  IF v_handles_per_cycle IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'no_plan_handles_config');
  END IF;

  v_grant_amount := v_handles_per_cycle;
  v_expires_at := now() + (v_rollover_expiry_days || ' days')::INTERVAL;

  -- Apply rollover cap: if current + grant > cap, expire excess first
  v_capped_balance := LEAST(v_current_balance, v_rollover_cap);
  v_expire_amount := GREATEST(0, v_current_balance - v_rollover_cap);

  -- Record expiry of excess handles above rollover cap
  IF v_expire_amount > 0 THEN
    INSERT INTO handle_transactions (subscription_id, customer_id, txn_type, amount, balance_after, reference_type, metadata)
    VALUES (p_subscription_id, p_customer_id, 'expire', -v_expire_amount, v_capped_balance, 'rollover_cap',
            jsonb_build_object('reason', 'above_rollover_cap', 'cap', v_rollover_cap));
  END IF;

  -- Grant new cycle handles
  v_new_balance := v_capped_balance + v_grant_amount;

  INSERT INTO handle_transactions (subscription_id, customer_id, txn_type, amount, balance_after, reference_type, expires_at, metadata)
  VALUES (p_subscription_id, p_customer_id, 'grant', v_grant_amount, v_new_balance, 'cycle_grant', v_expires_at,
          CASE WHEN p_idempotency_key IS NOT NULL THEN jsonb_build_object('idempotency_key', p_idempotency_key) ELSE '{}' END);

  UPDATE subscriptions SET handles_balance = v_new_balance, updated_at = now() WHERE id = p_subscription_id;

  RETURN jsonb_build_object('success', true, 'granted', v_grant_amount, 'expired', v_expire_amount, 'balance_after', v_new_balance);
END;
$$;

-- 4e) expire_stale_handles — expire handles past their expires_at date
CREATE OR REPLACE FUNCTION public.expire_stale_handles()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rec RECORD;
  v_total_expired INTEGER := 0;
  v_subs_affected INTEGER := 0;
BEGIN
  -- Find subscriptions with unexpired grant/refund txns past expiry
  FOR v_rec IN
    SELECT DISTINCT subscription_id
    FROM handle_transactions
    WHERE txn_type IN ('grant', 'refund')
      AND expires_at IS NOT NULL
      AND expires_at < now()
      AND NOT EXISTS (
        -- Check this grant hasn't already been expired
        SELECT 1 FROM handle_transactions t2
        WHERE t2.reference_id = handle_transactions.id
          AND t2.txn_type = 'expire'
          AND t2.reference_type = 'stale_expiry'
      )
  LOOP
    -- Recalc from ledger to get accurate balance
    PERFORM recalc_handles_balance(v_rec.subscription_id);
    v_subs_affected := v_subs_affected + 1;
  END LOOP;

  RETURN jsonb_build_object('success', true, 'subscriptions_checked', v_subs_affected);
END;
$$;

-- 4f) refund_handles — refund preserving original expiry
CREATE OR REPLACE FUNCTION public.refund_handles(
  p_subscription_id UUID,
  p_customer_id UUID,
  p_amount INTEGER,
  p_reference_id UUID DEFAULT NULL,
  p_original_expires_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_balance INTEGER;
  v_new_balance INTEGER;
  v_expires_at TIMESTAMPTZ;
BEGIN
  SELECT handles_balance INTO v_current_balance
  FROM subscriptions WHERE id = p_subscription_id FOR UPDATE;

  IF v_current_balance IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'subscription_not_found');
  END IF;

  -- If original expiry provided, preserve it; otherwise look up from the spend txn
  IF p_original_expires_at IS NOT NULL THEN
    v_expires_at := p_original_expires_at;
  ELSIF p_reference_id IS NOT NULL THEN
    -- Find the original grant that funded this spend
    SELECT t_grant.expires_at INTO v_expires_at
    FROM handle_transactions t_spend
    JOIN handle_transactions t_grant ON t_grant.subscription_id = t_spend.subscription_id
      AND t_grant.txn_type IN ('grant', 'refund')
      AND t_grant.expires_at IS NOT NULL
      AND t_grant.created_at <= t_spend.created_at
    WHERE t_spend.reference_id = p_reference_id AND t_spend.txn_type = 'spend'
    ORDER BY t_grant.created_at DESC
    LIMIT 1;
  END IF;

  -- Default: 60 days from now if we couldn't find original
  IF v_expires_at IS NULL OR v_expires_at < now() THEN
    v_expires_at := now() + INTERVAL '60 days';
  END IF;

  v_new_balance := v_current_balance + p_amount;

  INSERT INTO handle_transactions (subscription_id, customer_id, txn_type, amount, balance_after, reference_type, reference_id, expires_at, metadata)
  VALUES (p_subscription_id, p_customer_id, 'refund', p_amount, v_new_balance, 'cancellation_refund', p_reference_id, v_expires_at,
          jsonb_build_object('original_expires_at', v_expires_at));

  UPDATE subscriptions SET handles_balance = v_new_balance, updated_at = now() WHERE id = p_subscription_id;

  RETURN jsonb_build_object('success', true, 'refunded', p_amount, 'balance_after', v_new_balance, 'expires_at', v_expires_at);
END;
$$;
