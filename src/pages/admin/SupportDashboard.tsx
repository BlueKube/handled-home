import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSupportTickets, type SupportTicketRow } from "@/hooks/useSupportTickets";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TicketStatusChip } from "@/components/support/TicketStatusChip";
import { ChevronRight, Inbox, AlertTriangle, ShieldAlert, CreditCard, Users, Clock, Search, UserCheck } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

type Queue = "all" | "needs_review" | "damage_safety" | "chargeback_risk" | "provider_dispute" | "sla_breach";

const QUEUES: { value: Queue; label: string; icon: React.ElementType }[] = [
  { value: "all", label: "All", icon: Inbox },
  { value: "needs_review", label: "Needs review", icon: Search },
  { value: "damage_safety", label: "Damage / Safety", icon: ShieldAlert },
  { value: "chargeback_risk", label: "Chargeback risk", icon: CreditCard },
  { value: "provider_dispute", label: "Provider dispute", icon: Users },
  { value: "sla_breach", label: "SLA breach", icon: Clock },
];

export default function AdminSupportDashboard() {
  const navigate = useNavigate();
  const [queue, setQueue] = useState<Queue>("all");
  const filters = queue === "all" ? undefined : { queue };
  const { data: tickets = [], isLoading, isError } = useSupportTickets(filters);

  const openCount = tickets.filter((t) => !["resolved", "closed"].includes(t.status)).length;

  if (isError) {
    return (
      <div className="p-6 space-y-3 animate-fade-in">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          <h1 className="text-2xl font-bold">Support Dashboard</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Failed to load data. Check your connection and try again.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-h2">Support Console</h1>
          <p className="text-caption">{openCount} open ticket{openCount !== 1 ? "s" : ""}</p>
        </div>
      </div>

      {/* Queue tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
        {QUEUES.map((q) => {
          const Icon = q.icon;
          return (
            <button
              key={q.value}
              onClick={() => setQueue(q.value)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors shrink-0 ${
                queue === q.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-muted"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {q.label}
            </button>
          );
        })}
      </div>

      {/* Ticket list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-muted/50 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : tickets.length === 0 ? (
        <div className="text-center py-10 space-y-2">
          <Inbox className="h-10 w-10 text-muted-foreground/40 mx-auto" />
          <p className="text-sm text-muted-foreground">No tickets in this queue</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tickets.map((ticket) => (
            <TicketRow
              key={ticket.id}
              ticket={ticket}
              onClick={() => navigate(`/admin/support/tickets/${ticket.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function TicketRow({ ticket, onClick }: { ticket: SupportTicketRow; onClick: () => void }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const severityIcon = ticket.severity === "critical" || ticket.severity === "high"
    ? <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
    : null;

  const isAssigned = !!ticket.assigned_to_user_id;
  const isAssignedToMe = ticket.assigned_to_user_id === user?.id;

  const handleClaim = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user?.id) return;
    const { error } = await supabase
      .from("support_tickets")
      .update({ assigned_to_user_id: user.id } as any)
      .eq("id", ticket.id);
    if (error) toast.error(error.message);
    else {
      toast.success("Ticket claimed");
      queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
    }
  };

  return (
    <Card className="p-4 flex items-center gap-3 press-feedback cursor-pointer" onClick={onClick}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <TicketStatusChip status={ticket.status} />
          {severityIcon}
          {isAssigned && (
            <Badge variant={isAssignedToMe ? "default" : "secondary"} className="text-[10px] gap-1">
              <UserCheck className="h-2.5 w-2.5" />
              {isAssignedToMe ? "Mine" : "Assigned"}
            </Badge>
          )}
          <span className="text-[11px] text-muted-foreground">
            {format(new Date(ticket.created_at), "MMM d, h:mm a")}
          </span>
        </div>
        <p className="text-sm font-medium truncate capitalize">
          {ticket.category ? ticket.category.replace(/_/g, " ") : ticket.ticket_type.replace(/_/g, " ")}
        </p>
        {ticket.ai_summary ? (
          <p className="text-xs text-muted-foreground truncate mt-0.5">{ticket.ai_summary}</p>
        ) : ticket.customer_note ? (
          <p className="text-xs text-muted-foreground truncate mt-0.5">{ticket.customer_note}</p>
        ) : null}
      </div>
      {!isAssigned ? (
        <Button variant="outline" size="sm" onClick={handleClaim} className="shrink-0">
          Claim
        </Button>
      ) : (
        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
      )}
    </Card>
  );
}
