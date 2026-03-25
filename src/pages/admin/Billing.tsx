import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAdminBilling } from "@/hooks/useAdminBilling";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DollarSign, AlertTriangle, Receipt, TrendingUp,
  Users, ChevronRight, CreditCard, Clock,
} from "lucide-react";
import { PageSkeleton } from "@/components/PageSkeleton";
import { QueryErrorCard } from "@/components/QueryErrorCard";

function formatCents(cents: number) { return `$${(cents / 100).toFixed(2)}`; }

const subStatusConfig: Record<string, { label: string; color: string }> = {
  active: { label: "Active", color: "bg-success" },
  past_due: { label: "Past Due", color: "bg-destructive" },
  paused: { label: "Paused", color: "bg-warning" },
  canceled: { label: "Canceled", color: "bg-muted-foreground" },
  trialing: { label: "Trialing", color: "bg-accent" },
};

export default function AdminBillingPage() {
  const nav = useNavigate();
  const { paidToday, failedCount, exceptions, invoices, isLoading, isError, refetch } = useAdminBilling();

  const { data: subDistribution } = useQuery({
    queryKey: ["admin-sub-distribution"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("status");
      if (error) throw error;
      const dist: Record<string, number> = {};
      (data ?? []).forEach((s: any) => {
        dist[s.status] = (dist[s.status] || 0) + 1;
      });
      return dist;
    },
  });

  if (isError) return (
    <div className="animate-fade-in p-6">
      <QueryErrorCard message="Failed to load billing data." onRetry={() => refetch()} />
    </div>
  );

  if (isLoading) return <PageSkeleton />;

  const totalRevenue = invoices
    .filter(i => i.status === "PAID")
    .reduce((s, i) => s + i.total_cents, 0);

  const pastDueInvoices = invoices.filter(i => i.status === "PAST_DUE" || i.status === "FAILED");
  const totalSubs = subDistribution ? Object.values(subDistribution).reduce((a, b) => a + b, 0) : 0;

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <h1 className="text-h2">Billing</h1>

      {/* Revenue Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Revenue Today" value={formatCents(paidToday)} icon={DollarSign} />
        <StatCard label="Total Collected" value={formatCents(totalRevenue)} icon={TrendingUp} />
        <StatCard label="Failed Payments" value={String(failedCount)} icon={AlertTriangle} />
        <StatCard label="Total Subscribers" value={totalSubs} icon={Users} />
      </div>

      {/* Subscription Status Distribution */}
      {subDistribution && totalSubs > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Subscription Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Distribution bar */}
            <div className="flex h-3 rounded-full overflow-hidden bg-secondary">
              {Object.entries(subDistribution).map(([status, count]) => {
                const config = subStatusConfig[status] ?? { label: status, color: "bg-muted-foreground" };
                const pct = totalSubs > 0 ? (count / totalSubs) * 100 : 0;
                return pct > 0 ? (
                  <div
                    key={status}
                    className={`${config.color} transition-all`}
                    style={{ width: `${pct}%` }}
                    title={`${config.label}: ${count} (${Math.round(pct)}%)`}
                  />
                ) : null;
              })}
            </div>
            {/* Legend */}
            <div className="flex flex-wrap gap-3">
              {Object.entries(subDistribution).map(([status, count]) => {
                const config = subStatusConfig[status] ?? { label: status, color: "bg-muted-foreground" };
                return (
                  <div key={status} className="flex items-center gap-1.5 text-xs">
                    <span className={`h-2.5 w-2.5 rounded-full ${config.color}`} />
                    <span className="text-muted-foreground">{config.label}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Navigation */}
      <div className="grid grid-cols-2 gap-3">
        <Card
          className="p-3 cursor-pointer hover:shadow-sm transition-shadow"
          onClick={() => toast.info("Search for a customer by name or email to view their ledger")}
        >
          <div className="flex items-center gap-2.5">
            <Receipt className="h-4 w-4 text-accent" />
            <div className="flex-1">
              <p className="text-sm font-medium">Customer Ledgers</p>
              <p className="text-xs text-muted-foreground">Individual billing</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
          </div>
        </Card>
        <Card
          className="p-3 cursor-pointer hover:shadow-sm transition-shadow"
          onClick={() => nav("/admin/payouts")}
        >
          <div className="flex items-center gap-2.5">
            <CreditCard className="h-4 w-4 text-accent" />
            <div className="flex-1">
              <p className="text-sm font-medium">Provider Payouts</p>
              <p className="text-xs text-muted-foreground">Payout status</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
          </div>
        </Card>
      </div>

      {/* Past Due Invoices */}
      {pastDueInvoices.length > 0 && (
        <Card className="border-destructive/20">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <CardTitle className="text-base">Action Needed</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {pastDueInvoices.slice(0, 5).map((inv) => (
              <div key={inv.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">{formatCents(inv.total_cents)}</p>
                  <p className="text-xs text-muted-foreground">{new Date(inv.created_at).toLocaleDateString()}</p>
                </div>
                <Badge variant="destructive" className="text-[10px]">{inv.status}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Open Exceptions */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Open Exceptions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {exceptions.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No open exceptions.</p>
          ) : exceptions.slice(0, 10).map((ex) => (
            <div key={ex.id} className="flex items-center justify-between py-2 border-b last:border-0">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Badge variant={ex.severity === "HIGH" ? "destructive" : "secondary"} className="text-[10px]">
                    {ex.severity}
                  </Badge>
                  <span className="text-sm font-medium">{ex.type.replace(/_/g, " ")}</span>
                </div>
                {ex.next_action && <p className="text-xs text-muted-foreground">{ex.next_action}</p>}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
