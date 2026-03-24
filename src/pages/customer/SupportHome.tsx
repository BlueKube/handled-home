import { useNavigate } from "react-router-dom";
import { useSupportTickets } from "@/hooks/useSupportTickets";
import { useCustomerJobs } from "@/hooks/useCustomerJobs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TicketStatusChip } from "@/components/support/TicketStatusChip";
import { MessageCirclePlus, ChevronRight, ChevronLeft, Inbox, Clock } from "lucide-react";
import { CustomerEmptyState } from "@/components/customer/CustomerEmptyState";
import { HelpTip } from "@/components/ui/help-tip";
import { format } from "date-fns";

export default function CustomerSupportHome() {
  const navigate = useNavigate();
  const { data: tickets = [], isLoading: ticketsLoading } = useSupportTickets();
  const { data: recentJobs = [] } = useCustomerJobs();

  const openTickets = tickets.filter((t) => !["resolved", "closed"].includes(t.status));
  const recentCompleted = recentJobs
    .filter((j: any) => j.status === "COMPLETED")
    .slice(0, 3);

  return (
    <div className="px-4 py-6 pb-24 space-y-6 animate-fade-in">
      <button onClick={() => navigate("/customer/more")} className="flex items-center gap-1 text-muted-foreground mb-2 hover:text-foreground transition-colors" aria-label="Back to More menu">
        <ChevronLeft className="h-4 w-4" />
        <span className="text-sm">More</span>
      </button>
      <div className="space-y-1">
        <h1 className="text-h2">Support <HelpTip text="Submit a ticket and we'll respond within 24 hours. For urgent issues, call the number below." /></h1>
        <p className="text-caption">Get help or resolve an issue</p>
      </div>

      {/* CTA */}
      <Card
        className="p-5 flex items-center gap-4 press-feedback cursor-pointer border-accent/20 bg-accent/5 hover:bg-accent/10 transition-colors"
        onClick={() => navigate("/customer/support/new")}
      >
        <div className="h-11 w-11 rounded-xl bg-accent/15 flex items-center justify-center shrink-0">
          <MessageCirclePlus className="h-5 w-5 text-accent" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold">Resolve something now</p>
          <p className="text-xs text-muted-foreground mt-0.5">Get an instant resolution for most issues</p>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </Card>

      {/* Open tickets */}
      {openTickets.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Active tickets</h2>
          {openTickets.map((ticket) => (
            <Card
              key={ticket.id}
              className="p-4 flex items-center gap-3 press-feedback cursor-pointer"
              onClick={() => navigate(`/customer/support/tickets/${ticket.id}`)}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <TicketStatusChip status={ticket.status} />
                  <span className="text-[11px] text-muted-foreground">
                    {format(new Date(ticket.created_at), "MMM d")}
                  </span>
                </div>
                <p className="text-sm font-medium truncate">
                  {ticket.category ? ticket.category.replace(/_/g, " ") : ticket.ticket_type}
                </p>
                {ticket.customer_note && (
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{ticket.customer_note}</p>
                )}
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </Card>
          ))}
        </section>
      )}

      {/* Recent visits - quick report */}
      {recentCompleted.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Recent visits</h2>
          {recentCompleted.map((job: any) => (
            <Card
              key={job.id}
              className="p-4 flex items-center gap-3 press-feedback cursor-pointer"
              onClick={() => navigate(`/customer/support/new?job_id=${job.id}`)}
            >
              <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <Clock className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">
                  {job.scheduled_date ? format(new Date(job.scheduled_date), "EEE, MMM d") : "Visit"}
                </p>
                <p className="text-xs text-muted-foreground">Report an issue</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </Card>
          ))}
        </section>
      )}

      {/* All tickets link */}
      {tickets.length > 0 && (
        <Button
          variant="outline"
          className="w-full"
          onClick={() => navigate("/customer/support/tickets")}
        >
          <Inbox className="h-4 w-4 mr-2" />
          View all tickets ({tickets.length})
        </Button>
      )}

      {/* Empty state */}
      {!ticketsLoading && tickets.length === 0 && recentCompleted.length === 0 && (
        <CustomerEmptyState
          icon={Inbox}
          title="No issues — that's great!"
          body="If something comes up after a visit, you can report it here and we'll resolve it quickly."
        />
      )}
    </div>
  );
}
