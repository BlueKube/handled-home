import { useAdminBilling } from "@/hooks/useAdminBilling";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, AlertTriangle, Receipt, Shield } from "lucide-react";
import { PageSkeleton } from "@/components/PageSkeleton";

function formatCents(cents: number) { return `$${(cents / 100).toFixed(2)}`; }

export default function AdminBillingPage() {
  const { paidToday, failedCount, exceptions, isLoading } = useAdminBilling();

  if (isLoading) return <PageSkeleton />;

  return (
    <div className="px-4 py-6 space-y-4 animate-fade-in pb-20">
      <h1 className="text-2xl font-bold">Billing</h1>

      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Collected today" value={formatCents(paidToday)} icon={DollarSign} />
        <StatCard label="Failed payments" value={String(failedCount)} icon={AlertTriangle} />
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Open Exceptions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {exceptions.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No open exceptions. 🎉</p>
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
