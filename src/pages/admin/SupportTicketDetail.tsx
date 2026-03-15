import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSupportTicketDetail } from "@/hooks/useSupportTicketDetail";
import { useTicketActions } from "@/hooks/useTicketActions";
import { useSupportMacros } from "@/hooks/useSupportMacros";
import { useSupportAiClassify } from "@/hooks/useSupportAiClassify";
import { AiInsightsCard } from "@/components/support/AiInsightsCard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TicketStatusChip } from "@/components/support/TicketStatusChip";
import { ResolutionOfferCard } from "@/components/support/ResolutionOfferCard";
import { ChevronLeft, Clock, CheckCircle2, AlertTriangle, Shield, Send, Wand2, RefreshCw, ArrowRightLeft } from "lucide-react";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

const OFFER_TYPES = [
  { value: "credit", label: "Credit" },
  { value: "redo_intent", label: "Redo service" },
  { value: "addon", label: "Add-on" },
  { value: "refund", label: "Refund" },
  { value: "plan_change", label: "Plan change" },
  { value: "review_by_time", label: "Review by time" },
  { value: "no_action", label: "No action needed" },
];

const STATUS_OPTIONS = [
  { value: "open", label: "Open" },
  { value: "awaiting_provider", label: "Awaiting provider" },
  { value: "awaiting_customer", label: "Awaiting customer" },
  { value: "in_review", label: "In review" },
  { value: "escalated", label: "Escalated" },
];

