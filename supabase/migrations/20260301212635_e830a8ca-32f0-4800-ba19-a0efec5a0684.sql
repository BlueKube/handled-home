-- M-2: Link customer_issues to support_tickets
ALTER TABLE public.customer_issues
ADD COLUMN support_ticket_id uuid REFERENCES public.support_tickets(id);

CREATE INDEX idx_customer_issues_support_ticket_id ON public.customer_issues(support_ticket_id);

-- M-1: Add ai_reviewing to support_tickets status lifecycle (no enum change needed, status is text)