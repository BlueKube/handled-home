import { useMemo } from "react";
import { useAdminSubscriptions } from "@/hooks/useAdminSubscriptions";
import { useAdminBilling } from "@/hooks/useAdminBilling";
import { useOpsMetrics } from "@/hooks/useOpsMetrics";
import { useZones } from "@/hooks/useZones";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { DollarSign, TrendingDown, TrendingUp, Users } from "lucide-react";

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
        <h1 className="text-h2">Reporting & Analytics</h1>
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
      </Tabs>
    </div>
  );
}
