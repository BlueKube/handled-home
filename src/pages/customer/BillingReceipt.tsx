import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, AlertTriangle } from "lucide-react";
import { PageSkeleton } from "@/components/PageSkeleton";

function formatCents(cents: number) { return `$${(cents / 100).toFixed(2)}`; }

export default function CustomerBillingReceipt() {
  const { invoiceId } = useParams();
  const navigate = useNavigate();

  const { data: invoice, isLoading } = useQuery({
    queryKey: ["invoice-detail", invoiceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customer_invoices")
        .select("*")
        .eq("id", invoiceId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!invoiceId,
  });

  const { data: lineItems } = useQuery({
    queryKey: ["invoice-line-items", invoiceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customer_invoice_line_items")
        .select("*")
        .eq("invoice_id", invoiceId!)
        .order("created_at");
      if (error) throw error;
      return data;
    },
    enabled: !!invoiceId,
  });

  if (isLoading) return <PageSkeleton />;
  if (!invoice) return <p className="p-4 text-muted-foreground">Invoice not found.</p>;

  const typeGroups = { PLAN: [] as any[], ADD_ON: [] as any[], CREDIT: [] as any[], TAX: [] as any[] };
  (lineItems ?? []).forEach(li => {
    const key = li.type as keyof typeof typeGroups;
    if (typeGroups[key]) typeGroups[key].push(li);
    else typeGroups.PLAN.push(li);
  });

  return (
    <div className="px-4 py-6 space-y-4 animate-fade-in pb-20">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => navigate("/customer/billing/history")}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">Receipt</h1>
      </div>

      <Card>
        <CardContent className="p-4 space-y-3">
          {invoice.cycle_start_at && invoice.cycle_end_at && (
            <p className="text-sm text-muted-foreground">
              {new Date(invoice.cycle_start_at).toLocaleDateString()} – {new Date(invoice.cycle_end_at).toLocaleDateString()}
            </p>
          )}

          {Object.entries(typeGroups).map(([type, items]) =>
            items.length > 0 ? (
              <div key={type}>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">{type.replace("_", " ")}</p>
                {items.map((li: any) => (
                  <div key={li.id} className="flex justify-between text-sm py-0.5">
                    <span>{li.label}</span>
                    <span className={li.amount_cents < 0 ? "text-accent" : ""}>{formatCents(li.amount_cents)}</span>
                  </div>
                ))}
              </div>
            ) : null
          )}

          <div className="border-t pt-2 flex justify-between font-semibold">
            <span>Total</span>
            <span>{formatCents(invoice.total_cents)}</span>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <Badge variant={invoice.status === "PAID" ? "default" : "destructive"}>{invoice.status}</Badge>
          </div>

          {invoice.status === "FAILED" && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/5 border border-destructive/20">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <div className="flex-1">
                <p className="text-sm font-medium">Payment failed</p>
              </div>
              <Button variant="destructive" size="sm" onClick={() => navigate("/customer/billing/methods")}>
                Fix
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
