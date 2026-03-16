import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { StatCard } from "@/components/StatCard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChevronLeft, Inbox, ShieldAlert, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { format } from "date-fns";

export default function OpsSupport() {
  const nav = useNavigate();
  const [tab, setTab] = useState("overview");

  const { data, isLoading } = useQuery({
    queryKey: ["ops-support-health-full"],
    queryFn: async () => {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const now = new Date().toISOString();

      const [ticketsRes, slaRes, resolvedRes, highSevRes] = await Promise.all([
        supabase.from("support_tickets").select("id, status, created_at, resolved_at, sla_due_at, severity, category, customer_id"),
        supabase.from("support_tickets").select("id", { count: "exact", head: true }).not("sla_due_at", "is", null).lt("sla_due_at", now).neq("status", "resolved"),
        supabase.from("support_tickets").select("id, created_at, resolved_at, category, severity").eq("status", "resolved").gte("created_at", sevenDaysAgo.toISOString()),
        supabase.from("support_tickets").select("id", { count: "exact", head: true }).eq("severity", "high").neq("status", "resolved"),
      ]);

      const tickets = ticketsRes.data ?? [];
      const openTickets = tickets.filter((t: any) => t.status !== "resolved" && t.status !== "closed");
      const openCount = openTickets.length;

      // Self-resolve rate
      const resolved = resolvedRes.data ?? [];
      const selfResolved = resolved.filter((t: any) => {
        if (!t.resolved_at || !t.created_at) return false;
        return new Date(t.resolved_at).getTime() - new Date(t.created_at).getTime() < 3600000;
      }).length;
      const selfResolveRate = resolved.length > 0 ? Math.round((selfResolved / resolved.length) * 100) : 0;

      // Median TTR
      const ttrMs = resolved
        .filter((t: any) => t.resolved_at && t.created_at)
        .map((t: any) => new Date(t.resolved_at!).getTime() - new Date(t.created_at).getTime())
        .sort((a: number, b: number) => a - b);
      const medianTtr = ttrMs.length > 0 ? ttrMs[Math.floor(ttrMs.length / 2)] : 0;
      const medianTtrHours = Math.round(medianTtr / 3600000);

      // Ticket queues by category
      const byCat: Record<string, number> = {};
      const bySev: Record<string, number> = {};
      openTickets.forEach((t: any) => {
        byCat[t.category || "uncategorized"] = (byCat[t.category || "uncategorized"] || 0) + 1;
        bySev[t.severity || "normal"] = (bySev[t.severity || "normal"] || 0) + 1;
      });

      // Repeat claimers: customers with 3+ tickets in 30d
      const customerTickets: Record<string, number> = {};
      tickets.forEach((t: any) => {
        if (t.customer_id) customerTickets[t.customer_id] = (customerTickets[t.customer_id] || 0) + 1;
      });
      const repeatClaimers = Object.entries(customerTickets)
        .filter(([, count]) => count >= 3)
        .map(([cid, count]) => ({ customer_id: cid, ticket_count: count }))
        .sort((a, b) => b.ticket_count - a.ticket_count);

      return {
        openTickets: openCount,
        slaBreachRisk: slaRes.count ?? 0,
        selfResolveRate,
        medianTtrHours,
        highSeverity: highSevRes.count ?? 0,
        queueByCategory: Object.entries(byCat).map(([cat, count]) => ({ category: cat, count })).sort((a, b) => b.count - a.count),
        queueBySeverity: Object.entries(bySev).map(([sev, count]) => ({ severity: sev, count })).sort((a, b) => b.count - a.count),
        repeatClaimers,
      };
    },
  });

  if (isLoading || !data) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-3 grid-cols-2">
          {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => nav("/admin/ops")} aria-label="Back to Ops Cockpit">
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-h2">Support Health</h1>
          <p className="text-caption">Ticket queues, SLA risk, repeat patterns</p>
        </div>
      </div>

      <div className="grid gap-3 grid-cols-2 lg:grid-cols-5">
        <div onClick={() => setTab("queues")} className="cursor-pointer">
          <StatCard icon={Inbox} label="Open Tickets" value={data.openTickets} />
        </div>
        <StatCard icon={ShieldAlert} label="SLA Breach Risk" value={data.slaBreachRisk} />
        <StatCard icon={CheckCircle} label="Self-Resolve (7d)" value={`${data.selfResolveRate}%`} />
        <StatCard icon={Clock} label="Median TTR" value={`${data.medianTtrHours}h`} />
        <StatCard icon={AlertTriangle} label="High Severity" value={data.highSeverity} />
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="queues">By Category</TabsTrigger>
          <TabsTrigger value="repeat">Repeat Claimers ({data.repeatClaimers.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="p-4">
              <h3 className="font-semibold mb-3">By Severity</h3>
              {data.queueBySeverity.map((s: any) => (
                <div key={s.severity} className="flex items-center justify-between py-1">
                  <Badge variant={s.severity === "high" ? "destructive" : "outline"} className="capitalize">{s.severity}</Badge>
                  <span className="font-medium">{s.count}</span>
                </div>
              ))}
            </Card>
            <Card className="p-4">
              <p className="text-muted-foreground text-sm mb-3">Quick access to support admin.</p>
              <Button variant="outline" size="sm" onClick={() => nav("/admin/support")}>
                Open Support Admin →
              </Button>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="queues">
          {data.queueByCategory.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No open tickets.</p>
          ) : (
            <Card className="overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead>Open Tickets</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.queueByCategory.map((c: any) => (
                    <TableRow key={c.category}>
                      <TableCell className="font-medium capitalize">{c.category}</TableCell>
                      <TableCell>{c.count}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="repeat">
          {data.repeatClaimers.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No repeat claimers (3+ tickets).</p>
          ) : (
            <Card className="overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Ticket Count</TableHead>
                    <TableHead>Risk</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.repeatClaimers.map((c: any) => (
                    <TableRow key={c.customer_id}>
                      <TableCell className="font-mono text-xs">{c.customer_id.slice(0, 8)}…</TableCell>
                      <TableCell>{c.ticket_count}</TableCell>
                      <TableCell>
                        <Badge variant={c.ticket_count >= 5 ? "destructive" : "outline"}>
                          {c.ticket_count >= 5 ? "High" : "Medium"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
