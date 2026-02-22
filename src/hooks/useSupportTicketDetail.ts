import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type SupportTicketOffer = {
  id: string;
  ticket_id: string;
  offer_type: string;
  status: string;
  amount_cents: number | null;
  description: string | null;
  metadata: Record<string, unknown> | null;
  accepted_at: string | null;
  created_at: string;
};

export type SupportTicketEvent = {
  id: string;
  ticket_id: string;
  event_type: string;
  actor_user_id: string | null;
  actor_role: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type SupportAttachment = {
  id: string;
  ticket_id: string;
  uploaded_by_user_id: string;
  uploaded_by_role: string;
  storage_path: string;
  file_type: string | null;
  description: string | null;
  created_at: string;
};

export function useSupportTicketDetail(ticketId: string | undefined) {
  const ticketQuery = useQuery({
    queryKey: ["support-ticket", ticketId],
    queryFn: async () => {
      if (!ticketId) return null;
      const { data, error } = await supabase
        .from("support_tickets")
        .select("*")
        .eq("id", ticketId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!ticketId,
  });

  const offersQuery = useQuery({
    queryKey: ["support-ticket-offers", ticketId],
    queryFn: async () => {
      if (!ticketId) return [];
      const { data, error } = await supabase
        .from("support_ticket_offers")
        .select("*")
        .eq("ticket_id", ticketId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as SupportTicketOffer[];
    },
    enabled: !!ticketId,
  });

  const eventsQuery = useQuery({
    queryKey: ["support-ticket-events", ticketId],
    queryFn: async () => {
      if (!ticketId) return [];
      const { data, error } = await supabase
        .from("support_ticket_events")
        .select("*")
        .eq("ticket_id", ticketId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as SupportTicketEvent[];
    },
    enabled: !!ticketId,
  });

  const attachmentsQuery = useQuery({
    queryKey: ["support-ticket-attachments", ticketId],
    queryFn: async () => {
      if (!ticketId) return [];
      const { data, error } = await supabase
        .from("support_attachments")
        .select("*")
        .eq("ticket_id", ticketId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as SupportAttachment[];
    },
    enabled: !!ticketId,
  });

  return {
    ticket: ticketQuery.data,
    offers: offersQuery.data ?? [],
    events: eventsQuery.data ?? [],
    attachments: attachmentsQuery.data ?? [],
    isLoading: ticketQuery.isLoading,
    error: ticketQuery.error,
  };
}