export default function AdminSupportTicketDetail() {
  const { ticketId } = useParams<{ ticketId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { ticket, offers, events, attachments, isLoading } = useSupportTicketDetail(ticketId);
  const actions = useTicketActions(ticketId ?? "");
  const { macros } = useSupportMacros();
  const aiClassify = useSupportAiClassify();

  const [resolveSummary, setResolveSummary] = useState("");
  const [resolveReason, setResolveReason] = useState("");
  const [escalateReason, setEscalateReason] = useState("");
  const [showResolve, setShowResolve] = useState(false);
  const [showEscalate, setShowEscalate] = useState(false);

  // P8: Present offer state
  const [showOffer, setShowOffer] = useState(false);
  const [offerType, setOfferType] = useState("");
  const [offerAmount, setOfferAmount] = useState("");
  const [offerDescription, setOfferDescription] = useState("");

  if (isLoading) {
    return (
      <div className="animate-fade-in p-6 max-w-3xl">
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

  // P8: Present offer
  const handlePresentOffer = async () => {
    if (!offerType) return;
    try {
      await actions.adminPresentOffer.mutateAsync({
        offer_type: offerType,
        amount_cents: offerAmount ? Math.round(parseFloat(offerAmount) * 100) : undefined,
        description: offerDescription.trim() || undefined,
      });
      toast({ title: "Offer presented to customer" });
      setShowOffer(false);
      setOfferType("");
      setOfferAmount("");
      setOfferDescription("");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  // P9: Apply macro
  const handleApplyMacro = async (macroId: string) => {
    const macro = macros.find((m) => m.id === macroId);
    if (!macro) return;
    try {
      const patch = macro.patch as Record<string, any>;
      await actions.adminPresentOffer.mutateAsync({
        offer_type: patch.offer_type ?? "credit",
        amount_cents: patch.amount_cents,
        description: patch.description ?? macro.name,
      });
      toast({ title: `Macro "${macro.name}" applied` });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  // P10: Re-classify
  const handleReclassify = async () => {
    if (!ticketId) return;
    try {
      await aiClassify.mutateAsync(ticketId);
      queryClient.invalidateQueries({ queryKey: ["support-ticket", ticketId] });
      toast({ title: "AI re-classification complete" });
    } catch (err: any) {
      toast({ title: "AI classification failed", description: err.message, variant: "destructive" });
    }
  };

  // P11: Change status
  const handleStatusChange = async (newStatus: string) => {
    try {
      await actions.adminChangeStatus.mutateAsync(newStatus);
      toast({ title: `Status changed to ${newStatus.replace(/_/g, " ")}` });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const showAmountField = ["credit", "refund"].includes(offerType);
  const activeMacros = macros.filter((m) => m.is_active);

  return (
    <div className="p-6 max-w-3xl space-y-4 animate-fade-in">
      <Button variant="ghost" size="icon" className="-ml-2" onClick={() => navigate("/admin/support")} aria-label="Back to support">
        <ChevronLeft className="h-5 w-5" />
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
          <Card className={`p-3 col-span-2 ${new Date(ticket.sla_due_at) < new Date() ? "border-destructive/50 bg-destructive/5" : ""}`}>
            <p className="text-xs text-muted-foreground">SLA Due</p>
            <p className="text-sm font-medium">
              {format(new Date(ticket.sla_due_at), "MMM d, h:mm a")}
              {new Date(ticket.sla_due_at) < new Date() && <span className="text-destructive ml-2 text-xs font-semibold">BREACHED</span>}
            </p>
          </Card>
        )}
      </div>

      {/* P11: Status change dropdown */}
      {!isResolved && (
        <div className="flex items-center gap-2">
          <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
          <Select onValueChange={handleStatusChange} value="">
            <SelectTrigger className="w-48 h-8 text-xs">
              <SelectValue placeholder="Change status…" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.filter((s) => s.value !== ticket.status).map((s) => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* P10: Re-classify button */}
          <Button
            variant="outline"
            size="sm"
            className="gap-1 text-xs"
            onClick={handleReclassify}
            disabled={aiClassify.isPending}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${aiClassify.isPending ? "animate-spin" : ""}`} />
            {aiClassify.isPending ? "Classifying…" : "Re-classify AI"}
          </Button>
        </div>
      )}

      {/* Customer note */}
      <Card className="p-4 space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Customer's note</h3>
        <p className="text-sm">{ticket.customer_note || "No details provided."}</p>
      </Card>

      {/* AI Insights Card (C3) */}
      <AiInsightsCard ticket={{
        id: ticket.id,
        ai_classification: ticket.ai_classification as Record<string, any> | null,
        ai_summary: ticket.ai_summary as string | null,
        ai_evidence_score: ticket.ai_evidence_score as number | null,
        ai_risk_score: ticket.ai_risk_score as number | null,
        status: ticket.status as string,
      }} />

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

          {/* P8: Present offer */}
          {showOffer ? (
            <Card className="p-4 space-y-3">
              <p className="text-sm font-medium">Present resolution offer</p>
              <Select value={offerType} onValueChange={setOfferType}>
                <SelectTrigger>
                  <SelectValue placeholder="Offer type" />
                </SelectTrigger>
                <SelectContent>
                  {OFFER_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {showAmountField && (
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={offerAmount}
                  onChange={(e) => setOfferAmount(e.target.value)}
                  placeholder="Amount ($)"
                />
              )}
              <Textarea
                value={offerDescription}
                onChange={(e) => setOfferDescription(e.target.value)}
                placeholder="Description (visible to customer)…"
                rows={2}
              />
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => setShowOffer(false)}>Cancel</Button>
                <Button
                  size="sm"
                  className="flex-1"
                  disabled={!offerType || actions.adminPresentOffer.isPending}
                  onClick={handlePresentOffer}
                >
                  <Send className="h-3.5 w-3.5 mr-1" />
                  {actions.adminPresentOffer.isPending ? "Sending…" : "Present offer"}
                </Button>
              </div>
            </Card>
          ) : (
            <Button variant="outline" className="w-full" onClick={() => setShowOffer(true)}>
              <Send className="h-4 w-4 mr-2" />
              Present offer
            </Button>
          )}

          {/* P9: Apply macro */}
          {activeMacros.length > 0 && (
            <div className="flex items-center gap-2">
              <Wand2 className="h-4 w-4 text-muted-foreground" />
              <Select onValueChange={handleApplyMacro} value="">
                <SelectTrigger className="flex-1 h-9">
                  <SelectValue placeholder="Apply macro…" />
                </SelectTrigger>
                <SelectContent>
                  {activeMacros.map((m) => (
                    <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

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
                    {meta?.new_status && <p className="text-xs text-muted-foreground mt-0.5">→ {meta.new_status.replace(/_/g, " ")}</p>}
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
    macro_applied: "Macro applied",
  };
  return map[type] ?? type.replace(/_/g, " ");
}
