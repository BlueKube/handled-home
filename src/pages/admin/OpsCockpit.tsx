import { useNavigate } from "react-router-dom";
import { useOpsMetrics } from "@/hooks/useOpsMetrics";
import { useAutopilotHealth } from "@/hooks/useAutopilotHealth";
import { AutopilotBanner } from "@/components/admin/AutopilotBanner";
import { ZoneHealthTable } from "@/components/admin/ZoneHealthTable";
import { AutopilotThresholdsDialog } from "@/components/admin/AutopilotThresholdsDialog";
import { RecentActionsCard } from "@/components/admin/RecentActionsCard";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { SparklineChart } from "@/components/SparklineChart";
import {
  AlertTriangle, Camera, Clock, ShieldAlert,
  DollarSign, CreditCard, Pause, Gift,
  Bug, RotateCcw, Timer, UserX,
  Globe, Users, Briefcase, TrendingUp, SlidersHorizontal,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

function formatCents(cents: number) {
  return "$" + (cents / 100).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

/* ── Drilldown tile ── */
interface DrillTileProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  href: string;
  alert?: boolean;
  sparkline?: number[];
  sparkColor?: string;
  sub?: string;
  className?: string;
}

function DrillTile({ icon: Icon, label, value, href, alert, sparkline, sparkColor, sub, className }: DrillTileProps) {
  const nav = useNavigate();
  return (
    <Card
      variant="interactive"
      className={cn(
        "p-3 cursor-pointer hover:shadow-md transition-shadow group",
        alert && "border-destructive/40 bg-destructive/5",
        className,
      )}
      onClick={() => nav(href)}
    >
      <div className="flex items-start gap-2.5">
        <div className={cn(
          "flex h-8 w-8 items-center justify-center rounded-lg shrink-0",
          alert ? "bg-destructive/10" : "bg-accent/10",
        )}>
          <Icon className={cn("h-4 w-4", alert ? "text-destructive" : "text-accent")} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground truncate">{label}</p>
          <p className="text-lg font-bold tracking-tight leading-tight">{value}</p>
          {sub && <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>}
        </div>
      </div>
      {sparkline && sparkline.length > 1 && (
        <SparklineChart data={sparkline} color={sparkColor ?? "hsl(var(--accent))"} height={18} className="mt-2" />
      )}
    </Card>
  );
}

/* ── Column header ── */
function ColHeader({ title, badge }: { title: string; badge?: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">{title}</h2>
      {badge && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{badge}</Badge>}
    </div>
  );
}

/* ── Compact list tile (for tight days / hot zones) ── */
function ListTile({ title, items, emptyLabel, href }: {
  title: string;
  items: { label: string; detail: string }[];
  emptyLabel: string;
  href: string;
}) {
  const nav = useNavigate();
  return (
    <Card
      variant="interactive"
      className="p-3 cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => nav(href)}
    >
      <p className="text-xs text-muted-foreground mb-2">{title}</p>
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground/60 italic">{emptyLabel}</p>
      ) : (
        <div className="space-y-1">
          {items.map((item, i) => (
            <div key={i} className="flex items-center justify-between text-xs">
              <span className="font-medium truncate">{item.label}</span>
              <span className="text-muted-foreground shrink-0 ml-2">{item.detail}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

export default function OpsCockpit() {
  const { data: m, isLoading, dataUpdatedAt } = useOpsMetrics();
  const autopilot = useAutopilotHealth();
  const nav = useNavigate();

  if (isLoading || !m) {
    return (
      <div className="p-6 space-y-6">
        <h1 className="text-h2">Ops Cockpit</h1>
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-3">
              {Array.from({ length: 4 }).map((_, j) => (
                <Skeleton key={j} className="h-20 rounded-xl" />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  const updatedLabel = dataUpdatedAt
    ? `Updated ${formatDistanceToNow(new Date(dataUpdatedAt), { addSuffix: true })}`
    : "";

  const atRiskCount = m.jobsInIssue + m.proofExceptions;

  return (
    <div className="p-6 space-y-5">
      {/* Autopilot Status Banner */}
      {!autopilot.isLoading && (
        <AutopilotBanner status={autopilot.status} reasons={autopilot.reasons} />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-h2 mb-0.5">Ops Cockpit</h1>
          <p className="text-caption">{updatedLabel}</p>
        </div>
        <div className="flex items-center gap-2">
          <AutopilotThresholdsDialog />
          <Badge
            variant="outline"
            className="cursor-pointer text-xs"
            onClick={() => nav("/admin/ops/dispatch")}
          >
            Open Dispatcher →
          </Badge>
        </div>
      </div>

      {/* 4-column grid */}
      <div className="grid gap-5 grid-cols-1 md:grid-cols-2 xl:grid-cols-4">
        {/* ═══ Column 1: NOW (Reliability) ═══ */}
        <div>
          <ColHeader title="Now" badge={atRiskCount > 0 ? `${atRiskCount} alerts` : undefined} />
          <div className="space-y-2.5">
            <DrillTile
              icon={Clock}
              label="Jobs at Risk"
              value={m.jobsInIssue}
              href="/admin/ops/dispatch"
              alert={m.jobsInIssue > 0}
              sub={`${m.jobsCompletedToday}/${m.jobsScheduledToday} done (${m.completionPct}%)`}
            />
            <DrillTile
              icon={Camera}
              label="Missing Proof"
              value={m.proofExceptions}
              href="/admin/ops/jobs?proof=missing"
              alert={m.proofExceptions > 0}
            />
            <DrillTile
              icon={ShieldAlert}
              label="Provider Incidents"
              value={m.redoIntents}
              href="/admin/ops/dispatch"
              alert={m.redoIntents > 0}
            />
            <ListTile
              title="Tight Zones (Top 3)"
              items={m.tightDays.map(t => ({ label: t.zone_name, detail: `${t.pct}%` }))}
              emptyLabel="No zones near capacity"
              href="/admin/ops/zones"
            />
          </div>
        </div>

        {/* ═══ Column 2: MONEY (Profit Pulse) ═══ */}
        <div>
          <ColHeader title="Money" />
          <div className="space-y-2.5">
            <DrillTile
              icon={DollarSign}
              label="Paid Today"
              value={formatCents(m.paidTodayCents)}
              href="/admin/ops/billing"
            />
            <DrillTile
              icon={CreditCard}
              label="Credits Issued (7d)"
              value={formatCents(m.creditsIssuedCents)}
              href="/admin/ops/billing"
              sparkline={m.trends.credits_issued_7d_cents}
              sparkColor="hsl(var(--warning))"
            />
            <DrillTile
              icon={Pause}
              label="Past Due"
              value={m.pastDueCount}
              href="/admin/ops/billing?tab=past-due"
              alert={m.pastDueCount > 0}
              sparkline={m.trends.past_due_count}
              sparkColor="hsl(var(--destructive))"
            />
            <DrillTile
              icon={Gift}
              label="Add-on Rev (7d)"
              value={formatCents(m.addOnRevenue7dCents)}
              href="/admin/ops/billing"
            />
          </div>
        </div>

        {/* ═══ Column 3: QUALITY (Service Health) ═══ */}
        <div>
          <ColHeader title="Quality" />
          <div className="space-y-2.5">
            <DrillTile
              icon={Bug}
              label="Issue Rate (7d)"
              value={`${m.issueRate}%`}
              href="/admin/ops/jobs"
              alert={m.issueRate > 5}
              sparkline={m.trends.issue_rate_7d}
              sparkColor="hsl(var(--destructive))"
            />
            <DrillTile
              icon={RotateCcw}
              label="Redo Intents (7d)"
              value={m.redoIntents}
              href="/admin/ops/jobs"
            />
            <DrillTile
              icon={AlertTriangle}
              label="Failed Payments"
              value={m.failedPaymentsToday}
              href="/admin/ops/billing?tab=failed"
              alert={m.failedPaymentsToday > 0}
            />
            <DrillTile
              icon={Timer}
              label="Zones >90% Cap"
              value={m.zonesOverCapacity}
              href="/admin/capacity"
              alert={m.zonesOverCapacity > 0}
            />
            <DrillTile
              icon={SlidersHorizontal}
              label="Level Analytics"
              value="View"
              href="/admin/ops/levels"
              sub="Mismatch & courtesy upgrades"
            />
          </div>
        </div>

        {/* ═══ Column 4: MARKETS / GROWTH ═══ */}
        <div>
          <ColHeader title="Markets" />
          <div className="space-y-2.5">
            <DrillTile
              icon={Users}
              label="Referrals (7d)"
              value={m.referralsActivated}
              href="/admin/ops/growth"
            />
            <DrillTile
              icon={Briefcase}
              label="Provider Apps (7d)"
              value={m.providerApplications}
              href="/admin/ops/growth"
            />
            <DrillTile
              icon={TrendingUp}
              label="Invites Sent (7d)"
              value={m.providerInvitesSent}
              href="/admin/ops/growth"
            />
            <ListTile
              title="Hot Zones (Top 3)"
              items={m.hotZones.map(h => ({ label: h.zone_name, detail: `+${h.demand} new` }))}
              emptyLabel="No demand spikes"
              href="/admin/ops/growth"
            />
          </div>
        </div>
      </div>

      {/* Zone Health + Recent Actions */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2">
          <ZoneHealthTable />
        </div>
        <RecentActionsCard />
      </div>
    </div>
  );
}
