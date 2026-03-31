import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, Clock, Shield, Zap } from "lucide-react";
import { formatDistanceToNow, differenceInHours } from "date-fns";
import type { OpsExceptionFilters, OpsExceptionWithRelations } from "@/hooks/useOpsExceptions";

interface Props {
  exceptions: OpsExceptionWithRelations[];
  filters: OpsExceptionFilters;
  onFilterChange: (f: OpsExceptionFilters) => void;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

const SEVERITY_CONFIG = {
  urgent: { label: "Urgent", icon: Zap, variant: "destructive" as const, color: "text-destructive" },
  soon: { label: "Soon", icon: AlertTriangle, variant: "default" as const, color: "text-amber-600" },
  watch: { label: "Watch", icon: Clock, variant: "secondary" as const, color: "text-muted-foreground" },
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
  payment_failed: "Payment Failed",
  payment_past_due: "Payment Past Due",
  payout_failed: "Payout Failed",
  dispute_opened: "Dispute Opened",
  earnings_held: "Earnings Held",
  reconciliation_mismatch: "Reconciliation Mismatch",
};

function SlaCountdown({ slaTargetAt }: { slaTargetAt: string | null }) {
  if (!slaTargetAt) return null;
  const hoursLeft = differenceInHours(new Date(slaTargetAt), new Date());
  const isBreached = hoursLeft < 0;
  const isCritical = hoursLeft >= 0 && hoursLeft <= 2;

  return (
    <span className={`text-xs font-mono ${isBreached ? "text-destructive font-bold" : isCritical ? "text-amber-600 font-semibold" : "text-muted-foreground"}`}>
      {isBreached ? `SLA breached ${Math.abs(hoursLeft)}h ago` : `${hoursLeft}h left`}
    </span>
  );
}

export function OpsExceptionQueue({ exceptions, filters, onFilterChange, selectedId, onSelect }: Props) {
  return (
    <div className="p-4 space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-bold">Ops Console</h1>
          <Badge variant="outline" className="text-xs">{exceptions.length}</Badge>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <Select value={filters.domain ?? "all"} onValueChange={(v) => onFilterChange({ ...filters, domain: v as any })}>
          <SelectTrigger className="w-[120px] h-8 text-xs">
            <SelectValue placeholder="Domain" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Domains</SelectItem>
            <SelectItem value="ops">Ops</SelectItem>
            <SelectItem value="billing">Billing</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.severity ?? "all"} onValueChange={(v) => onFilterChange({ ...filters, severity: v as any })}>
          <SelectTrigger className="w-[130px] h-8 text-xs">
            <SelectValue placeholder="Severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severity</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
            <SelectItem value="soon">Soon</SelectItem>
            <SelectItem value="watch">Watch</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.exception_type ?? "all"} onValueChange={(v) => onFilterChange({ ...filters, exception_type: v as any })}>
          <SelectTrigger className="w-[170px] h-8 text-xs">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {Object.entries(TYPE_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.status ?? "all"} onValueChange={(v) => onFilterChange({ ...filters, status: v as any })}>
          <SelectTrigger className="w-[140px] h-8 text-xs">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Active</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="acknowledged">Acknowledged</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="escalated">Escalated</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="snoozed">Snoozed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Exception list */}
      {exceptions.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-16">No exceptions matching filters. 🎉</p>
      ) : (
        <div className="space-y-1">
          {exceptions.map((ex) => {
            const sev = SEVERITY_CONFIG[ex.severity] ?? SEVERITY_CONFIG.watch;
            const SevIcon = sev.icon;
            const isSelected = ex.id === selectedId;

            return (
              <button
                key={ex.id}
                onClick={() => onSelect(ex.id)}
                className={`w-full text-left p-3 rounded-lg border transition-colors ${
                  isSelected
                    ? "bg-primary/5 border-primary/30"
                    : "bg-card hover:bg-muted/30 border-transparent"
                }`}
              >
                <div className="flex items-start gap-2">
                  <SevIcon className={`h-4 w-4 mt-0.5 shrink-0 ${sev.color}`} />
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold truncate">
                        {TYPE_LABELS[ex.exception_type] ?? ex.exception_type}
                      </span>
                      <Badge variant={sev.variant} className="text-[10px] shrink-0">
                        {sev.label}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] shrink-0">
                        {ex.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {ex.reason_summary}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {ex.zone_name && <span>{ex.zone_name}</span>}
                      {ex.visit_scheduled_date && <span>{ex.visit_scheduled_date}</span>}
                      {ex.provider_org_name && <span>{ex.provider_org_name}</span>}
                      <SlaCountdown slaTargetAt={ex.sla_target_at} />
                      <span className="ml-auto">{formatDistanceToNow(new Date(ex.created_at), { addSuffix: true })}</span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
