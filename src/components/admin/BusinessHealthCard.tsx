import { useBusinessHealth } from "@/hooks/useBusinessHealth";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity, Users, UserMinus, MapPin } from "lucide-react";

type Status = "success" | "warning" | "critical";

function statusColor(s: Status) {
  return s === "success"
    ? "text-success"
    : s === "warning"
      ? "text-warning"
      : "text-destructive";
}

function statusBg(s: Status) {
  return s === "success"
    ? "bg-success/10"
    : s === "warning"
      ? "bg-warning/10"
      : "bg-destructive/10";
}

function statusBadge(s: Status) {
  return s === "success"
    ? "bg-success/20 text-success border-success/30"
    : s === "warning"
      ? "bg-warning/20 text-warning border-warning/30"
      : "bg-destructive/20 text-destructive border-destructive/30";
}

function getAttachStatus(rate: number): Status {
  if (rate >= 2.0) return "success";
  if (rate >= 1.5) return "warning";
  return "critical";
}

function getChurnStatus(pct: number): Status {
  if (pct < 2) return "success";
  if (pct <= 4) return "warning";
  return "critical";
}

function getProviderChurnStatus(pct: number): Status {
  if (pct < 15) return "success";
  if (pct <= 20) return "warning";
  return "critical";
}

interface GaugeProps {
  icon: React.ElementType;
  label: string;
  value: string;
  target: string;
  status: Status;
}

function Gauge({ icon: Icon, label, value, target, status }: GaugeProps) {
  return (
    <div className="flex items-start gap-3">
      <div className={`flex h-9 w-9 items-center justify-center rounded-lg shrink-0 ${statusBg(status)}`}>
        <Icon className={`h-4 w-4 ${statusColor(status)}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <div className="flex items-baseline gap-2">
          <span className={`text-lg font-bold ${statusColor(status)}`}>{value}</span>
          <span className="text-[10px] text-muted-foreground">target: {target}</span>
        </div>
      </div>
    </div>
  );
}

export function BusinessHealthCard() {
  const { data: health, isLoading } = useBusinessHealth();

  if (isLoading) {
    return (
      <Card className="p-4 space-y-4">
        <Skeleton className="h-5 w-36" />
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-16 rounded-lg" />
          ))}
        </div>
      </Card>
    );
  }

  if (!health) return null;

  const attachStatus = getAttachStatus(health.attachRate);
  const churnStatus = getChurnStatus(health.householdChurnPct);
  const providerChurnStatus = getProviderChurnStatus(health.providerChurnPct);

  const zoneBands = {
    critical: health.zoneDensity.filter((z) => z.band === "critical").length,
    seeding: health.zoneDensity.filter((z) => z.band === "seeding").length,
    growing: health.zoneDensity.filter((z) => z.band === "growing").length,
    scale: health.zoneDensity.filter((z) => z.band === "scale").length,
  };

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Business Health</h2>
        <Badge variant="outline" className="text-[10px]">
          Operating Model
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Gauge
          icon={Activity}
          label="Attach Rate"
          value={`${health.attachRate} SKUs/hh`}
          target="≥ 2.0"
          status={attachStatus}
        />
        <Gauge
          icon={Users}
          label="Household Churn"
          value={`${health.householdChurnPct}%`}
          target="< 2%"
          status={churnStatus}
        />
        <Gauge
          icon={UserMinus}
          label="Provider Churn"
          value={`${health.providerChurnPct}%`}
          target="< 20% ann."
          status={providerChurnStatus}
        />

        {/* Zone density distribution */}
        <div className="flex items-start gap-3">
          <div className={`flex h-9 w-9 items-center justify-center rounded-lg shrink-0 ${zoneBands.critical > 0 ? "bg-destructive/10" : "bg-success/10"}`}>
            <MapPin className={`h-4 w-4 ${zoneBands.critical > 0 ? "text-destructive" : "text-success"}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground">Zone Density</p>
            <div className="flex flex-wrap gap-1 mt-1">
              {zoneBands.scale > 0 && (
                <Badge variant="outline" className={statusBadge("success")}>
                  {zoneBands.scale} scale
                </Badge>
              )}
              {zoneBands.growing > 0 && (
                <Badge variant="outline" className={statusBadge("success")}>
                  {zoneBands.growing} growing
                </Badge>
              )}
              {zoneBands.seeding > 0 && (
                <Badge variant="outline" className={statusBadge("warning")}>
                  {zoneBands.seeding} seeding
                </Badge>
              )}
              {zoneBands.critical > 0 && (
                <Badge variant="outline" className={statusBadge("critical")}>
                  {zoneBands.critical} critical
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Supplementary details */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-border text-xs text-muted-foreground">
        <div>
          <span className="font-medium text-foreground">{health.activeHouseholds}</span> active households
        </div>
        <div>
          <span className="font-medium text-foreground">{health.canceledLast30d}</span> canceled (30d)
        </div>
        <div>
          <span className="font-medium text-foreground">{health.totalActiveProviders}</span> active providers
        </div>
        <div>
          <span className="font-medium text-foreground">{health.providersExitedLast90d}</span> exited (90d)
        </div>
      </div>
    </Card>
  );
}
