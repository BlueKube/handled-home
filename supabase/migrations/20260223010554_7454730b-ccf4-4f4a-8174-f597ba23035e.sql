
-- =============================================================
-- Module 13 Review Fixes
-- =============================================================

-- S5: Drop old record_autopilot_action (exact old signature) and recreate with admin check + lock respect
DROP FUNCTION IF EXISTS public.record_autopilot_action(uuid, text, text, text, text, text, text, jsonb);

CREATE OR REPLACE FUNCTION public.record_autopilot_action(
  p_zone_id uuid,
  p_category text,
  p_action_type text,
  p_new_state text DEFAULT NULL,
  p_reason text DEFAULT NULL,
  p_trigger_source text DEFAULT 'autopilot',
  p_metadata jsonb DEFAULT '{}'
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_prev text;
  v_locked_until timestamptz;
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  SELECT status::text, locked_until INTO v_prev, v_locked_until
  FROM market_zone_category_state
  WHERE zone_id = p_zone_id AND category = p_category;

  IF p_trigger_source = 'autopilot' AND v_locked_until IS NOT NULL AND v_locked_until > now() THEN
    RAISE EXCEPTION 'Zone/category is locked until %', v_locked_until;
  END IF;

  IF p_new_state IS NOT NULL THEN
    INSERT INTO market_zone_category_state (zone_id, category, status)
    VALUES (p_zone_id, p_category, p_new_state::market_zone_category_status)
    ON CONFLICT (zone_id, category) DO UPDATE
      SET status = p_new_state::market_zone_category_status, updated_at = now();
  END IF;

  INSERT INTO growth_autopilot_actions (
    zone_id, category, action_type, previous_state, new_state,
    reason, trigger_source, actor_user_id, metadata
  ) VALUES (
    p_zone_id, p_category, p_action_type, v_prev, p_new_state,
    p_reason, p_trigger_source, auth.uid(), p_metadata
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_autopilot_action(uuid, text, text, text, text, text, jsonb) TO authenticated;

-- S6+S7: Drop and recreate compute_zone_health_score with admin check + category filtering
DROP FUNCTION IF EXISTS public.compute_zone_health_score(uuid, text);

CREATE OR REPLACE FUNCTION public.compute_zone_health_score(
  p_zone_id uuid,
  p_category text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_supply numeric := 0;
  v_demand numeric := 0;
  v_quality numeric := 0;
  v_health numeric := 0;
  v_label text := 'unknown';
  v_inputs jsonb;
  v_provider_count int;
  v_sub_count int;
  v_job_count int;
  v_issue_count int;
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  -- Supply: providers covering zone WITH matching category capability
  SELECT count(DISTINCT pc.provider_org_id) INTO v_provider_count
  FROM provider_coverage pc
  JOIN provider_capabilities pcap ON pcap.provider_org_id = pc.provider_org_id
  WHERE pc.zone_id = p_zone_id
    AND pc.request_status = 'approved'
    AND pcap.capability_key = p_category
    AND pcap.is_enabled = true;
  v_supply := LEAST(v_provider_count::numeric / 5.0, 1.0);

  -- Demand: active subscriptions in zone
  SELECT count(*) INTO v_sub_count
  FROM subscriptions s
  WHERE s.zone_id = p_zone_id AND s.status = 'active';
  v_demand := LEAST(v_sub_count::numeric / 20.0, 1.0);

  -- Quality: job issue ratio filtered by category via service_skus
  SELECT count(*) INTO v_job_count
  FROM jobs j
  JOIN job_skus js ON js.job_id = j.id
  JOIN service_skus ss ON ss.id = js.sku_id
  WHERE j.zone_id = p_zone_id AND ss.category = p_category
    AND j.created_at > now() - interval '90 days';

  SELECT count(*) INTO v_issue_count
  FROM job_issues ji
  JOIN jobs j ON j.id = ji.job_id
  JOIN job_skus js ON js.job_id = j.id
  JOIN service_skus ss ON ss.id = js.sku_id
  WHERE j.zone_id = p_zone_id AND ss.category = p_category
    AND ji.created_at > now() - interval '90 days';

  IF v_job_count > 0 THEN
    v_quality := 1.0 - LEAST(v_issue_count::numeric / v_job_count, 1.0);
  ELSE
    v_quality := 1.0;
  END IF;

  v_health := (v_supply * 0.4) + (v_demand * 0.2) + (v_quality * 0.4);

  IF v_health >= 0.8 THEN v_label := 'healthy';
  ELSIF v_health >= 0.5 THEN v_label := 'stable';
  ELSIF v_health >= 0.3 THEN v_label := 'at_risk';
  ELSE v_label := 'critical';
  END IF;

  v_inputs := jsonb_build_object(
    'provider_count', v_provider_count,
    'subscription_count', v_sub_count,
    'job_count', v_job_count,
    'issue_count', v_issue_count
  );

  INSERT INTO market_health_snapshots (
    zone_id, category, supply_score, demand_score, quality_score,
    health_score, health_label, inputs
  ) VALUES (
    p_zone_id, p_category, v_supply, v_demand, v_quality,
    v_health, v_label, v_inputs
  );

  RETURN jsonb_build_object(
    'supply_score', v_supply, 'demand_score', v_demand,
    'quality_score', v_quality, 'health_score', v_health,
    'health_label', v_label, 'inputs', v_inputs
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.compute_zone_health_score(uuid, text) TO authenticated;

-- S2: Fix apply_referral_reward to compute correct balance_after_cents
CREATE OR REPLACE FUNCTION public.apply_referral_reward(
  p_reward_id uuid,
  p_admin_user_id uuid DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_reward RECORD;
  v_current_balance int;
  v_org_id uuid;
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  SELECT * INTO v_reward FROM referral_rewards WHERE id = p_reward_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Reward not found'; END IF;
  IF v_reward.status NOT IN ('earned', 'on_hold') THEN
    RAISE EXCEPTION 'Reward must be earned or on_hold to apply, current: %', v_reward.status;
  END IF;

  UPDATE referral_rewards SET status = 'applied', applied_at = now() WHERE id = p_reward_id;

  IF v_reward.reward_type = 'customer_credit' THEN
    SELECT COALESCE(
      (SELECT balance_after_cents FROM customer_ledger_events
       WHERE customer_id = v_reward.recipient_user_id
       ORDER BY created_at DESC LIMIT 1), 0
    ) INTO v_current_balance;

    INSERT INTO customer_ledger_events (customer_id, event_type, amount_cents, balance_after_cents, metadata)
    VALUES (v_reward.recipient_user_id, 'REFERRAL_CREDIT', v_reward.amount_cents,
            v_current_balance + v_reward.amount_cents,
            jsonb_build_object('reward_id', p_reward_id));

    UPDATE referral_rewards
    SET ledger_event_id = (
      SELECT id FROM customer_ledger_events
      WHERE customer_id = v_reward.recipient_user_id
      ORDER BY created_at DESC LIMIT 1
    )
    WHERE id = p_reward_id;

  ELSIF v_reward.reward_type = 'provider_bonus' THEN
    SELECT po.id INTO v_org_id
    FROM provider_members pm
    JOIN provider_orgs po ON po.id = pm.provider_org_id
    WHERE pm.user_id = v_reward.recipient_user_id LIMIT 1;

    IF v_org_id IS NOT NULL THEN
      SELECT COALESCE(
        (SELECT balance_after_cents FROM provider_ledger_events
         WHERE provider_org_id = v_org_id
         ORDER BY created_at DESC LIMIT 1), 0
      ) INTO v_current_balance;

      INSERT INTO provider_ledger_events (provider_org_id, event_type, amount_cents, balance_after_cents, metadata)
      VALUES (v_org_id, 'REFERRAL_BONUS', v_reward.amount_cents,
              v_current_balance + v_reward.amount_cents,
              jsonb_build_object('reward_id', p_reward_id));
    END IF;
  END IF;

  INSERT INTO admin_audit_log (admin_user_id, action, entity_type, entity_id, after)
  VALUES (COALESCE(p_admin_user_id, auth.uid()), 'apply_reward', 'referral_reward', p_reward_id,
          jsonb_build_object('status', 'applied', 'amount_cents', v_reward.amount_cents));
END;
$$;

-- A2: Trigger to auto-increment referral_codes.uses_count
CREATE OR REPLACE FUNCTION public.increment_referral_code_uses()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE referral_codes SET uses_count = uses_count + 1 WHERE id = NEW.code_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_increment_referral_code_uses ON referrals;
CREATE TRIGGER trg_increment_referral_code_uses
  AFTER INSERT ON referrals
  FOR EACH ROW EXECUTE FUNCTION increment_referral_code_uses();

-- S4: Function to release expired holds
CREATE OR REPLACE FUNCTION public.release_expired_referral_holds()
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_count int;
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  UPDATE referral_rewards SET status = 'earned'
  WHERE status = 'on_hold' AND hold_until IS NOT NULL AND hold_until <= now();

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.release_expired_referral_holds TO authenticated;
