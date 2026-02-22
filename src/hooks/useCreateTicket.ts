import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

type CreateTicketInput = {
  ticket_type: string;
  category?: string;
  job_id?: string;
  invoice_id?: string;
  sku_id?: string;
  customer_note?: string;
  severity?: string;
};

export function useCreateTicket() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateTicketInput) => {
      if (!user) throw new Error("Not authenticated");

      // Look up job to get provider_org_id and zone_id if job_id provided
      let provider_org_id: string | null = null;
      let zone_id: string | null = null;

      if (input.job_id) {
        const { data: job } = await supabase
          .from("jobs")
          .select("provider_org_id, zone_id")
          .eq("id", input.job_id)
          .single();
        if (job) {
          provider_org_id = job.provider_org_id;
          zone_id = job.zone_id;
        }
      }

      const { data: ticket, error } = await supabase
        .from("support_tickets")
        .insert({
          customer_id: user.id,
          ticket_type: input.ticket_type as any,
          category: input.category,
          job_id: input.job_id,
          invoice_id: input.invoice_id,
          sku_id: input.sku_id,
          customer_note: input.customer_note,
          severity: (input.severity ?? "medium") as any,
          provider_org_id,
          zone_id,
        })
        .select()
        .single();

      if (error) throw error;

      // Log creation event
      await supabase.from("support_ticket_events").insert({
        ticket_id: ticket.id,
        event_type: "ticket_created" as any,
        actor_user_id: user.id,
        actor_role: "customer",
        metadata: { ticket_type: input.ticket_type, category: input.category },
      });

      // Fire-and-forget AI classification
      supabase.functions.invoke("support-ai-classify", {
        body: { ticket_id: ticket.id },
      }).catch((err) => console.warn("AI classify failed (non-blocking):", err));

      return ticket;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
    },
  });
}
