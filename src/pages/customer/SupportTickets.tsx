import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSupportTickets } from "@/hooks/useSupportTickets";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TicketStatusChip } from "@/components/support/TicketStatusChip";
import { QueryErrorCard } from "@/components/QueryErrorCard";
import { ChevronLeft, ChevronRight, Inbox } from "lucide-react";
import { format } from "date-fns";

type Filter = "all" | "open" | "resolved";

export default function CustomerSupportTickets() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<Filter>("open");
  const { data: tickets = [], isLoading, isError, refetch } = useSupportTickets();

  const filtered = tickets.filter((t) => {
    if (filter === "open") return !["resolved", "closed"].includes(t.status);
    if (filter === "resolved") return ["resolved", "closed"].includes(t.status);
    return true;
  });

  const filters: { value: Filter; label: string }[] = [
    { value: "open", label: "Open" },
    { value: "resolved", label: "Resolved" },
    { value: "all", label: "All" },
  ];

  return (
    <div className="p-4 pb-24 space-y-4 animate-fade-in">
      <Button variant="ghost" size="sm" className="gap-1 -ml-2" onClick={() => navigate("/customer/support")}>
        <ChevronLeft className="h-4 w-4" />
        Support
      </Button>

      <h1 className="text-h2">Your tickets</h1>

      {isError && (
        <QueryErrorCard message="Failed to load support tickets." onRetry={() => refetch()} />
      )}

      {/* Filter pills */}
      <div className="flex gap-2">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              filter === f.value
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-muted"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Ticket list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-muted/50 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-10 space-y-2">
          <Inbox className="h-10 w-10 text-muted-foreground/40 mx-auto" />
          <p className="text-sm text-muted-foreground">
            {filter === "open" ? "No open tickets" : "No tickets found"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((ticket) => (
            <Card
              key={ticket.id}
              className="p-4 flex items-center gap-3 press-feedback cursor-pointer"
              onClick={() => navigate(`/customer/support/tickets/${ticket.id}`)}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <TicketStatusChip status={ticket.status} />
                  <span className="text-[11px] text-muted-foreground">
                    {format(new Date(ticket.created_at), "MMM d, yyyy")}
                  </span>
                </div>
                <p className="text-sm font-medium truncate capitalize">
                  {ticket.category ? ticket.category.replace(/_/g, " ") : ticket.ticket_type.replace(/_/g, " ")}
                </p>
                {ticket.customer_note && (
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{ticket.customer_note}</p>
                )}
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
