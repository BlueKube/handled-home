import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSupportTicketDetail } from "@/hooks/useSupportTicketDetail";
import { useTicketActions } from "@/hooks/useTicketActions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { TicketStatusChip } from "@/components/support/TicketStatusChip";
import { ResolutionOfferCard } from "@/components/support/ResolutionOfferCard";
import { ArrowLeft, Clock, MessageSquarePlus } from "lucide-react";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";

export default function CustomerSupportTicketDetail() {
  const { ticketId } = useParams<{ ticketId: string }>();
  const navigate = useNavigate();
  const { ticket, offers, events, isLoading } = useSupportTicketDetail(ticketId);
  const actions = useTicketActions(ticketId ?? "");

  const [showAddInfo, setShowAddInfo] = useState(false);
  const [addInfoNote, setAddInfoNote] = useState("");

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="h-6 w-32 bg-muted/50 rounded animate-pulse mb-4" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-muted/50 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="p-4 text-center">
        <p className="text-sm text-muted-foreground">Ticket not found.</p>
        <Button variant="link" onClick={() => navigate("/customer/support")}>← Back to support</Button>
      </div>
    );
  }

  const isResolved = ["resolved", "closed"].includes(ticket.status);
  const pendingOffers = offers.filter((o) => o.status === "pending");
  const acceptedOffer = offers.find((o) => o.status === "accepted");

  const handleAcceptOffer = async (offerId: string) => {
    try {
      await actions.acceptOffer.mutateAsync(offerId);
      toast({ title: "Resolution accepted", description: "We'll apply this right away." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleAddInfo = async () => {
    if (!addInfoNote.trim()) return;
    try {
      await actions.addCustomerInfo.mutateAsync(addInfoNote.trim());
      toast({ title: "Info added" });
      setAddInfoNote("");
      setShowAddInfo(false);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  // Build timeline from events
  const timelineItems = events.map((e) => ({
    id: e.id,
    label: formatEventType(e.event_type),
    detail: typeof e.metadata === "object" && e.metadata !== null
      ? (e.metadata as any).note || (e.metadata as any).summary || (e.metadata as any).reason || null
      : null,
    time: e.created_at,
    role: e.actor_role,
  }));

  return (
    <div className="p-4 pb-24 space-y-4 animate-fade-in">
      <Button variant="ghost" size="sm" className="gap-1 -ml-2" onClick={() => navigate("/customer/support/tickets")}>
        <ArrowLeft className="h-4 w-4" />
        Tickets
      </Button>

      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <TicketStatusChip status={ticket.status} />
          <span className="text-xs text-muted-foreground">
            {format(new Date(ticket.created_at), "MMM d, yyyy 'at' h:mm a")}
          </span>
        </div>
        <h1 className="text-h2 capitalize">
          {ticket.category ? (ticket.category as string).replace(/_/g, " ") : (ticket.ticket_type as string).replace(/_/g, " ")}
        </h1>
        {ticket.customer_note && (
          <p className="text-sm text-muted-foreground">{ticket.customer_note}</p>
        )}
      </div>

      {/* Resolution summary */}
      {ticket.resolution_summary && (
        <Card className="p-4 bg-success/5 border-success/20">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-success mb-1">What we decided</h3>
          <p className="text-sm">{ticket.resolution_summary}</p>
        </Card>
      )}

      {/* Accepted offer */}
      {acceptedOffer && (
        <ResolutionOfferCard offer={acceptedOffer} />
      )}

      {/* Pending offers */}
      {pendingOffers.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Available resolutions</h3>
          {pendingOffers.map((offer) => (
            <ResolutionOfferCard
              key={offer.id}
              offer={offer}
              onAccept={handleAcceptOffer}
              isPending={actions.acceptOffer.isPending}
            />
          ))}
        </section>
      )}

      {/* Timeline */}
      {timelineItems.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Activity</h3>
          <div className="space-y-2">
            {timelineItems.map((item) => (
              <div key={item.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="h-2 w-2 rounded-full bg-border mt-1.5" />
                  <div className="flex-1 w-px bg-border" />
                </div>
                <div className="pb-3 min-w-0">
                  <p className="text-sm">{item.label}</p>
                  {item.detail && (
                    <p className="text-xs text-muted-foreground mt-0.5">{item.detail}</p>
                  )}
                  <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {format(new Date(item.time), "MMM d, h:mm a")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Add info CTA */}
      {!isResolved && (
        <section className="space-y-3">
          {showAddInfo ? (
            <Card className="p-4 space-y-3">
              <Textarea
                value={addInfoNote}
                onChange={(e) => setAddInfoNote(e.target.value.slice(0, 500))}
                placeholder="Add more details…"
                rows={3}
                autoFocus
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{addInfoNote.length}/500</span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setShowAddInfo(false)}>Cancel</Button>
                  <Button
                    size="sm"
                    disabled={!addInfoNote.trim() || actions.addCustomerInfo.isPending}
                    onClick={handleAddInfo}
                  >
                    {actions.addCustomerInfo.isPending ? "Sending…" : "Send"}
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowAddInfo(true)}
            >
              <MessageSquarePlus className="h-4 w-4 mr-2" />
              Add more info
            </Button>
          )}
        </section>
      )}
    </div>
  );
}

function formatEventType(type: string): string {
  const map: Record<string, string> = {
    ticket_created: "Ticket submitted",
    offer_presented: "Resolution offered",
    offer_accepted: "Resolution accepted",
    customer_added_info: "You added more info",
    provider_acknowledged: "Provider acknowledged",
    provider_statement_added: "Provider responded",
    provider_review_requested: "Provider requested review",
    admin_resolved: "Resolved by support",
    admin_escalated: "Escalated for review",
    attachment_added: "File added",
    status_changed: "Status updated",
  };
  return map[type] ?? type.replace(/_/g, " ");
}
