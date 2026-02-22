import { useCustomerBilling } from "@/hooks/useCustomerBilling";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageSkeleton } from "@/components/PageSkeleton";

function formatCents(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

const statusColors: Record<string, string> = {
  PAID: "default",
  FAILED: "destructive",
  DUE: "secondary",
  UPCOMING: "outline",
  VOID: "secondary",
};

export default function CustomerBillingHistory() {
  const navigate = useNavigate();
  const { invoices, isLoading } = useCustomerBilling();

  if (isLoading) return <PageSkeleton />;

  return (
    <div className="px-4 py-6 space-y-4 animate-fade-in pb-20">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => navigate("/customer/billing")}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">Billing History</h1>
      </div>

      {invoices.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-12">No invoices yet.</p>
      ) : (
        <div className="space-y-2">
          {invoices.map((inv) => (
            <Card
              key={inv.id}
              className="cursor-pointer hover:bg-muted/30 transition-colors"
              onClick={() => navigate(`/customer/billing/receipts/${inv.id}`)}
            >
              <CardContent className="p-4 flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{formatCents(inv.total_cents)}</p>
                    <Badge variant={statusColors[inv.status] as any ?? "secondary"} className="text-[10px]">
                      {inv.status}
                    </Badge>
                    <Badge variant="outline" className="text-[10px]">{inv.invoice_type}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {inv.cycle_start_at && inv.cycle_end_at
                      ? `${new Date(inv.cycle_start_at).toLocaleDateString()} – ${new Date(inv.cycle_end_at).toLocaleDateString()}`
                      : new Date(inv.created_at).toLocaleDateString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
