import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  X, AlertTriangle, Clock, Zap, Check, ArrowUpRight, MessageSquare, RotateCcw,
  CalendarDays, MapPin, User, Truck,
} from "lucide-react";
import { format, formatDistanceToNow, differenceInHours } from "date-fns";
import { useOpsExceptionDetail, useOpsExceptionActions, useUpdateExceptionStatus } from "@/hooks/useOpsExceptions";
import { OpsActionDialog } from "./OpsActionDialog";
import { DecisionTraceCard } from "@/components/admin/DecisionTraceCard";
import { toast } from "sonner";

interface Props {
  exceptionId: string;
  onClose: () => void;
}

const SEVERITY_COLORS: Record<string, string> = {
  urgent: "text-destructive",
  soon: "text-amber-600",
  watch: "text-muted-foreground",
};

const TYPE_LABELS: Record<string, string> = {
  window_at_risk: "Window at Risk",
  service_week_at_risk: "Service Week at Risk",
  provider_overload: "Provider Overload",
  coverage_break: "Coverage Break",
  provider_unavailable: "Provider Unavailable",
  access_failure: "Access Failure",
  customer_reschedule: "Customer Reschedule",
  weather_safety: "Weather Safety",
  quality_block: "Quality Block",
};

const REPAIR_SUGGESTIONS: Record<string, string[]> = {
  window_at_risk: ["Reorder stops to fit window", "Swap to backup provider", "Extend window"],
  service_week_at_risk: ["Schedule visit for remaining days", "Move to next week with customer notification"],
  provider_overload: ["Move visits to backup provider", "Redistribute across adjacent days"],
  coverage_break: ["Assign backup provider", "Recruit new provider for zone"],
  access_failure: ["Confirm reschedule hold with customer", "Send crew back later today"],
  customer_reschedule: ["Offer appointment windows", "Apply to next available date"],
  weather_safety: ["Batch reschedule affected zone", "Issue weather credit"],
  quality_block: ["Schedule redo visit", "Issue quality credit", "Flag provider for review"],
  provider_unavailable: ["Assign backup provider", "Contact provider for ETA"],
};

