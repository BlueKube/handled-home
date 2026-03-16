import { useNavigate } from "react-router-dom";
import { useSupportTickets } from "@/hooks/useSupportTickets";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TicketStatusChip } from "@/components/support/TicketStatusChip";
import { AlertTriangle, ChevronRight, Inbox, ShieldAlert } from "lucide-react";
import { format } from "date-fns";

export default function ProviderSupportHome() {
  const navigate = useNavigate();
  const { data: tickets = [], isLoading } = useSupportTickets();

  const needsInput = tickets.filter((t) => t.status === "awaiting_provider");
  const activeTickets = tickets.filter((t) => !["resolved", "closed"].includes(t.status) && t.status !== "awaiting_provider");

  return (
    <div className="animate-fade-in p-4 pb-24 space-y-5">
      <div>
        <h1 className="text-h2">Support</h1>
        <p className="text-caption mt-0.5">Claims and disputes involving your jobs</p>
      </div>

      {/* Needs your input */}
      {needsInput.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-warning">Needs your input</h2>
          </div>
          {needsInput.map((ticket) => (
            <Card
              key={ticket.id}
              className="p-4 flex items-center gap-3 press-feedback cursor-pointer border-warning/30"
              onClick={() => navigate(`/provider/support/tickets/${ticket.id}`)}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <TicketStatusChip status={ticket.status} />
                  <span className="text-[11px] text-muted-foreground">
                    {format(new Date(ticket.created_at), "MMM d")}
                  </span>
                </div>
                <p className="text-sm font-medium truncate capitalize">
                  {ticket.category ? ticket.category.replace(/_/g, " ") : ticket.ticket_type.replace(/_/g, " ")}
                </p>
                {ticket.ai_summary && (
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{ticket.ai_summary}</p>
                )}
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </Card>
          ))}
        </section>
      )}

      {/* Other active tickets */}
      {activeTickets.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Active tickets</h2>
          {activeTickets.map((ticket) => (
            <Card
              key={ticket.id}
              className="p-4 flex items-center gap-3 press-feedback cursor-pointer"
              onClick={() => navigate(`/provider/support/tickets/${ticket.id}`)}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <TicketStatusChip status={ticket.status} />
                </div>
                <p className="text-sm font-medium truncate capitalize">
                  {ticket.category ? ticket.category.replace(/_/g, " ") : ticket.ticket_type.replace(/_/g, " ")}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </Card>
          ))}
        </section>
      )}

      {/* Empty state */}
      {!isLoading && tickets.length === 0 && (
        <div className="text-center py-10 space-y-2">
          <ShieldAlert className="h-10 w-10 text-muted-foreground/40 mx-auto" />
          <p className="text-sm text-muted-foreground">No support tickets — keep up the great work!</p>
        </div>
      )}
    </div>
  );
}
