import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { StatCard } from "@/components/StatCard";
import { useProviderEarnings, type EarningsPeriod, type HeldEarning } from "@/hooks/useProviderEarnings";
import { formatCents } from "@/utils/format";
import {
  DollarSign,
  TrendingUp,
  Clock,
  PauseCircle,
  CheckCircle,
  Zap,
  Target,
  ChevronLeft,
  Info,
  CalendarClock,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { EarningsList, PayoutsList, holdReasonLabel } from "./earnings";

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
          <div className="flex-1">
            <p className="text-sm font-medium">
              {isAccountReady ? "Payout account ready" : "Payout account not set up"}
            </p>
            <p className="text-xs text-muted-foreground">
              {isAccountReady
                ? "Earnings will be deposited on schedule"
                : "Set up your payout account to receive earnings"}
            </p>
          </div>
          {!isAccountReady && (
            <Button variant="accent" size="sm" onClick={() => navigate("/provider/settings")}>
              Set Up Payout
            </Button>
          )}
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
