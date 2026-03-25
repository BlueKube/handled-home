import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { StatCard } from "@/components/StatCard";
import { QueryErrorCard } from "@/components/QueryErrorCard";
import { useProviderEarnings, type EarningsPeriod, type ProviderEarning, type HeldEarning } from "@/hooks/useProviderEarnings";
import { formatCents } from "@/utils/format";
import { EmptyState } from "@/components/ui/empty-state";
import { HelpTip } from "@/components/ui/help-tip";
import {
  DollarSign,
  TrendingUp,
  Clock,
  PauseCircle,
  Banknote,
  ArrowDownToLine,
  CheckCircle,
  Zap,
  Target,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  Info,
  CalendarClock,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

function modifierExplanation(cents: number, holdReason?: string | null): string {
  if (cents > 0) {
    if (cents >= 1000) return "Quality tier bonus";
    if (cents >= 500) return "Rush / high-demand bonus";
    return "Service bonus";
  }
  if (cents < 0) {
    if (holdReason === "high_severity_issue") return "Adjustment — issue reported";
    return "Adjustment applied";
  }
  return "";
}

function holdReasonLabel(reason: string): string {
  switch (reason) {
    case "probation_provider":
      return "New provider review period";
    case "high_severity_issue":
      return "Under review — service issue reported";
    case "payout_account_not_ready":
      return "Payout account setup required";
    default:
      return reason.replace(/_/g, " ");
  }
}

function statusVariant(status: string): "default" | "secondary" | "outline" | "destructive" {
  switch (status) {
    case "PAID":
    case "ELIGIBLE":
      return "default";
    case "HELD":
    case "HELD_UNTIL_READY":
      return "secondary";
    case "VOIDED":
      return "destructive";
    default:
      return "outline";
  }
}

function EarningCard({ earning }: { earning: ProviderEarning }) {
  const [expanded, setExpanded] = useState(false);
  const jobDate = earning.jobs?.scheduled_date;
  const address = earning.jobs?.properties?.street_address;

  // Safely compute base: use column if available, otherwise derive from total - modifier
  const baseCents = earning.base_amount_cents ?? (earning.total_cents - earning.modifier_cents);

  return (
    <Card
      className="p-3 cursor-pointer"
      role="button"
      tabIndex={0}
      aria-expanded={expanded}
      aria-label={`Earning details for ${address ?? "job"}`}
      onClick={() => setExpanded(!expanded)}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), setExpanded(!expanded))}
    >
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
          <DollarSign className="h-4 w-4 text-accent" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{address ?? "Job"}</p>
          <div className="flex items-center gap-2 mt-0.5">
            {jobDate && (
              <span className="text-xs text-muted-foreground">
                {format(new Date(jobDate), "MMM d")}
              </span>
            )}
            <Badge variant={statusVariant(earning.status)} className="text-xs">
              {earning.status.replace(/_/g, " ")}
            </Badge>
          </div>
        </div>
        <div className="text-right shrink-0 flex items-center gap-1">
          <div>
            <p className="text-sm font-bold">{formatCents(earning.total_cents)}</p>
            {earning.modifier_cents !== 0 && (
              <p className="text-xs text-muted-foreground">
                {earning.modifier_cents > 0 ? "+" : ""}
                {formatCents(earning.modifier_cents)}
              </p>
            )}
          </div>
          {expanded ? (
            <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          )}
        </div>
      </div>

      {/* Expanded modifier breakdown */}
      {expanded && (
        <div className="mt-3 pt-3 border-t border-border space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Base pay</span>
            <span className="font-medium">{formatCents(baseCents)}</span>
          </div>
          {earning.modifier_cents !== 0 && (
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground flex items-center gap-1">
                <Zap className="h-3 w-3" />
                {modifierExplanation(earning.modifier_cents, earning.hold_reason)}
              </span>
              <span className={`font-medium ${earning.modifier_cents > 0 ? "text-success" : "text-destructive"}`}>
                {earning.modifier_cents > 0 ? "+" : ""}
                {formatCents(earning.modifier_cents)}
              </span>
            </div>
          )}
          <div className="flex justify-between text-xs font-semibold pt-1 border-t border-border/50">
            <span>Net pay</span>
            <span>{formatCents(earning.total_cents)}</span>
          </div>
          {earning.hold_reason && (
            <div className="flex items-center gap-1.5 text-xs text-warning mt-1">
              <PauseCircle className="h-3 w-3" />
              <span>Hold: {holdReasonLabel(earning.hold_reason)}</span>
              {earning.hold_until && (
                <span className="text-muted-foreground">
                  · releases {formatDistanceToNow(new Date(earning.hold_until), { addSuffix: true })}
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

function EarningsList({ period }: { period: EarningsPeriod }) {
  const { earnings, isLoading, isError, refetch } = useProviderEarnings(period);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-16 rounded-xl" />
        ))}
      </div>
    );
  }

  if (isError) {
    return <QueryErrorCard message="Failed to load earnings." onRetry={() => refetch()} />;
  }

  if (earnings.length === 0) {
    return (
      <EmptyState
        compact
        icon={DollarSign}
        title="No earnings for this period"
        body="Complete jobs to start earning. Earnings appear here after each service."
      />
    );
  }

  return (
    <div className="space-y-2">
      {earnings.map((e) => (
        <EarningCard key={e.id} earning={e} />
      ))}
    </div>
  );
}

function PayoutsList() {
  const { payouts, isLoading, isError, refetch } = useProviderEarnings();

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 rounded-xl" />
        ))}
      </div>
    );
  }

  if (isError) {
    return <QueryErrorCard message="Failed to load payouts." onRetry={() => refetch()} />;
  }

  if (payouts.length === 0) {
    return (
      <EmptyState
        compact
        icon={Banknote}
        title="No payouts yet"
        body="Payouts are processed weekly on Fridays. Complete jobs to get started."
      />
    );
  }

  return (
    <div className="space-y-2">
      {payouts.map((p: any) => (
        <Card key={p.id} className="p-3">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-success/10 flex items-center justify-center shrink-0">
              <ArrowDownToLine className="h-4 w-4 text-success" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">
                Payout — {format(new Date(p.created_at), "MMM d, yyyy")}
              </p>
              <Badge variant={p.status === "COMPLETED" ? "default" : "secondary"} className="text-xs mt-0.5">
                {p.status}
              </Badge>
            </div>
            <p className="text-sm font-bold shrink-0">{formatCents(p.amount_cents)}</p>
          </div>
        </Card>
      ))}
    </div>
  );
}

