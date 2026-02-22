import { useProviderEarnings } from "@/hooks/useProviderEarnings";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DollarSign, AlertTriangle, ChevronRight, Clock, CheckCircle2 } from "lucide-react";
import { PageSkeleton } from "@/components/PageSkeleton";
import { supabase } from "@/integrations/supabase/client";
import { useProviderOrg } from "@/hooks/useProviderOrg";
import { toast } from "sonner";
import { useState } from "react";

function formatCents(cents: number) { return `$${(cents / 100).toFixed(2)}`; }

export default function ProviderPayouts() {
  const navigate = useNavigate();
  const { org } = useProviderOrg();
  const { eligibleBalance, heldBalance, payoutAccount, isAccountReady, isLoading } = useProviderEarnings();
  const [onboarding, setOnboarding] = useState(false);

  const handleSetupPayouts = async () => {
    if (!org?.id) return;
    setOnboarding(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-connect-account", {
        body: { provider_org_id: org.id },
      });
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch {
      toast.error("Could not start payout setup");
    } finally {
      setOnboarding(false);
    }
  };

  if (isLoading) return <PageSkeleton />;

  return (
    <div className="px-4 py-6 space-y-4 animate-fade-in pb-20">
      <h1 className="text-2xl font-bold">Payouts</h1>

      {/* Status */}
      {isAccountReady ? (
        <Card className="border-accent/30 bg-accent/5">
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-accent" />
            <p className="text-sm font-medium">You're all set. Payouts arrive weekly.</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <div className="flex-1">
              <p className="text-sm font-medium">Payout setup required</p>
              <p className="text-xs text-muted-foreground">Complete setup to receive payments.</p>
            </div>
            <Button size="sm" onClick={handleSetupPayouts} disabled={onboarding}>
              {onboarding ? "Opening…" : "Set up"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Balances */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <DollarSign className="h-5 w-5 mx-auto mb-1 text-accent" />
            <p className="text-xl font-bold">{formatCents(eligibleBalance)}</p>
            <p className="text-xs text-muted-foreground">Available</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
            <p className="text-xl font-bold">{formatCents(heldBalance)}</p>
            <p className="text-xs text-muted-foreground">On hold</p>
          </CardContent>
        </Card>
      </div>

      {/* Links */}
      <Card className="cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => navigate("/provider/payouts/history")}>
        <CardContent className="p-4 flex items-center justify-between">
          <p className="text-sm font-medium">Earnings & payout history</p>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </CardContent>
      </Card>
    </div>
  );
}
