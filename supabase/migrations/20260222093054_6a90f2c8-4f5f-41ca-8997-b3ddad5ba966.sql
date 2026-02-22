
-- Module 10: Customer Dashboard & Proof
-- New table: customer_issues (structured customer-facing issue intake)

CREATE TABLE public.customer_issues (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id uuid NOT NULL REFERENCES public.jobs(id),
  customer_id uuid NOT NULL,
  reason text NOT NULL CHECK (reason IN ('missed_something', 'damage_concern', 'not_satisfied', 'other')),
  note text NOT NULL,
  photo_storage_path text,
  photo_upload_status text CHECK (photo_upload_status IN ('PENDING', 'UPLOADED', 'FAILED')),
  status text NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'under_review', 'resolved')),
  resolution_note text,
  resolved_at timestamptz,
  resolved_by_admin_user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(job_id, customer_id)
);

-- Trigger: enforce 500 char limit on note
CREATE OR REPLACE FUNCTION public.protect_customer_issue_note_length()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.note IS NOT NULL AND length(NEW.note) > 500 THEN
    RAISE EXCEPTION 'Issue note must be 500 characters or fewer';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER enforce_customer_issue_note_length
  BEFORE INSERT OR UPDATE ON public.customer_issues
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_customer_issue_note_length();

-- Auto-update updated_at
CREATE TRIGGER update_customer_issues_updated_at
  BEFORE UPDATE ON public.customer_issues
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.customer_issues ENABLE ROW LEVEL SECURITY;

-- RLS: Customers can read own issues
CREATE POLICY "Customers can read own issues"
  ON public.customer_issues FOR SELECT
  USING (auth.uid() = customer_id);

-- RLS: Customers can insert own issues
CREATE POLICY "Customers can insert own issues"
  ON public.customer_issues FOR INSERT
  WITH CHECK (auth.uid() = customer_id);

-- RLS: Admins can manage all issues
CREATE POLICY "Admins can manage all customer issues"
  ON public.customer_issues FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Index for customer queries
CREATE INDEX idx_customer_issues_customer ON public.customer_issues(customer_id);
CREATE INDEX idx_customer_issues_job ON public.customer_issues(job_id);
CREATE INDEX idx_customer_issues_status ON public.customer_issues(status);

-- Storage: Allow customers to read photos for their own jobs
CREATE POLICY "Customers can read own job photos"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'job-photos'
    AND EXISTS (
      SELECT 1 FROM public.job_photos jp
      JOIN public.jobs j ON j.id = jp.job_id
      WHERE jp.storage_path = name
        AND j.customer_id = auth.uid()
    )
  );

-- Admin RPC: resolve customer issue
CREATE OR REPLACE FUNCTION public.admin_resolve_customer_issue(
  p_issue_id uuid,
  p_resolution_note text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_issue customer_issues%ROWTYPE;
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  SELECT * INTO v_issue FROM customer_issues WHERE id = p_issue_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Issue not found';
  END IF;

  IF v_issue.status = 'resolved' THEN
    RAISE EXCEPTION 'Issue already resolved';
  END IF;

  UPDATE customer_issues
    SET status = 'resolved',
        resolution_note = p_resolution_note,
        resolved_at = now(),
        resolved_by_admin_user_id = auth.uid()
    WHERE id = p_issue_id;

  INSERT INTO admin_audit_log (admin_user_id, entity_type, entity_id, action, before, after, reason)
    VALUES (auth.uid(), 'customer_issue', p_issue_id, 'resolve_customer_issue',
      jsonb_build_object('status', v_issue.status),
      jsonb_build_object('status', 'resolved', 'resolution_note', p_resolution_note),
      p_resolution_note);

  RETURN jsonb_build_object('status', 'resolved', 'issue_id', p_issue_id);
END;
$$;
