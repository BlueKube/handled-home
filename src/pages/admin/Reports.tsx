import { useMemo } from "react";
import { useAdminSubscriptions } from "@/hooks/useAdminSubscriptions";
import { useAdminBilling } from "@/hooks/useAdminBilling";
import { useOpsMetrics } from "@/hooks/useOpsMetrics";
import { useZones } from "@/hooks/useZones";
import { useLossLeaderMetrics } from "@/hooks/useLossLeaderMetrics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { DollarSign, TrendingDown, TrendingUp, Users, AlertTriangle } from "lucide-react";
import { HelpTip } from "@/components/ui/help-tip";

function fmt(cents: number) {
  return `$${(cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
}

export default function AdminReports() {
  const { data: subs, isLoading: subsLoading } = useAdminSubscriptions();
  const { invoices, isLoading: billingLoading } = useAdminBilling();
  const { data: ops } = useOpsMetrics();
  const { data: zones } = useZones();

  const isLoading = subsLoading || billingLoading;

  // MRR calculation: count active subs × avg invoice
  const activeSubs = (subs ?? []).filter((s) => s.status === "active");
  const paidInvoices = invoices.filter((i) => i.status === "PAID");
  const totalRevenue = paidInvoices.reduce((s, i) => s + i.total_cents, 0);
  const mrr = activeSubs.length > 0 && paidInvoices.length > 0
    ? Math.round(totalRevenue / Math.max(paidInvoices.length / activeSubs.length, 1))
    : 0;

  // Churn: canceled / (active + canceled) 
  const allSubs = subs ?? [];
  const canceled = allSubs.filter((s) => s.status === "canceled").length;
  const churnRate = allSubs.length > 0 ? Math.round((canceled / allSubs.length) * 100) : 0;

  // Revenue per zone
  const revenueByZone = useMemo(() => {
    const byZone: Record<string, number> = {};
    activeSubs.forEach((s) => {
      const zoneId = (s as any).zone_id;
      if (zoneId) byZone[zoneId] = (byZone[zoneId] || 0) + 1;
    });
    return (zones ?? [])
      .filter((z) => z.status === "active")
      .map((z) => ({ name: z.name, subs: byZone[z.id] || 0 }))
      .sort((a, b) => b.subs - a.subs);
  }, [activeSubs, zones]);

  // Subscription status breakdown
  const statusBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    allSubs.forEach((s) => { counts[s.status] = (counts[s.status] || 0) + 1; });
    return Object.entries(counts).map(([status, count]) => ({ status, count }));
  }, [allSubs]);

  // Trend data from ops
  const trendData = useMemo(() => {
    if (!ops?.trends) return [];
    const completionTrend = ops.trends["jobs_completed"] ?? [];
    const scheduledTrend = ops.trends["jobs_scheduled"] ?? [];
    return completionTrend.map((val, i) => ({
      day: `D${i + 1}`,
      completed: val,
      scheduled: scheduledTrend[i] ?? 0,
    }));
  }, [ops]);

  const COLORS = [
    "hsl(var(--primary))",
    "hsl(var(--accent))",
    "hsl(var(--muted-foreground))",
    "hsl(var(--destructive))",
  ];

  if (isLoading) {
    return (
      <div className="p-6 space-y-4 animate-fade-in">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-h2">Reporting & Analytics <HelpTip text="Reports provide historical views of revenue, subscriptions, operations, and zone performance." /></h1>
        <p className="text-caption">Revenue, retention, and operational performance</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <DollarSign className="h-3.5 w-3.5" />Est. MRR
            </div>
            <p className="text-2xl font-bold">{fmt(mrr)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Users className="h-3.5 w-3.5" />Active Subs
            </div>
            <p className="text-2xl font-bold">{activeSubs.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <TrendingDown className="h-3.5 w-3.5" />Churn Rate
            </div>
            <p className="text-2xl font-bold">{churnRate}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <TrendingUp className="h-3.5 w-3.5" />Total Revenue
            </div>
            <p className="text-2xl font-bold">{fmt(totalRevenue)}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="revenue">
        <TabsList>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="subs">Subscriptions</TabsTrigger>
          <TabsTrigger value="ops">Operations</TabsTrigger>
          <TabsTrigger value="zones">By Zone</TabsTrigger>
          <TabsTrigger value="loss-leaders">Loss Leaders</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue">
          <Card>
            <CardHeader><CardTitle>Invoice Revenue Distribution</CardTitle></CardHeader>
            <CardContent>
              {paidInvoices.length === 0 ? (
                <p className="text-center text-muted-foreground py-10">No paid invoices yet</p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={paidInvoices.slice(0, 30).map((inv, i) => ({
                    idx: i + 1,
                    amount: inv.total_cents / 100,
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="idx" tick={{ fontSize: 11 }} />
                    <YAxis tickFormatter={(v) => `$${v}`} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v: number) => [`$${v.toFixed(2)}`, "Amount"]} />
                    <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subs">
          <Card>
            <CardHeader><CardTitle>Subscription Status Breakdown</CardTitle></CardHeader>
            <CardContent className="flex items-center justify-center">
              {statusBreakdown.length === 0 ? (
                <p className="text-muted-foreground py-10">No subscriptions</p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={statusBreakdown}
                      dataKey="count"
                      nameKey="status"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={({ status, count }) => `${status} (${count})`}
                    >
                      {statusBreakdown.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ops">
          <Card>
            <CardHeader><CardTitle>Job Completion Trend (7d)</CardTitle></CardHeader>
            <CardContent>
              {trendData.length === 0 ? (
                <p className="text-center text-muted-foreground py-10">No trend data available yet</p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="completed" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="scheduled" stroke="hsl(var(--muted-foreground))" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="zones">
          <Card>
            <CardHeader><CardTitle>Subscribers per Zone</CardTitle></CardHeader>
            <CardContent>
              {revenueByZone.length === 0 ? (
                <p className="text-center text-muted-foreground py-10">No zone data</p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={revenueByZone} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="subs" fill="hsl(var(--accent))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="loss-leaders">
          <LossLeadersTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function LossLeadersTab() {
  const { data, isLoading, isError } = useLossLeaderMetrics();

  if (isLoading) return <div className="space-y-4 mt-4"><Skeleton className="h-48" /><Skeleton className="h-32" /><Skeleton className="h-24" /></div>;
  if (isError) return (
    <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-4 mt-4">
      <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
      <p className="text-sm text-destructive">Failed to load Reports data. Please try again.</p>
    </div>
  );
  if (!data) return null;

  return (
    <div className="space-y-4 mt-4">
      {/* Per-plan profitability */}
      <Card>
        <CardHeader><CardTitle>Per-Plan Profitability</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground text-xs">
                  <th className="text-left py-2 font-medium">Plan</th>
                  <th className="text-left py-2 font-medium">Tier</th>
                  <th className="text-right py-2 font-medium">Subs</th>
                  <th className="text-right py-2 font-medium">Revenue</th>
                  <th className="text-right py-2 font-medium">Est. Cost</th>
                  <th className="text-right py-2 font-medium">Margin</th>
                  <th className="text-right py-2 font-medium">Margin %</th>
                </tr>
              </thead>
              <tbody>
                {data.planProfitability.map((p) => (
                  <tr key={p.planId} className={`border-b last:border-0 ${p.margin < 0 ? "bg-destructive/5" : ""}`}>
                    <td className={`py-2 font-medium ${p.margin < 0 ? "text-destructive" : ""}`}>{p.planName}</td>
                    <td className="py-2 capitalize text-muted-foreground">{p.tier}</td>
                    <td className="py-2 text-right">{p.subscriberCount}</td>
                    <td className="py-2 text-right">${(p.revenue / 100).toFixed(2)}</td>
                    <td className="py-2 text-right">${(p.estimatedCost / 100).toFixed(2)}</td>
                    <td className={`py-2 text-right font-medium ${p.margin < 0 ? "text-destructive" : "text-success"}`}>
                      ${(p.margin / 100).toFixed(2)}
                    </td>
                    <td className={`py-2 text-right ${p.marginPercent < 0 ? "text-destructive" : ""}`}>
                      {p.marginPercent.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Cohort attach rates */}
      <Card>
        <CardHeader><CardTitle>Cohort Attach Rates</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {data.cohortAttachRates.map((c) => {
              const belowTarget = c.attachRate < c.target;
              return (
                <div
                  key={c.cohortLabel}
                  className={`rounded-xl border p-3 ${belowTarget ? "border-warning/30 bg-warning/5" : "border-border"}`}
                >
                  <p className="text-xs font-medium text-muted-foreground">{c.cohortLabel}</p>
                  <p className={`text-xl font-bold mt-1 ${belowTarget ? "text-warning" : "text-foreground"}`}>
                    {c.attachRate.toFixed(1)}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Target: {c.target.toFixed(1)} · {c.householdCount} hh</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Exit criteria alerts */}
      {data.exitAlerts.length > 0 && (
        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              Exit Criteria Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.exitAlerts.map((alert, i) => (
              <div key={i} className="flex items-start gap-3 rounded-lg bg-destructive/5 border border-destructive/20 p-3">
                <div className="flex-1">
                  <p className="text-sm font-medium text-destructive">{alert.planName} — {alert.cohortLabel}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Attach rate: {alert.attachRate.toFixed(1)} SKUs/hh (target: {alert.threshold.toFixed(1)})
                  </p>
                  <p className="text-xs text-muted-foreground">{alert.action}</p>
                </div>
                <Badge variant="outline" className="text-destructive border-destructive/30 shrink-0">Action Required</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
