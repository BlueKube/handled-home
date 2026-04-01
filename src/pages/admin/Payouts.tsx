import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAdminBilling } from "@/hooks/useAdminBilling";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/StatCard";
import { DollarSign, Clock, Calendar, Settings } from "lucide-react";
import { PageSkeleton } from "@/components/PageSkeleton";
import { DecisionTraceCard } from "@/components/admin/DecisionTraceCard";
import { PayoutRolloverCard } from "@/components/admin/billing/PayoutRolloverCard";

function formatCents(cents: number) { return `$${(cents / 100).toFixed(2)}`; }

export default function AdminPayoutsPage() {
  const navigate = useNavigate();
  const [selectedPayoutId, setSelectedPayoutId] = useState<string | null>(null);
  const { payouts, isLoading } = useAdminBilling();

  if (isLoading) return <PageSkeleton />;

  const paidTotal = payouts.filter(p => p.status === "PAID").reduce((s, p) => s + p.total_cents, 0);
  const pendingCount = payouts.filter(p => p.status === "INITIATED").length;

  return (
    <div className="p-6 space-y-4 animate-fade-in">
      <h1 className="text-h2">Payouts</h1>

      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Total paid out" value={formatCents(paidTotal)} icon={DollarSign} />
        <StatCard label="Pending" value={String(pendingCount)} icon={Clock} />
      </div>

      {/* Payout Schedule */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-accent" />
              <div>
                <p className="text-sm font-medium">Payout Schedule</p>
                <p className="text-xs text-muted-foreground">Payouts are processed weekly on Fridays</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate("/admin/control/payouts")}>
              <Settings className="h-3.5 w-3.5 mr-1" />
              Configure
            </Button>
          </div>
          {pendingCount > 0 && (
            <div className="mt-3 p-3 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{pendingCount} payout{pendingCount !== 1 ? "s" : ""}</span> pending for next cycle
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <PayoutRolloverCard />

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Recent Payouts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {payouts.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No payouts yet.</p>
          ) : payouts.slice(0, 20).map((p) => (
            <div key={p.id}>
              <div className="flex items-center justify-between py-2 border-b last:border-0 cursor-pointer hover:bg-muted/30 transition-colors px-1 rounded"
                   onClick={() => setSelectedPayoutId(selectedPayoutId === p.id ? null : p.id)}>
                <div>
                  <p className="text-sm font-medium">{formatCents(p.total_cents)}</p>
                  <p className="text-xs text-muted-foreground">
                    {(p as any).provider_name ?? "Unknown provider"} · {new Date(p.created_at).toLocaleDateString()}
                  </p>
                </div>
                <Badge variant={p.status === "PAID" ? "default" : p.status === "FAILED" ? "destructive" : "secondary"} className="text-[10px]">
                  {p.status}
                </Badge>
              </div>
              {selectedPayoutId === p.id && (
                <div className="py-2">
                  <DecisionTraceCard entityType="provider_payout" entityId={p.id} />
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
