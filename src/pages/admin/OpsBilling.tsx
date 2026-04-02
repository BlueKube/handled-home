import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { StatCard } from "@/components/StatCard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { QueryErrorCard } from "@/components/QueryErrorCard";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChevronLeft, UserX, XCircle, CreditCard, RotateCcw, Receipt, ShieldAlert, AlertOctagon, Undo2 } from "lucide-react";
import { format } from "date-fns";
import { formatCents } from "@/utils/format";

export default function OpsBilling() {
  const nav = useNavigate();
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get("tab") || "overview";
  const [tab, setTab] = useState(defaultTab);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["ops-billing-health-full"],
    queryFn: async () => {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const today = new Date().toISOString().split("T")[0];

      const [
        pastDueRes, failedRes,
        credits7Res, credits30Res,
        pastDueListRes, failedListRes,
        creditListRes,
        chargebacksRes,
        refunds7dRes,
        refundListRes,
      ] = await Promise.all([
        supabase.from("customer_invoices").select("id", { count: "exact", head: true }).eq("status", "PAST_DUE" as any),
        supabase.from("customer_invoices").select("id", { count: "exact", head: true }).eq("status", "FAILED").gte("updated_at", today + "T00:00:00Z") as any,
        supabase.from("customer_credits").select("amount_cents").gte("created_at", sevenDaysAgo.toISOString()),
        supabase.from("customer_credits").select("amount_cents").gte("created_at", thirtyDaysAgo.toISOString()),
        supabase.from("customer_invoices").select("id, customer_id, total_cents, due_at, updated_at").eq("status", "PAST_DUE" as any).order("due_at", { ascending: true }).limit(50),
        supabase.from("customer_invoices").select("id, customer_id, total_cents, updated_at").eq("status", "FAILED").order("updated_at", { ascending: false }).limit(50) as any,
        supabase.from("customer_credits").select("id, customer_id, amount_cents, reason, created_at, status").gte("created_at", thirtyDaysAgo.toISOString()).order("created_at", { ascending: false }).limit(100),
        // Chargebacks (7d)
        supabase.from("billing_exceptions").select("id", { count: "exact", head: true }).eq("type", "CHARGEBACK" as any).gte("created_at", sevenDaysAgo.toISOString()),
        // Refunds (7d) - sum from admin_adjustments
        supabase.from("admin_adjustments").select("amount_cents").eq("adjustment_type", "refund" as any).gte("created_at", sevenDaysAgo.toISOString()),
        // Refund list for tab
        supabase.from("admin_adjustments").select("id, entity_id, entity_type, amount_cents, reason, created_at, admin_user_id").eq("adjustment_type", "refund" as any).order("created_at", { ascending: false }).limit(50),
      ]);

      const refundsCents = (refunds7dRes.data ?? []).reduce((s: number, r: any) => s + (r.amount_cents || 0), 0);

      return {
        pastDue: pastDueRes.count ?? 0,
        failedToday: failedRes.count ?? 0,
        credits7d: (credits7Res.data ?? []).reduce((s: number, c: any) => s + (c.amount_cents || 0), 0),
        credits30d: (credits30Res.data ?? []).reduce((s: number, c: any) => s + (c.amount_cents || 0), 0),
        pastDueList: pastDueListRes.data ?? [],
        failedList: failedListRes.data ?? [],
        creditList: creditListRes.data ?? [],
        chargebacks7d: chargebacksRes.count ?? 0,
        refunds7dCents: refundsCents,
        refundList: refundListRes.data ?? [],
      };
    },
  });

  if (isError) {
    return (
      <div className="p-6 space-y-4">
        <h1 className="text-h2">Billing Health</h1>
        <QueryErrorCard message="Failed to load billing data." onRetry={() => refetch()} />
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-3 grid-cols-2">
          {[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
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
          <h1 className="text-h2">Billing Health</h1>
          <p className="text-caption">Revenue, collections, and credit health</p>
        </div>
      </div>

      <div className="grid gap-3 grid-cols-2 lg:grid-cols-3">
        <div onClick={() => setTab("past-due")} className="cursor-pointer">
          <StatCard icon={UserX} label="Past Due" value={data.pastDue} />
        </div>
        <div onClick={() => setTab("failed")} className="cursor-pointer">
          <StatCard icon={XCircle} label="Failed Today" value={data.failedToday} />
        </div>
        <div onClick={() => setTab("credits")} className="cursor-pointer">
          <StatCard icon={CreditCard} label="Credits (7d)" value={formatCents(data.credits7d)} />
        </div>
        <div onClick={() => setTab("credits")} className="cursor-pointer">
          <StatCard icon={RotateCcw} label="Credits (30d)" value={formatCents(data.credits30d)} />
        </div>
        <div onClick={() => setTab("refunds")} className="cursor-pointer">
          <StatCard icon={Undo2} label="Refunds (7d)" value={formatCents(data.refunds7dCents)} />
        </div>
        <div onClick={() => setTab("refunds")} className="cursor-pointer">
          <StatCard icon={AlertOctagon} label="Chargebacks (7d)" value={data.chargebacks7d} />
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="past-due">Past Due ({data.pastDue})</TabsTrigger>
          <TabsTrigger value="failed">Failed ({data.failedList.length})</TabsTrigger>
          <TabsTrigger value="credits">Credits ({data.creditList.length})</TabsTrigger>
          <TabsTrigger value="refunds">Refunds ({data.refundList.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card className="p-4">
            <p className="text-muted-foreground text-sm mb-3">Quick links to billing admin for actions.</p>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => nav("/admin/billing")}>
                <Receipt className="h-3.5 w-3.5 mr-1" /> Billing Admin
              </Button>
              <Button variant="outline" size="sm" onClick={() => nav("/admin/exceptions")}>
                <ShieldAlert className="h-3.5 w-3.5 mr-1" /> Exceptions
              </Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="past-due">
          {data.pastDueList.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No past due invoices.</p>
          ) : (
            <Card className="overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Due</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.pastDueList.map((inv: any) => (
                    <TableRow key={inv.id} className="cursor-pointer" onClick={() => nav(`/admin/billing/customers/${inv.customer_id}`)}>
                      <TableCell className="font-mono text-xs">{inv.customer_id?.slice(0, 8)}…</TableCell>
                      <TableCell>{formatCents(inv.total_cents)}</TableCell>
                      <TableCell className="text-xs">{inv.due_at ? format(new Date(inv.due_at), "MMM d") : "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="failed">
          {data.failedList.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No failed invoices.</p>
          ) : (
            <Card className="overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Updated</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.failedList.map((inv: any) => (
                    <TableRow key={inv.id} className="cursor-pointer" onClick={() => nav(`/admin/billing/customers/${inv.customer_id}`)}>
                      <TableCell className="font-mono text-xs">{inv.customer_id?.slice(0, 8)}…</TableCell>
                      <TableCell>{formatCents(inv.total_cents)}</TableCell>
                      <TableCell className="text-xs">{format(new Date(inv.updated_at), "MMM d HH:mm")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="credits">
          {data.creditList.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No credits issued in last 30 days.</p>
          ) : (
            <Card className="overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.creditList.map((c: any) => (
                    <TableRow key={c.id} className="cursor-pointer" onClick={() => nav(`/admin/billing/customers/${c.customer_id}`)}>
                      <TableCell className="font-mono text-xs">{c.customer_id?.slice(0, 8)}…</TableCell>
                      <TableCell>{formatCents(c.amount_cents)}</TableCell>
                      <TableCell className="text-xs max-w-[120px] truncate">{c.reason || "—"}</TableCell>
                      <TableCell className="text-xs">{format(new Date(c.created_at), "MMM d")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="refunds">
          {data.refundList.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No refunds recorded.</p>
          ) : (
            <Card className="overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Entity</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.refundList.map((r: any) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono text-xs">{r.entity_id?.slice(0, 8)}…</TableCell>
                      <TableCell>{formatCents(r.amount_cents)}</TableCell>
                      <TableCell className="text-xs max-w-[120px] truncate">{r.reason || "—"}</TableCell>
                      <TableCell className="text-xs">{format(new Date(r.created_at), "MMM d")}</TableCell>
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
