import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSupportTicketDetail } from "@/hooks/useSupportTicketDetail";
import { useTicketActions } from "@/hooks/useTicketActions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { TicketStatusChip } from "@/components/support/TicketStatusChip";
import { ResolutionOfferCard } from "@/components/support/ResolutionOfferCard";
import { ArrowLeft, Clock, CheckCircle2, AlertTriangle, Shield } from "lucide-react";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";

export default function AdminSupportTicketDetail() {
  const { ticketId } = useParams<{ ticketId: string }>();
  const navigate = useNavigate();
  const { ticket, offers, events, attachments, isLoading } = useSupportTicketDetail(ticketId);
  const actions = useTicketActions(ticketId ?? "");

  const [resolveSummary, setResolveSummary] = useState("");
  const [resolveReason, setResolveReason] = useState("");
  const [escalateReason, setEscalateReason] = useState("");
  const [showResolve, setShowResolve] = useState(false);
  const [showEscalate, setShowEscalate] = useState(false);

  if (isLoading) {
    return (
      <div className="p-6 max-w-3xl">
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
      <div className="p-6 max-w-3xl text-center">
        <p className="text-sm text-muted-foreground">Ticket not found.</p>
        <Button variant="link" onClick={() => navigate("/admin/support")}>← Back to support</Button>
      </div>
    );
  }

  const isResolved = ["resolved", "closed"].includes(ticket.status);
  const isCritical = ticket.severity === "critical" || ticket.severity === "high";

  const handleResolve = async () => {
    if (!resolveSummary.trim() || !resolveReason.trim()) return;
    try {
      await actions.adminResolve.mutateAsync({ summary: resolveSummary.trim(), reason: resolveReason.trim() });
      toast({ title: "Ticket resolved" });
      setShowResolve(false);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleEscalate = async () => {
    if (!escalateReason.trim()) return;
    try {
      await actions.adminEscalate.mutateAsync(escalateReason.trim());
      toast({ title: "Ticket escalated" });
      setShowEscalate(false);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="p-6 max-w-3xl space-y-4 animate-fade-in">
      <Button variant="ghost" size="sm" className="gap-1 -ml-2" onClick={() => navigate("/admin/support")}>
        <ArrowLeft className="h-4 w-4" />
        Support Console
      </Button>

      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <TicketStatusChip status={ticket.status} />
          {isCritical && <AlertTriangle className="h-4 w-4 text-destructive" />}
          <span className="text-xs text-muted-foreground">
            {format(new Date(ticket.created_at), "MMM d, yyyy 'at' h:mm a")}
          </span>
        </div>
        <h1 className="text-h2 capitalize">
          {ticket.category ? (ticket.category as string).replace(/_/g, " ") : (ticket.ticket_type as string).replace(/_/g, " ")}
        </h1>
      </div>

      {/* Key info grid */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-3">
          <p className="text-xs text-muted-foreground">Type</p>
          <p className="text-sm font-medium capitalize">{(ticket.ticket_type as string).replace(/_/g, " ")}</p>
        </Card>
        <Card className="p-3">
          <p className="text-xs text-muted-foreground">Severity</p>
          <p className="text-sm font-medium capitalize">{ticket.severity as string}</p>
        </Card>
        {ticket.sla_due_at && (
          <Card className="p-3 col-span-2">
            <p className="text-xs text-muted-foreground">SLA Due</p>
            <p className="text-sm font-medium">{format(new Date(ticket.sla_due_at), "MMM d, h:mm a")}</p>
          </Card>
        )}
      </div>

      {/* Customer note */}
      <Card className="p-4 space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Customer's note</h3>
        <p className="text-sm">{ticket.customer_note || "No details provided."}</p>
      </Card>

      {/* AI summary */}
      {ticket.ai_summary && (
        <Card className="p-4 space-y-2 border-accent/20 bg-accent/5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-accent flex items-center gap-1">
            <Shield className="h-3.5 w-3.5" /> AI Summary
          </h3>
          <p className="text-sm">{ticket.ai_summary}</p>
          <div className="flex gap-4 text-xs text-muted-foreground">
            {ticket.ai_evidence_score != null && <span>Evidence: {ticket.ai_evidence_score}/100</span>}
            {ticket.ai_risk_score != null && <span>Risk: {ticket.ai_risk_score}/100</span>}
          </div>
        </Card>
      )}

      {/* Resolution summary */}
      {ticket.resolution_summary && (
        <Card className="p-4 bg-success/5 border-success/20">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-success mb-1">Resolution</h3>
          <p className="text-sm">{ticket.resolution_summary}</p>
        </Card>
      )}

      {/* Offers */}
      {offers.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Offers</h3>
          {offers.map((offer) => (
            <ResolutionOfferCard key={offer.id} offer={offer} />
          ))}
        </section>
      )}

      {/* Admin actions */}
      {!isResolved && (
        <section className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Actions</h3>

          {/* Resolve */}
          {showResolve ? (
            <Card className="p-4 space-y-3">
              <p className="text-sm font-medium">Resolve this ticket</p>
              <Textarea
                value={resolveSummary}
                onChange={(e) => setResolveSummary(e.target.value)}
                placeholder="Resolution summary (visible to customer)…"
                rows={2}
              />
              <Textarea
                value={resolveReason}
                onChange={(e) => setResolveReason(e.target.value)}
                placeholder="Internal reason code…"
                rows={1}
              />
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => setShowResolve(false)}>Cancel</Button>
                <Button
                  size="sm"
                  className="flex-1"
                  disabled={!resolveSummary.trim() || !resolveReason.trim() || actions.adminResolve.isPending}
                  onClick={handleResolve}
                >
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                  {actions.adminResolve.isPending ? "Resolving…" : "Resolve"}
                </Button>
              </div>
            </Card>
          ) : (
            <Button variant="outline" className="w-full" onClick={() => setShowResolve(true)}>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Resolve ticket
            </Button>
          )}

          {/* Escalate */}
          {showEscalate ? (
            <Card className="p-4 space-y-3">
              <p className="text-sm font-medium">Escalate this ticket</p>
              <Textarea
                value={escalateReason}
                onChange={(e) => setEscalateReason(e.target.value)}
                placeholder="Why is this being escalated?…"
                rows={2}
              />
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => setShowEscalate(false)}>Cancel</Button>
                <Button
                  size="sm"
                  variant="destructive"
                  className="flex-1"
                  disabled={!escalateReason.trim() || actions.adminEscalate.isPending}
                  onClick={handleEscalate}
                >
                  {actions.adminEscalate.isPending ? "Escalating…" : "Escalate"}
                </Button>
              </div>
            </Card>
          ) : (
            <Button variant="outline" className="w-full text-destructive hover:text-destructive" onClick={() => setShowEscalate(true)}>
              <AlertTriangle className="h-4 w-4 mr-2" />
              Escalate
            </Button>
          )}
        </section>
      )}

      {/* Timeline */}
      {events.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Full timeline</h3>
          <div className="space-y-2">
            {events.map((e) => {
              const meta = e.metadata as Record<string, any> | null;
              return (
                <div key={e.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="h-2 w-2 rounded-full bg-border mt-1.5" />
                    <div className="flex-1 w-px bg-border" />
                  </div>
                  <div className="pb-3 min-w-0">
                    <p className="text-sm">{formatAdminEvent(e.event_type)}</p>
                    {e.actor_role && (
                      <span className="text-[10px] text-muted-foreground capitalize">{e.actor_role}</span>
                    )}
                    {meta?.note && <p className="text-xs text-muted-foreground mt-0.5">{meta.note}</p>}
                    {meta?.statement && <p className="text-xs text-muted-foreground mt-0.5">"{meta.statement}"</p>}
                    {meta?.reason && <p className="text-xs text-muted-foreground mt-0.5">Reason: {meta.reason}</p>}
                    <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {format(new Date(e.created_at), "MMM d, h:mm a")}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

function formatAdminEvent(type: string): string {
  const map: Record<string, string> = {
    ticket_created: "Ticket created",
    offer_presented: "Offer presented",
    offer_accepted: "Offer accepted by customer",
    customer_added_info: "Customer added info",
    provider_acknowledged: "Provider acknowledged",
    provider_statement_added: "Provider statement",
    provider_review_requested: "Provider requested review",
    admin_resolved: "Admin resolved",
    admin_escalated: "Admin escalated",
    attachment_added: "Attachment added",
    status_changed: "Status changed",
  };
  return map[type] ?? type.replace(/_/g, " ");
}
