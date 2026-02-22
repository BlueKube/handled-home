import { useAuth } from "@/contexts/AuthContext";
import { useCustomerSubscription } from "@/hooks/useSubscription";
import { useCustomerBilling } from "@/hooks/useCustomerBilling";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Clock, Receipt, ChevronRight, AlertTriangle, Gift } from "lucide-react";
import { PageSkeleton } from "@/components/PageSkeleton";

function formatCents(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function CustomerBillingPage() {
  const navigate = useNavigate();
  const { data: subscription, isLoading: subLoading } = useCustomerSubscription();
  const { defaultMethod, availableCredits, latestInvoice, hasFailedPayment, isLoading } = useCustomerBilling();

  if (isLoading || subLoading) return <PageSkeleton />;

  const statusColor = hasFailedPayment ? "destructive" : latestInvoice?.status === "PAID" ? "default" : "secondary";
  const statusLabel = hasFailedPayment ? "Action needed" : latestInvoice?.status === "PAID" ? "Paid" : latestInvoice?.status ?? "No invoices";

  return (
    <div className="px-4 py-6 space-y-4 animate-fade-in pb-20">
      <h1 className="text-2xl font-bold">Billing</h1>

      {/* Current Plan */}
      <Card>
        <CardContent className="p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Current plan</p>
              <p className="text-lg font-semibold">{subscription?.plan_id ? "Active plan" : "No plan"}</p>
            </div>
            <Badge variant={statusColor as any}>{statusLabel}</Badge>
          </div>
          {subscription?.billing_cycle_end_at && (
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              Next bill: {new Date(subscription.billing_cycle_end_at).toLocaleDateString()}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Failed Payment CTA */}
      {hasFailedPayment && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium">Payment failed</p>
              <p className="text-xs text-muted-foreground">Update your payment method to avoid interruption.</p>
            </div>
            <Button variant="destructive" size="sm" onClick={() => navigate("/customer/billing/methods")}>
              Fix
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Default Payment Method */}
      <Card className="cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => navigate("/customer/billing/methods")}>
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CreditCard className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Payment method</p>
              {defaultMethod ? (
                <p className="text-sm text-muted-foreground capitalize">
                  {defaultMethod.brand} ····{defaultMethod.last4}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">No method on file</p>
              )}
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </CardContent>
      </Card>

      {/* Credits */}
      {availableCredits > 0 && (
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Gift className="h-5 w-5 text-accent" />
            <div>
              <p className="text-sm font-medium">Credits available</p>
              <p className="text-sm text-muted-foreground">{formatCents(availableCredits)} — auto-applied on next bill</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Billing History */}
      <Card className="cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => navigate("/customer/billing/history")}>
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Receipt className="h-5 w-5 text-muted-foreground" />
            <p className="text-sm font-medium">Billing history</p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </CardContent>
      </Card>
    </div>
  );
}
