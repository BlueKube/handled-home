import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useTicketActions(ticketId: string) {
  const { user, activeRole } = useAuth();
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["support-ticket", ticketId] });
    queryClient.invalidateQueries({ queryKey: ["support-ticket-offers", ticketId] });
    queryClient.invalidateQueries({ queryKey: ["support-ticket-events", ticketId] });
    queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
  };

  const logEvent = async (eventType: string, metadata?: Record<string, unknown>) => {
    await supabase.from("support_ticket_events").insert([{
      ticket_id: ticketId,
      event_type: eventType as any,
      actor_user_id: user?.id,
      actor_role: activeRole,
      metadata: (metadata ?? {}) as any,
    }]);
  };

  // Customer: accept an offer via SECURITY DEFINER RPC (R2 fix)
  const acceptOffer = useMutation({
    mutationFn: async (offerId: string) => {
      const { data, error } = await supabase.rpc("accept_support_offer", {
        p_offer_id: offerId,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: invalidate,
  });

  // Customer: add info
  const addCustomerInfo = useMutation({
    mutationFn: async (note: string) => {
      await logEvent("customer_added_info", { note: note.slice(0, 500) });
    },
    onSuccess: invalidate,
  });

  // Provider: acknowledge
  const providerAcknowledge = useMutation({
    mutationFn: async () => {
      await logEvent("provider_acknowledged");
    },
    onSuccess: invalidate,
  });

  // Provider: add statement
  const providerStatement = useMutation({
    mutationFn: async (statement: string) => {
      await logEvent("provider_statement_added", { statement: statement.slice(0, 300) });
    },
    onSuccess: invalidate,
  });

  // Provider: request review
  const providerRequestReview = useMutation({
    mutationFn: async (reason: string) => {
      await supabase
        .from("support_tickets")
        .update({ status: "in_review" as any })
        .eq("id", ticketId);
      await logEvent("provider_review_requested", { reason });
    },
    onSuccess: invalidate,
  });

  // Admin: resolve with summary
  const adminResolve = useMutation({
    mutationFn: async ({ summary, reason }: { summary: string; reason: string }) => {
      await supabase
        .from("support_tickets")
        .update({
          status: "resolved" as any,
          resolution_summary: summary,
          resolved_at: new Date().toISOString(),
          resolved_by_user_id: user?.id,
        })
        .eq("id", ticketId);
      await logEvent("admin_resolved", { summary, reason });
    },
    onSuccess: invalidate,
  });

  // Admin: escalate
  const adminEscalate = useMutation({
    mutationFn: async (reason: string) => {
      await supabase
        .from("support_tickets")
        .update({ status: "escalated" as any })
        .eq("id", ticketId);
      await logEvent("admin_escalated", { reason });
    },
    onSuccess: invalidate,
  });

  // Admin: present resolution offer (P8)
  const adminPresentOffer = useMutation({
    mutationFn: async (input: {
      offer_type: string;
      amount_cents?: number;
      description?: string;
    }) => {
      const { error } = await supabase
        .from("support_ticket_offers")
        .insert({
          ticket_id: ticketId,
          offer_type: input.offer_type as any,
          amount_cents: input.amount_cents ?? 0,
          description: input.description,
          status: "pending" as any,
        });
      if (error) throw error;

      // Update ticket status to awaiting_customer
      await supabase
        .from("support_tickets")
        .update({ status: "awaiting_customer" as any })
        .eq("id", ticketId);

      await logEvent("offer_presented", {
        offer_type: input.offer_type,
        amount_cents: input.amount_cents,
      });
    },
    onSuccess: invalidate,
  });

  // Admin: change ticket status (P11)
  const adminChangeStatus = useMutation({
    mutationFn: async (newStatus: string) => {
      await supabase
        .from("support_tickets")
        .update({ status: newStatus as any })
        .eq("id", ticketId);
      await logEvent("status_changed", { new_status: newStatus });
    },
    onSuccess: invalidate,
  });

  return {
    acceptOffer,
    addCustomerInfo,
    providerAcknowledge,
    providerStatement,
    providerRequestReview,
    adminResolve,
    adminEscalate,
    adminPresentOffer,
    adminChangeStatus,
  };
}
