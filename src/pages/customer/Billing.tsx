import { useCustomerSubscription } from "@/hooks/useSubscription";
import { useCustomerBilling } from "@/hooks/useCustomerBilling";
import { usePlanDetail } from "@/hooks/usePlans";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Clock, Receipt, ChevronRight, AlertTriangle, Gift, ChevronLeft } from "lucide-react";
import { PageSkeleton } from "@/components/PageSkeleton";
import { QueryErrorCard } from "@/components/QueryErrorCard";
import { EmptyState } from "@/components/ui/empty-state";
import { HelpTip } from "@/components/ui/help-tip";
import { formatCents } from "@/utils/format";

export default function CustomerBillingPage() {
  const navigate = useNavigate();
  const { data: subscription, isLoading: subLoading } = useCustomerSubscription();
  const { defaultMethod, availableCredits, latestInvoice, hasFailedPayment, isLoading, isError, refetch } = useCustomerBilling();
  const { data: currentPlan } = usePlanDetail(subscription?.plan_id ?? null);

  if (isLoading || subLoading) return <PageSkeleton />;

  if (isError) {
    return (
      <div className="animate-fade-in p-4 pb-24">
        <button onClick={() => navigate("/customer/more")} className="flex items-center gap-1 text-muted-foreground mb-2 hover:text-foreground transition-colors" aria-label="Back to More menu">
          <ChevronLeft className="h-4 w-4" />
          <span className="text-sm">More</span>
        </button>
        <h1 className="text-h2 mb-4">Billing</h1>
        <QueryErrorCard message="Failed to load billing information." onRetry={() => refetch()} />
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="p-4 space-y-4 animate-fade-in pb-24">
        <button onClick={() => navigate("/customer/more")} className="flex items-center gap-1 text-muted-foreground mb-2 hover:text-foreground transition-colors" aria-label="Back to More menu">
          <ChevronLeft className="h-4 w-4" />
          <span className="text-sm">More</span>
        </button>
        <h1 className="text-h2">Billing <HelpTip text="Your billing cycle renews automatically. You can pause, change plans, or cancel anytime from this page." /></h1>
        <EmptyState
          icon={CreditCard}
          title="No billing activity yet"
          body="Your first invoice will appear here once your membership begins."
          ctaLabel="View Plans"
          ctaAction={() => navigate("/customer/plans")}
        />
      </div>
    );
  }

  const statusColor = hasFailedPayment ? "destructive" : latestInvoice?.status === "PAID" ? "default" : "secondary";
  const statusLabel = hasFailedPayment ? "Action needed" : latestInvoice?.status === "PAID" ? "Paid" : latestInvoice?.status ?? "No invoices";

  return (
    <div className="p-4 space-y-4 animate-fade-in pb-24">
      <button onClick={() => navigate("/customer/more")} className="flex items-center gap-1 text-muted-foreground mb-2 hover:text-foreground transition-colors" aria-label="Back to More menu">
        <ChevronLeft className="h-4 w-4" />
        <span className="text-sm">More</span>
      </button>
      <h1 className="text-h2">Billing <HelpTip text="Your billing cycle renews automatically. You can pause, change plans, or cancel anytime from this page." /></h1>

      {/* Current Plan */}
      <Card>
        <CardContent className="p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Current plan</p>
              <p className="text-lg font-semibold">{currentPlan?.name ?? (subscription?.plan_id ? "Active plan" : "No plan")}</p>
            </div>
            <Badge variant={statusColor as any}>{statusLabel}</Badge>
          </div>
          {subscription?.billing_cycle_end_at && (
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              Next bill: {new Date(subscription.billing_cycle_end_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              {currentPlan?.display_price_text && (
                <span className="font-medium text-foreground ml-1">
                  · Plan: {currentPlan.display_price_text}
                </span>
              )}
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