export default function ProviderEarnings() {
  const navigate = useNavigate();
  const [mainTab, setMainTab] = useState("earnings");
  const [period, setPeriod] = useState<EarningsPeriod>("month");
  const [holdExpanded, setHoldExpanded] = useState(false);
  const {
    eligibleBalance,
    heldBalance,
    heldEarnings,
    periodTotal,
    periodModifiers,
    monthProjection,
    projectionDetail,
    isAccountReady,
    isLoading,
  } = useProviderEarnings(period);

  const periodLabel = period === "today" ? "Today" : period === "week" ? "This Week" : "This Month";

  return (
    <div className="animate-fade-in p-4 pb-24 space-y-5">
      <button onClick={() => navigate("/provider/more")} className="flex items-center gap-1 text-muted-foreground mb-2 hover:text-foreground transition-colors" aria-label="Back to More menu">
        <ChevronLeft className="h-4 w-4" />
        <span className="text-sm">More</span>
      </button>
      <div>
        <h1 className="text-h2">Earnings</h1>
        <p className="text-caption mt-0.5">Track your earnings and payouts</p>
      </div>

      {/* Period Selector */}
      <div className="flex gap-1 bg-muted rounded-lg p-1">
        {(["today", "week", "month"] as EarningsPeriod[]).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`flex-1 text-xs font-medium py-1.5 rounded-md transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
              period === p
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {p === "today" ? "Today" : p === "week" ? "Week" : "Month"}
          </button>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="grid gap-3 grid-cols-2">
        <StatCard
          icon={DollarSign}
          label={`${periodLabel} Earned`}
          value={isLoading ? "—" : formatCents(periodTotal)}
          helpText="Total earnings from completed jobs in this period, before holds."
        />
        <StatCard
          icon={Zap}
          label="Modifiers"
          value={isLoading ? "—" : `${periodModifiers >= 0 ? "+" : ""}${formatCents(periodModifiers)}`}
          helpText="Bonuses (rush, quality tier) and adjustments applied to your base pay."
        />
        <StatCard
          icon={TrendingUp}
          label="Available"
          value={isLoading ? "—" : formatCents(eligibleBalance)}
          helpText="Earnings ready for your next payout. Processed weekly on Fridays."
        />
        <div
          role={heldBalance > 0 ? "button" : undefined}
          tabIndex={heldBalance > 0 ? 0 : undefined}
          aria-expanded={heldBalance > 0 ? holdExpanded : undefined}
          aria-label={heldBalance > 0 ? (holdExpanded ? "Collapse hold details" : "Expand hold details") : undefined}
          className={heldBalance > 0 ? "cursor-pointer" : undefined}
          onClick={() => heldBalance > 0 && setHoldExpanded(!holdExpanded)}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && heldBalance > 0 && (e.preventDefault(), setHoldExpanded(!holdExpanded))}
        >
          <StatCard
            icon={Clock}
            label={heldBalance > 0 ? `On Hold ${holdExpanded ? "▲" : "▼"}` : "On Hold"}
            value={isLoading ? "—" : formatCents(heldBalance)}
            helpText="Earnings under review or awaiting payout setup. Released after confirmation."
          />
        </div>
      </div>

      {/* Hold Detail Breakdown */}
      {holdExpanded && heldEarnings.length > 0 && (
        <Card className="p-3 bg-warning/5 border-warning/20">
          <div className="flex items-center gap-2 mb-2">
            <Info className="h-3.5 w-3.5 text-warning" />
            <span className="text-xs font-medium">Hold Details</span>
          </div>
          <div className="space-y-2">
            {heldEarnings.map((h: HeldEarning) => (
              <div key={h.id} className="flex items-start justify-between text-xs gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-muted-foreground">
                    {h.hold_reason ? holdReasonLabel(h.hold_reason) : "Standard review hold"}
                  </p>
                  {h.hold_until && (
                    <p className="text-muted-foreground/70 flex items-center gap-1 mt-0.5">
                      <CalendarClock className="h-3 w-3" />
                      Releases {formatDistanceToNow(new Date(h.hold_until), { addSuffix: true })}
                    </p>
                  )}
                </div>
                <span className="font-medium shrink-0">{formatCents(h.total_cents)}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground/60 mt-2">
            Holds are released after service confirmation or review completion.
          </p>
        </Card>
      )}

      {/* Monthly Projection Card */}
      {projectionDetail && projectionDetail.remainingJobs > 0 && (
        <Card className="p-4 bg-primary/5 border-primary/20">
          <div className="flex items-start gap-3">
            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Target className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                At current pace: {formatCents(monthProjection)}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {projectionDetail.remainingJobs} scheduled job{projectionDetail.remainingJobs !== 1 ? "s" : ""} remaining
                · avg {formatCents(projectionDetail.avgPerJob)}/job
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Guaranteed minimum earnings per job — no tip dependency
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Payout Account Status */}
      <Card className="p-3">
        <div className="flex items-center gap-3">
          {isAccountReady ? (
            <CheckCircle className="h-5 w-5 text-success shrink-0" />
          ) : (
            <PauseCircle className="h-5 w-5 text-warning shrink-0" />
          )}
          <div>
            <p className="text-sm font-medium">
              {isAccountReady ? "Payout account ready" : "Payout account not set up"}
            </p>
            <p className="text-xs text-muted-foreground">
              {isAccountReady
                ? "Earnings will be deposited on schedule"
                : "Set up your payout account to receive earnings"}
            </p>
          </div>
        </div>
      </Card>

      {/* Earnings / Payouts Tabs */}
      <Tabs value={mainTab} onValueChange={setMainTab}>
        <TabsList className="w-full">
          <TabsTrigger value="earnings" className="flex-1">Earnings</TabsTrigger>
          <TabsTrigger value="payouts" className="flex-1">Payouts</TabsTrigger>
        </TabsList>
        <TabsContent value="earnings" className="mt-4">
          <EarningsList period={period} />
        </TabsContent>
        <TabsContent value="payouts" className="mt-4">
          <PayoutsList />
        </TabsContent>
      </Tabs>
    </div>
  );
}
