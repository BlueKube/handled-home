import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSupportTicketDetail } from "@/hooks/useSupportTicketDetail";
import { useTicketActions } from "@/hooks/useTicketActions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TicketStatusChip } from "@/components/support/TicketStatusChip";
import { ArrowLeft, CheckCircle2, Clock, FileText, Send } from "lucide-react";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";

const REVIEW_REASONS = [
  { value: "incorrect_claim", label: "Claim is inaccurate" },
  { value: "work_completed", label: "Work was completed as described" },
  { value: "pre_existing", label: "Pre-existing condition" },
  { value: "weather_related", label: "Weather prevented completion" },
  { value: "access_issue", label: "Could not access property" },
  { value: "other", label: "Other reason" },
];

export default function ProviderSupportTicketDetail() {
  const { ticketId } = useParams<{ ticketId: string }>();
  const navigate = useNavigate();
  const { ticket, events, isLoading } = useSupportTicketDetail(ticketId);
  const actions = useTicketActions(ticketId ?? "");

  const [statement, setStatement] = useState("");
  const [reviewReason, setReviewReason] = useState("");
  const [showStatement, setShowStatement] = useState(false);
  const [showReview, setShowReview] = useState(false);

  if (isLoading) {
    return (
      <div className="p-6 max-w-2xl">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-muted/50 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="p-6 max-w-2xl text-center">
        <p className="text-sm text-muted-foreground">Ticket not found.</p>
        <Button variant="link" onClick={() => navigate("/provider/support")}>← Back to support</Button>
      </div>
    );
  }

  const isResolved = ["resolved", "closed"].includes(ticket.status);
  const isAwaitingProvider = ticket.status === "awaiting_provider";

  const handleAcknowledge = async () => {
    try {
      await actions.providerAcknowledge.mutateAsync();
      toast({ title: "Acknowledged" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleStatement = async () => {
    if (!statement.trim()) return;
    try {
      await actions.providerStatement.mutateAsync(statement.trim());
      toast({ title: "Statement submitted" });
      setStatement("");
      setShowStatement(false);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleRequestReview = async () => {
    if (!reviewReason) return;
    try {
      await actions.providerRequestReview.mutateAsync(reviewReason);
      toast({ title: "Review requested" });
      setReviewReason("");
      setShowReview(false);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="p-6 max-w-2xl space-y-4 animate-fade-in">
      <Button variant="ghost" size="sm" className="gap-1 -ml-2" onClick={() => navigate("/provider/support")}>
        <ArrowLeft className="h-4 w-4" />
        Support
      </Button>

      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <TicketStatusChip status={ticket.status} />
          <span className="text-xs text-muted-foreground">
            {format(new Date(ticket.created_at), "MMM d, yyyy")}
          </span>
        </div>
        <h1 className="text-h2 capitalize">
          {ticket.category ? (ticket.category as string).replace(/_/g, " ") : (ticket.ticket_type as string).replace(/_/g, " ")}
        </h1>
      </div>

      {/* Claim details */}
      <Card className="p-4 space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Customer's claim</h3>
        <p className="text-sm">{ticket.customer_note || "No details provided."}</p>
        <p className="text-xs text-muted-foreground capitalize">
          Severity: {ticket.severity as string}
        </p>
      </Card>

      {/* Resolution summary */}
      {ticket.resolution_summary && (
        <Card className="p-4 bg-success/5 border-success/20">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-success mb-1">Resolution</h3>
          <p className="text-sm">{ticket.resolution_summary}</p>
        </Card>
      )}

      {/* Provider actions */}
      {!isResolved && (
        <section className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Your actions</h3>

          {isAwaitingProvider && (
            <Button
              variant="outline"
              className="w-full"
              onClick={handleAcknowledge}
              disabled={actions.providerAcknowledge.isPending}
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              {actions.providerAcknowledge.isPending ? "Acknowledging…" : "Acknowledge claim"}
            </Button>
          )}

          {/* Statement */}
          {showStatement ? (
            <Card className="p-4 space-y-3">
              <Textarea
                value={statement}
                onChange={(e) => setStatement(e.target.value.slice(0, 300))}
                placeholder="Your statement…"
                rows={3}
                autoFocus
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{statement.length}/300</span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setShowStatement(false)}>Cancel</Button>
                  <Button
                    size="sm"
                    disabled={!statement.trim() || actions.providerStatement.isPending}
                    onClick={handleStatement}
                  >
                    <Send className="h-3.5 w-3.5 mr-1" />
                    {actions.providerStatement.isPending ? "Sending…" : "Send"}
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <Button variant="outline" className="w-full" onClick={() => setShowStatement(true)}>
              <FileText className="h-4 w-4 mr-2" />
              Add statement
            </Button>
          )}

          {/* Request review */}
          {showReview ? (
            <Card className="p-4 space-y-3">
              <p className="text-sm font-medium">Why should this be reviewed?</p>
              <Select value={reviewReason} onValueChange={setReviewReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  {REVIEW_REASONS.map((r) => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => setShowReview(false)}>Cancel</Button>
                <Button
                  size="sm"
                  className="flex-1"
                  disabled={!reviewReason || actions.providerRequestReview.isPending}
                  onClick={handleRequestReview}
                >
                  {actions.providerRequestReview.isPending ? "Requesting…" : "Request review"}
                </Button>
              </div>
            </Card>
          ) : (
            <Button variant="outline" className="w-full" onClick={() => setShowReview(true)}>
              Request review
            </Button>
          )}
        </section>
      )}

      {/* Timeline */}
      {events.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Activity</h3>
          <div className="space-y-2">
            {events.map((e) => (
              <div key={e.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="h-2 w-2 rounded-full bg-border mt-1.5" />
                  <div className="flex-1 w-px bg-border" />
                </div>
                <div className="pb-3 min-w-0">
                  <p className="text-sm">{formatEventLabel(e.event_type)}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {format(new Date(e.created_at), "MMM d, h:mm a")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function formatEventLabel(type: string): string {
  const map: Record<string, string> = {
    ticket_created: "Customer submitted ticket",
    offer_presented: "Resolution offered to customer",
    offer_accepted: "Customer accepted resolution",
    customer_added_info: "Customer added info",
    provider_acknowledged: "You acknowledged the claim",
    provider_statement_added: "You submitted a statement",
    provider_review_requested: "You requested review",
    admin_resolved: "Resolved by support",
    admin_escalated: "Escalated for review",
  };
  return map[type] ?? type.replace(/_/g, " ");
}
