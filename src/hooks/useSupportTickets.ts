import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type SupportTicketRow = {
  id: string;
  customer_id: string;
  job_id: string | null;
  invoice_id: string | null;
  provider_org_id: string | null;
  zone_id: string | null;
  ticket_type: string;
  severity: string;
  status: string;
  category: string | null;
  sku_id: string | null;
  customer_note: string | null;
  resolution_summary: string | null;
  ai_summary: string | null;
  ai_evidence_score: number | null;
  ai_risk_score: number | null;
  sla_due_at: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
};

type TicketFilters = {
  status?: string;
  queue?: string; // admin queue filters
};

export function useSupportTickets(filters?: TicketFilters) {
  const { activeRole } = useAuth();

  return useQuery({
    queryKey: ["support-tickets", activeRole, filters],
    queryFn: async () => {
      let query = supabase
        .from("support_tickets")
        .select("*")
        .order("created_at", { ascending: false });

      if (filters?.status && filters.status !== "all") {
        query = query.eq("status", filters.status as any);
      }

      // Admin queue filters
      if (activeRole === "admin" && filters?.queue) {
        switch (filters.queue) {
          case "needs_review":
            query = query.eq("status", "in_review");
            break;
          case "damage_safety":
            query = query.in("ticket_type", ["damage", "safety"]);
            break;
          case "chargeback_risk":
            query = query.eq("ticket_type", "billing");
            break;
          case "provider_dispute":
            query = query.eq("status", "awaiting_provider");
            break;
          case "sla_breach":
            query = query.not("sla_due_at", "is", null);
            break;
        }
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as SupportTicketRow[];
    },
  });
}
