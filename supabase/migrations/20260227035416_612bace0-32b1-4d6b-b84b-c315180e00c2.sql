
-- D2-F1: Server-side suppression trigger to prevent client-side bypass
CREATE OR REPLACE FUNCTION public.enforce_visit_rating_suppression()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
DECLARE
  v_completed_count int;
  v_issue_count int;
BEGIN
  SELECT count(*) INTO v_completed_count
  FROM jobs WHERE customer_id = NEW.customer_id AND status = 'COMPLETED';

  SELECT count(*) INTO v_issue_count
  FROM customer_issues WHERE job_id = NEW.job_id AND customer_id = NEW.customer_id;

  IF v_completed_count <= 1 THEN
    NEW.is_suppressed := true;
    NEW.suppression_reason := 'first_visit';
  ELSIF v_issue_count > 0 THEN
    NEW.is_suppressed := true;
    NEW.suppression_reason := 'issue_reported';
  ELSE
    NEW.is_suppressed := false;
    NEW.suppression_reason := null;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_enforce_visit_rating_suppression
  BEFORE INSERT OR UPDATE ON public.visit_ratings
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_visit_rating_suppression();