export function OpsExceptionDetailPanel({ exceptionId, onClose }: Props) {
  const { data: exception, isLoading } = useOpsExceptionDetail(exceptionId);
  const { data: actions } = useOpsExceptionActions(exceptionId);
  const updateStatus = useUpdateExceptionStatus();
  const [actionDialogOpen, setActionDialogOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!exception) return null;

  const visit = exception.visits;
  const zone = exception.zones;
  const provider = exception.provider_orgs;
  const slaHoursLeft = exception.sla_target_at
    ? differenceInHours(new Date(exception.sla_target_at), new Date())
    : null;
  const isResolved = exception.status === "resolved";
  const suggestions = REPAIR_SUGGESTIONS[exception.exception_type] ?? [];

  const handleStatusChange = async (status: "acknowledged" | "in_progress" | "escalated" | "resolved" | "snoozed", resolutionNote?: string) => {
    try {
      await updateStatus.mutateAsync({
        exceptionId: exception.id,
        status,
        resolutionType: status === "resolved" ? "manual" : undefined,
        resolutionNote,
      });
      toast.success(`Exception ${status}`);
    } catch {
      toast.error("Failed to update status");
    }
  };

  return (
    <div className="p-4 space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold">
              {TYPE_LABELS[exception.exception_type] ?? exception.exception_type}
            </h2>
            <Badge variant={exception.severity === "urgent" ? "destructive" : exception.severity === "soon" ? "default" : "secondary"}>
              {exception.severity}
            </Badge>
            <Badge variant="outline">{exception.status}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">{exception.reason_summary}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* SLA Bar */}
      {slaHoursLeft !== null && !isResolved && (
        <div className={`flex items-center gap-2 p-2 rounded-md text-sm ${
          slaHoursLeft < 0 ? "bg-destructive/10 text-destructive" :
          slaHoursLeft <= 2 ? "bg-amber-50 text-amber-700" :
          "bg-muted text-muted-foreground"
        }`}>
          <Clock className="h-4 w-4" />
          {slaHoursLeft < 0
            ? `SLA breached ${Math.abs(slaHoursLeft)}h ago`
            : `SLA target: ${slaHoursLeft}h remaining (${format(new Date(exception.sla_target_at!), "MMM d, HH:mm")})`
          }
        </div>
      )}

      {/* Context Cards */}
      <div className="grid grid-cols-2 gap-2">
        {visit?.scheduled_date && (
          <Card className="p-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <CalendarDays className="h-3 w-3" /> Visit
            </div>
            <p className="text-sm font-medium">{visit.scheduled_date}</p>
            <p className="text-xs text-muted-foreground">{visit.schedule_state}</p>
          </Card>
        )}
        {zone?.name && (
          <Card className="p-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <MapPin className="h-3 w-3" /> Zone
            </div>
            <p className="text-sm font-medium">{zone.name}</p>
          </Card>
        )}
        {provider?.name && (
          <Card className="p-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Truck className="h-3 w-3" /> Provider
            </div>
            <p className="text-sm font-medium">{provider.name}</p>
          </Card>
        )}
        {exception.customer_id && (
          <Card className="p-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <User className="h-3 w-3" /> Customer
            </div>
            <p className="text-sm font-mono text-xs truncate">{exception.customer_id}</p>
          </Card>
        )}
      </div>

      {/* Reason Details */}
      {exception.reason_details && Object.keys(exception.reason_details as object).length > 0 && (
        <Card>
          <CardHeader className="py-2 px-3">
            <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">Details</CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <pre className="text-xs bg-muted p-2 rounded overflow-x-auto whitespace-pre-wrap max-h-32">
              {JSON.stringify(exception.reason_details, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* Repair Suggestions */}
      {!isResolved && suggestions.length > 0 && (
        <Card>
          <CardHeader className="py-2 px-3">
            <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">Suggested Repairs</CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3 space-y-1">
            {suggestions.map((s, i) => (
              <div key={i} className="flex items-center gap-2 text-sm p-1.5 rounded hover:bg-muted/50">
                <ArrowUpRight className="h-3 w-3 text-primary shrink-0" />
                <span>{s}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      {!isResolved && (
        <div className="flex gap-2 flex-wrap">
          {exception.status === "open" && (
            <Button size="sm" variant="outline" onClick={() => handleStatusChange("acknowledged")}>
              <Check className="h-3 w-3 mr-1" /> Acknowledge
            </Button>
          )}
          {(exception.status === "open" || exception.status === "acknowledged") && (
            <Button size="sm" variant="outline" onClick={() => handleStatusChange("in_progress")}>
              <RotateCcw className="h-3 w-3 mr-1" /> Start Work
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={() => handleStatusChange("escalated")}>
            <AlertTriangle className="h-3 w-3 mr-1" /> Escalate
          </Button>
          <Button size="sm" onClick={() => setActionDialogOpen(true)}>
            <MessageSquare className="h-3 w-3 mr-1" /> Record Action
          </Button>
          <Button size="sm" variant="default" onClick={() => handleStatusChange("resolved", "Manually resolved by ops")}>
            <Check className="h-3 w-3 mr-1" /> Resolve
          </Button>
        </div>
      )}

      <Separator />

      {/* Actions History */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Actions History</h3>
        {(!actions || actions.length === 0) ? (
          <p className="text-xs text-muted-foreground py-2">No actions recorded yet.</p>
        ) : (
          <div className="space-y-2">
            {actions.map((action) => (
              <Card key={action.id} className="p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="text-[10px]">{action.action_type}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(action.created_at), { addSuffix: true })}
                  </span>
                  {action.is_freeze_override && (
                    <Badge variant="destructive" className="text-[10px]">Freeze Override</Badge>
                  )}
                  {action.is_undone && (
                    <Badge variant="secondary" className="text-[10px]">Undone</Badge>
                  )}
                </div>
                <p className="text-xs">{action.reason_code}{action.reason_note ? ` — ${action.reason_note}` : ""}</p>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Decision Traces */}
      <DecisionTraceCard entityType="ops_exception" entityId={exceptionId} />

      {/* Action Dialog */}
      <OpsActionDialog
        open={actionDialogOpen}
        onOpenChange={setActionDialogOpen}
        exceptionId={exceptionId}
        exceptionType={exception.exception_type}
      />
    </div>
  );
}
