import { useParams, useNavigate } from "react-router-dom";
import { useAdminProviderLedger } from "@/hooks/useAdminProviderLedger";
import { PageSkeleton } from "@/components/PageSkeleton";
import { StatusBadge } from "@/components/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Unlock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

export default function AdminProviderLedger() {
  const { providerOrgId } = useParams<{ providerOrgId: string }>();
  const navigate = useNavigate();
  const { org, payoutAccount, earnings, holds, payouts, isLoading } = useAdminProviderLedger(providerOrgId);

  if (isLoading) return <PageSkeleton />;

  const handleReleaseHold = async (holdId: string) => {
    const { error } = await supabase.rpc("admin_release_hold", {
      p_hold_id: holdId,
      p_reason: "Admin released from ledger view",
    });
    if (error) toast.error(error.message);
    else toast.success("Hold released");
  };

  const totalEarned = earnings.reduce((s, e) => s + e.total_cents, 0);
  const totalPaid = payouts.filter(p => p.status === "PAID").reduce((s, p) => s + p.total_cents, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{org?.name || "Provider"}</h1>
          <p className="text-sm text-muted-foreground">Provider Payout Ledger</p>
        </div>
      </div>

      {/* Payout Account Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Payout Account</CardTitle>
        </CardHeader>
        <CardContent>
          {payoutAccount ? (
            <div className="flex items-center justify-between">
              <p className="text-sm">Account ID: {payoutAccount.processor_account_id || "—"}</p>
              <StatusBadge status={payoutAccount.status} />
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">No payout account configured</p>
          )}
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Total Earned</p>
            <p className="text-2xl font-bold">${(totalEarned / 100).toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Total Paid Out</p>
            <p className="text-2xl font-bold">${(totalPaid / 100).toFixed(2)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Active Holds */}
      {holds.filter(h => h.status === "ACTIVE").length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Active Holds ({holds.filter(h => h.status === "ACTIVE").length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {holds.filter(h => h.status === "ACTIVE").map((hold) => (
              <div key={hold.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant="destructive">{hold.severity}</Badge>
                    <Badge variant="outline">{hold.hold_type}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{hold.reason_category || "No category"}</p>
                  {(hold as any).provider_hold_context?.map((ctx: any) => (
                    <p key={ctx.id} className="text-xs text-muted-foreground italic mt-1">"{ctx.note}"</p>
                  ))}
                </div>
                <Button variant="outline" size="sm" onClick={() => handleReleaseHold(hold.id)}>
                  <Unlock className="h-3 w-3 mr-1" /> Release
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Earnings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Earnings ({earnings.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {earnings.length === 0 && <p className="text-muted-foreground text-sm">No earnings</p>}
          {earnings.map((e) => (
            <div key={e.id} className="flex items-center justify-between p-2 border rounded">
              <div>
                <p className="text-sm font-medium">${(e.total_cents / 100).toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">
                  {(e as any).jobs?.properties?.street_address || "Job"} — {(e as any).jobs?.scheduled_date || "—"}
                </p>
              </div>
              <StatusBadge status={e.status} />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Payouts */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Payouts ({payouts.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {payouts.length === 0 && <p className="text-muted-foreground text-sm">No payouts</p>}
          {payouts.map((p) => (
            <div key={p.id} className="flex items-center justify-between p-2 border rounded">
              <div>
                <p className="text-sm font-medium">${(p.total_cents / 100).toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">{format(new Date(p.created_at), "MMM d, yyyy")}</p>
              </div>
              <StatusBadge status={p.status} />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
