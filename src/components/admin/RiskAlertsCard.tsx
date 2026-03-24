import { useBusinessHealth } from "@/hooks/useBusinessHealth";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface RiskAlert {
  id: string;
  severity: "warning" | "critical";
  title: string;
  detail: string;
  action: string;
  href: string;
}

export function RiskAlertsCard() {
  const { data: health, isLoading } = useBusinessHealth();
  const navigate = useNavigate();

  if (isLoading || !health) return null;

  const alerts: RiskAlert[] = [];

  // Attach rate below 1.5 — operating model critical threshold
  if (health.attachRate < 1.5) {
    alerts.push({
      id: "attach-critical",
      severity: "critical",
      title: "Attach rate below minimum",
      detail: `${health.attachRate} SKUs/household — target is ≥ 1.5 at 90 days, ≥ 2.0 at scale`,
      action: "Review plans & bundles",
      href: "/admin/plans",
    });
  } else if (health.attachRate < 2.0) {
    alerts.push({
      id: "attach-warning",
      severity: "warning",
      title: "Attach rate below target",
      detail: `${health.attachRate} SKUs/household — target is ≥ 2.0`,
      action: "Review plans & bundles",
      href: "/admin/plans",
    });
  }

  // Household churn > 4% — critical; > 2% — warning
  if (health.householdChurnPct > 4) {
    alerts.push({
      id: "churn-critical",
      severity: "critical",
      title: "Household churn exceeds threshold",
      detail: `${health.householdChurnPct}% monthly churn — target is < 2%`,
      action: "Review cancellations",
      href: "/admin/subscriptions",
    });
  } else if (health.householdChurnPct >= 2) {
    alerts.push({
      id: "churn-warning",
      severity: "warning",
      title: "Household churn above target",
      detail: `${health.householdChurnPct}% monthly churn — target is < 2%`,
      action: "Review cancellations",
      href: "/admin/subscriptions",
    });
  }

  // Provider churn > 20% annualized — critical threshold per operating model
  if (health.providerChurnPct > 20) {
    alerts.push({
      id: "provider-churn",
      severity: "critical",
      title: "Provider churn exceeds 20% annualized",
      detail: `${health.providerChurnPct}% annualized — triggers mandatory retention review`,
      action: "Review providers",
      href: "/admin/providers",
    });
  } else if (health.providerChurnPct >= 15) {
    alerts.push({
      id: "provider-churn-warning",
      severity: "warning",
      title: "Provider churn approaching threshold",
      detail: `${health.providerChurnPct}% annualized — threshold is 20%`,
      action: "Review providers",
      href: "/admin/providers",
    });
  }

  // Zones below minimum density (<10 hh) — potential wind-down candidates
  if (health.zonesBelowMinimum > 0) {
    const zoneNames = health.zoneDensity
      .filter((z) => z.band === "critical")
      .slice(0, 3)
      .map((z) => z.zoneName)
      .join(", ");
    alerts.push({
      id: "zone-density",
      severity: health.zonesBelowMinimum >= 3 ? "critical" : "warning",
      title: `${health.zonesBelowMinimum} zone${health.zonesBelowMinimum > 1 ? "s" : ""} below minimum density`,
      detail: `${zoneNames}${health.zonesBelowMinimum > 3 ? ` + ${health.zonesBelowMinimum - 3} more` : ""} — zones < 10 households risk wind-down after 6 months`,
      action: "View zone health",
      href: "/admin/ops/zones",
    });
  }

  if (alerts.length === 0) {
    return (
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-success/10 shrink-0">
            <CheckCircle className="h-4 w-4 text-success" />
          </div>
          <div>
            <p className="text-sm font-semibold">No Risk Alerts</p>
            <p className="text-xs text-muted-foreground">All operating model thresholds are within target.</p>
          </div>
        </div>
      </Card>
    );
  }

  const criticalCount = alerts.filter((a) => a.severity === "critical").length;

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className={`h-4 w-4 ${criticalCount > 0 ? "text-destructive" : "text-warning"}`} />
          <h2 className="text-sm font-semibold">Risk Alerts</h2>
        </div>
        <Badge
          variant="outline"
          className={criticalCount > 0 ? "text-destructive border-destructive/30" : "text-warning border-warning/30"}
        >
          {alerts.length} alert{alerts.length > 1 ? "s" : ""}
        </Badge>
      </div>

      <div className="space-y-2">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={`rounded-lg border p-3 cursor-pointer hover:shadow-sm transition-shadow ${
              alert.severity === "critical"
                ? "border-destructive/30 bg-destructive/5"
                : "border-warning/30 bg-warning/5"
            }`}
            onClick={() => navigate(alert.href)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); navigate(alert.href); } }}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${
                  alert.severity === "critical" ? "text-destructive" : "text-warning"
                }`}>
                  {alert.title}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{alert.detail}</p>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                <span>{alert.action}</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
