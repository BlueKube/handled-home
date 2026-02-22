import { useAdminBilling } from "@/hooks/useAdminBilling";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/StatCard";
import { DollarSign, Clock } from "lucide-react";
import { PageSkeleton } from "@/components/PageSkeleton";

function formatCents(cents: number) { return `$${(cents / 100).toFixed(2)}`; }

export default function AdminPayoutsPage() {
  const { payouts, isLoading } = useAdminBilling();

  if (isLoading) return <PageSkeleton />;

  const paidTotal = payouts.filter(p => p.status === "PAID").reduce((s, p) => s + p.total_cents, 0);
  const pendingCount = payouts.filter(p => p.status === "INITIATED").length;

  return (
    <div className="px-4 py-6 space-y-4 animate-fade-in pb-20">
      <h1 className="text-2xl font-bold">Payouts</h1>

      <div className="grid grid-cols-2 gap-3">
        <StatCard title="Total paid out" value={formatCents(paidTotal)} icon={DollarSign} />
        <StatCard title="Pending" value={String(pendingCount)} icon={Clock} />
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Recent Payouts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {payouts.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No payouts yet.</p>
          ) : payouts.slice(0, 20).map((p) => (
            <div key={p.id} className="flex items-center justify-between py-2 border-b last:border-0">
              <div>
                <p className="text-sm font-medium">{formatCents(p.total_cents)}</p>
                <p className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</p>
              </div>
              <Badge variant={p.status === "PAID" ? "default" : p.status === "FAILED" ? "destructive" : "secondary"} className="text-[10px]">
                {p.status}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
