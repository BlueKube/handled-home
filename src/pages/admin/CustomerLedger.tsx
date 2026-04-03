import { useParams, useNavigate } from "react-router-dom";
import { useAdminCustomerLedger } from "@/hooks/useAdminCustomerLedger";
import { PageSkeleton } from "@/components/PageSkeleton";
import { StatusBadge } from "@/components/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ChevronLeft, CreditCard, RefreshCw, XCircle, Gift } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

export default function AdminCustomerLedger() {
  const { customerId } = useParams<{ customerId: string }>();
  const navigate = useNavigate();
  const { profile, subscription, invoices, credits, payments, isLoading } = useAdminCustomerLedger(customerId);
  const [customAmount, setCustomAmount] = useState("");

  if (isLoading) return <PageSkeleton />;

  const handleApplyCredit = async (tier: number) => {
    if (!customerId) return;
    const { error } = await supabase.rpc("admin_apply_credit", {
      p_customer_id: customerId,
      p_amount_cents: tier * 100,
      p_reason: `Admin applied $${tier} credit`,
    });
    if (error) toast.error(error.message);
    else toast.success(`$${tier} credit applied`);
  };

  const handleVoidInvoice = async (invoiceId: string) => {
    const { error } = await supabase.rpc("admin_void_invoice", {
      p_invoice_id: invoiceId,
      p_reason: "Admin voided from ledger view",
    });
    if (error) toast.error(error.message);
    else toast.success("Invoice voided");
  };

  const handleRefundInvoice = async (invoiceId: string, amountCents: number) => {
    const { error } = await supabase.rpc("admin_issue_refund", {
      p_invoice_id: invoiceId,
      p_amount_cents: amountCents,
      p_reason: "Admin refund from ledger view",
    });
    if (error) toast.error(error.message);
    else toast.success("Refund issued");
  };

  return (
    <div className="animate-fade-in p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} aria-label="Back">
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-h2">{profile?.full_name || "Customer"}</h1>
          <p className="text-sm text-muted-foreground">Customer Billing Ledger</p>
        </div>
      </div>

      {/* Subscription Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Subscription</CardTitle>
        </CardHeader>
        <CardContent>
          {subscription ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{(subscription as any).plans?.name || "Plan"}</p>
                <p className="text-sm text-muted-foreground">
                  Cycle: {subscription.billing_cycle_start_at ? format(new Date(subscription.billing_cycle_start_at), "MMM d") : "—"} – {subscription.billing_cycle_end_at ? format(new Date(subscription.billing_cycle_end_at), "MMM d, yyyy") : "—"}
                </p>
              </div>
              <StatusBadge status={subscription.status} />
            </div>
          ) : (
            <p className="text-muted-foreground">No active subscription</p>
          )}
        </CardContent>
      </Card>

      {/* Admin Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><Gift className="h-4 w-4" /> Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => handleApplyCredit(10)}>
            <CreditCard className="h-4 w-4 mr-1" /> Credit $10
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleApplyCredit(25)}>
            <CreditCard className="h-4 w-4 mr-1" /> Credit $25
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleApplyCredit(50)}>
            <CreditCard className="h-4 w-4 mr-1" /> Credit $50
          </Button>
          <div className="flex gap-1 items-center">
            <Input
              type="number"
              placeholder="Custom $"
              className="h-8 w-24 text-xs"
              min={1}
              max={500}
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
            />
            <Button
              variant="outline"
              size="sm"
              disabled={!customAmount || Number(customAmount) <= 0}
              onClick={() => {
                handleApplyCredit(Number(customAmount));
                setCustomAmount("");
              }}
            >
              Apply
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Invoices */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Invoices ({invoices.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {invoices.length === 0 && <p className="text-muted-foreground text-sm">No invoices yet</p>}
          {invoices.map((inv) => (
            <div key={inv.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{inv.invoice_type}</Badge>
                  <StatusBadge status={inv.status} />
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {inv.cycle_start_at ? format(new Date(inv.cycle_start_at), "MMM d") : "—"} – {inv.cycle_end_at ? format(new Date(inv.cycle_end_at), "MMM d") : "—"}
                </p>
                {(inv as any).customer_invoice_line_items?.map((li: any) => (
                  <p key={li.id} className="text-xs text-muted-foreground">{li.label}: ${(li.amount_cents / 100).toFixed(2)}</p>
                ))}
              </div>
              <div className="text-right space-y-1">
                <p className="font-semibold">${(inv.total_cents / 100).toFixed(2)}</p>
                <div className="flex gap-1">
                  {(inv.status === "UPCOMING" || inv.status === "DUE") && (
                    <Button variant="ghost" size="sm" onClick={() => handleVoidInvoice(inv.id)}>
                      <XCircle className="h-3 w-3 mr-1" /> Void
                    </Button>
                  )}
                  {inv.status === "PAID" && (
                    <Button variant="ghost" size="sm" onClick={() => handleRefundInvoice(inv.id, inv.total_cents)}>
                      <RefreshCw className="h-3 w-3 mr-1" /> Refund
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Credits */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Credits ({credits.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {credits.length === 0 && <p className="text-muted-foreground text-sm">No credits</p>}
          {credits.map((c) => (
            <div key={c.id} className="flex items-center justify-between p-2 border rounded">
              <div>
                <p className="text-sm font-medium">${(c.amount_cents / 100).toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">{c.reason || "—"}</p>
              </div>
              <StatusBadge status={c.status} />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Payment Attempts */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Payment Attempts ({payments.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {payments.length === 0 && <p className="text-muted-foreground text-sm">No payments</p>}
          {payments.map((p) => (
            <div key={p.id} className="flex items-center justify-between p-2 border rounded">
              <div>
                <p className="text-sm">${(p.amount_cents / 100).toFixed(2)} — Attempt #{p.attempt_number}</p>
                <p className="text-xs text-muted-foreground">{format(new Date(p.created_at), "MMM d, yyyy h:mm a")}</p>
              </div>
              <StatusBadge status={p.status} />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
