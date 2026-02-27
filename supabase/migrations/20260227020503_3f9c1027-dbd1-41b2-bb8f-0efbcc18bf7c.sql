
-- D0-F1: Fix expire_stale_handles to actually insert 'expire' transactions
CREATE OR REPLACE FUNCTION expire_stale_handles()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_rec RECORD;
  v_sub RECORD;
  v_total_expired INT := 0;
  v_subs_affected INT := 0;
  v_new_balance INT;
BEGIN
  -- Find all expired grants/refunds that haven't been expired yet
  FOR v_rec IN
    SELECT ht.id, ht.subscription_id, ht.customer_id, ht.amount
    FROM handle_transactions ht
    WHERE ht.txn_type IN ('grant', 'refund')
      AND ht.expires_at IS NOT NULL
      AND ht.expires_at < now()
      AND ht.amount > 0
      AND NOT EXISTS (
        SELECT 1 FROM handle_transactions t2
        WHERE t2.reference_id = ht.id::text
          AND t2.txn_type = 'expire'
          AND t2.reference_type = 'stale_expiry'
      )
  LOOP
    -- Insert an expire transaction to cancel the remaining value
    INSERT INTO handle_transactions (
      subscription_id, customer_id, txn_type, amount, balance_after,
      reference_type, reference_id, metadata
    ) VALUES (
      v_rec.subscription_id, v_rec.customer_id, 'expire',
      -v_rec.amount, 0,
      'stale_expiry', v_rec.id::text,
      jsonb_build_object('reason', 'expired_grant', 'original_amount', v_rec.amount)
    );
    v_total_expired := v_total_expired + v_rec.amount;
  END LOOP;

  -- Recalc balance for each affected subscription
  FOR v_sub IN
    SELECT DISTINCT ht.subscription_id
    FROM handle_transactions ht
    WHERE ht.txn_type IN ('grant', 'refund')
      AND ht.expires_at IS NOT NULL
      AND ht.expires_at < now()
  LOOP
    PERFORM recalc_handles_balance(v_sub.subscription_id);
    v_subs_affected := v_subs_affected + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'total_expired', v_total_expired,
    'subscriptions_affected', v_subs_affected
  );
END;
$$;

-- D0-F2: Add auth check to spend_handles
CREATE OR REPLACE FUNCTION spend_handles(
  p_subscription_id UUID,
  p_customer_id UUID,
  p_amount INT,
  p_reference_id TEXT DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_balance INT;
  v_new_balance INT;
  v_caller UUID := auth.uid();
BEGIN
  -- Authorization check: caller must own the subscription or be admin
  IF NOT EXISTS (
    SELECT 1 FROM subscriptions
    WHERE id = p_subscription_id AND customer_id = v_caller
  ) AND NOT EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = v_caller AND role = 'admin'
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'unauthorized');
  END IF;

  IF p_amount <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'amount_must_be_positive');
  END IF;

  -- Lock subscription row
  SELECT handles_balance INTO v_current_balance
  FROM subscriptions
  WHERE id = p_subscription_id
  FOR UPDATE;

  IF v_current_balance IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'subscription_not_found');
  END IF;

  IF v_current_balance < p_amount THEN
    RETURN jsonb_build_object('success', false, 'error', 'insufficient_handles', 'balance', v_current_balance);
  END IF;

  v_new_balance := v_current_balance - p_amount;

  INSERT INTO handle_transactions (subscription_id, customer_id, txn_type, amount, balance_after, reference_type, reference_id)
  VALUES (p_subscription_id, p_customer_id, 'spend', -p_amount, v_new_balance, 'job', p_reference_id);

  UPDATE subscriptions SET handles_balance = v_new_balance, updated_at = now()
  WHERE id = p_subscription_id;

  RETURN jsonb_build_object('success', true, 'new_balance', v_new_balance);
END;
$$;

-- D0-F3: Idempotency index for grant_cycle_handles
CREATE INDEX IF NOT EXISTS idx_handle_txn_idempotency
  ON handle_transactions ((metadata->>'idempotency_key'))
  WHERE metadata->>'idempotency_key' IS NOT NULL;

-- D0-F4: CHECK constraint on txn_type (using validation trigger per project guidelines)
CREATE OR REPLACE FUNCTION validate_handle_txn_type()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.txn_type NOT IN ('grant', 'spend', 'expire', 'rollover', 'refund') THEN
    RAISE EXCEPTION 'Invalid txn_type: %. Must be one of: grant, spend, expire, rollover, refund', NEW.txn_type;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_handle_txn_type ON handle_transactions;
CREATE TRIGGER trg_validate_handle_txn_type
  BEFORE INSERT OR UPDATE ON handle_transactions
  FOR EACH ROW
  EXECUTE FUNCTION validate_handle_txn_type();
