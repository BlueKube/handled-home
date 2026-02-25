import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { StatCard } from "@/components/StatCard";
import { useProviderEarnings } from "@/hooks/useProviderEarnings";
import {
  DollarSign,
  TrendingUp,
  Clock,
  PauseCircle,
  Banknote,
  ArrowDownToLine,
  CheckCircle,
} from "lucide-react";
import { format } from "date-fns";

function formatCents(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
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

function EarningsList() {
  const { earnings, isLoading } = useProviderEarnings();

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-16 rounded-xl" />
        ))}
      </div>
    );
  }

  if (earnings.length === 0) {
    return (
      <div className="text-center py-10">
        <DollarSign className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">No earnings yet</p>
        <p className="text-xs text-muted-foreground/60 mt-1">Complete jobs to start earning</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {earnings.map((e: any) => {
        const jobDate = e.jobs?.scheduled_date;
        const address = e.jobs?.properties?.street_address;
        return (
          <Card key={e.id} className="p-3">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                <DollarSign className="h-4 w-4 text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {address ?? "Job"}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  {jobDate && (
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(jobDate), "MMM d")}
                    </span>
                  )}
                  <Badge variant={statusVariant(e.status)} className="text-xs">
                    {e.status.replace(/_/g, " ")}
                  </Badge>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-bold">{formatCents(e.total_cents)}</p>
                {e.modifier_cents !== 0 && (
                  <p className="text-xs text-muted-foreground">
                    {e.modifier_cents > 0 ? "+" : ""}{formatCents(e.modifier_cents)} modifier
                  </p>
                )}
              </div>
            </div>
            {e.hold_reason && (
              <div className="mt-2 flex items-center gap-1.5 text-xs text-warning">
                <PauseCircle className="h-3 w-3" />
                <span>Hold: {e.hold_reason}</span>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}

function PayoutsList() {
  const { payouts, isLoading } = useProviderEarnings();

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 rounded-xl" />
        ))}
      </div>
    );
  }

  if (payouts.length === 0) {
    return (
      <div className="text-center py-10">
        <Banknote className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">No payouts yet</p>
      </div>
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
  const [tab, setTab] = useState("earnings");
  const { eligibleBalance, heldBalance, earnings, payouts, isAccountReady, isLoading } =
    useProviderEarnings();

  const totalEarned = earnings.reduce((sum, e) => sum + e.total_cents, 0);
  const totalPaid = payouts.reduce((sum: number, p: any) => sum + (p.amount_cents ?? 0), 0);

  return (
    <div className="animate-fade-in p-4 pb-24 space-y-5 max-w-2xl">
      <div>
        <h1 className="text-h2">Earnings</h1>
        <p className="text-caption mt-0.5">Track your earnings and payouts</p>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-3 grid-cols-2">
        <StatCard
          icon={DollarSign}
          label="Available"
          value={isLoading ? "—" : formatCents(eligibleBalance)}
        />
        <StatCard
          icon={Clock}
          label="On Hold"
          value={isLoading ? "—" : formatCents(heldBalance)}
        />
        <StatCard
          icon={TrendingUp}
          label="Total Earned"
          value={isLoading ? "—" : formatCents(totalEarned)}
        />
        <StatCard
          icon={Banknote}
          label="Total Paid"
          value={isLoading ? "—" : formatCents(totalPaid)}
        />
      </div>

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
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="w-full">
          <TabsTrigger value="earnings" className="flex-1">Earnings</TabsTrigger>
          <TabsTrigger value="payouts" className="flex-1">Payouts</TabsTrigger>
        </TabsList>
        <TabsContent value="earnings" className="mt-4">
          <EarningsList />
        </TabsContent>
        <TabsContent value="payouts" className="mt-4">
          <PayoutsList />
        </TabsContent>
      </Tabs>
    </div>
  );
}
