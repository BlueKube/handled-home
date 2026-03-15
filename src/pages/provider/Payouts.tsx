import { useProviderEarnings } from "@/hooks/useProviderEarnings";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign, AlertTriangle, ChevronRight, ChevronLeft,
  Clock, CheckCircle2, Calendar, Wallet,
} from "lucide-react";
import { PageSkeleton } from "@/components/PageSkeleton";
import { supabase } from "@/integrations/supabase/client";
import { useProviderOrg } from "@/hooks/useProviderOrg";
import { toast } from "sonner";
import { useState, useMemo } from "react";
import { nextFriday, format } from "date-fns";
import { formatCents } from "@/utils/format";

export default function ProviderPayouts() {
  const navigate = useNavigate();
  const { org } = useProviderOrg();
  const { eligibleBalance, heldBalance, payoutAccount, isAccountReady, isLoading } = useProviderEarnings();
  const [onboarding, setOnboarding] = useState(false);

  const nextPayoutDate = useMemo(() => {
    const now = new Date();
    const nf = nextFriday(now);
    if (now.getDay() === 5 && now.getHours() < 12) {
      return format(now, "EEEE, MMM d");
    }
    return format(nf, "EEEE, MMM d");
  }, []);

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
    <div className="animate-fade-in p-4 pb-24 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/provider/earnings")}
          aria-label="Back to earnings"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-h2">Payouts</h1>
      </div>

      {/* Account status */}
      {isAccountReady ? (
        <Card className="border-success/30 bg-success/5">
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
            <p className="text-sm font-medium">You're all set. Payouts arrive weekly.</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-warning/30 bg-warning/5">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-warning shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium">Payout setup required</p>
              <p className="text-xs text-muted-foreground">Complete setup to receive payments.</p>
            </div>
            <Button size="default" className="h-11" onClick={handleSetupPayouts} disabled={onboarding}>
              {onboarding ? "Opening..." : "Set up"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Balances */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-4 text-center space-y-1">
            <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center mx-auto">
              <DollarSign className="h-5 w-5 text-accent" />
            </div>
            <p className="text-xl font-bold">{formatCents(eligibleBalance)}</p>
            <p className="text-xs text-muted-foreground">Available</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center space-y-1">
            <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center mx-auto">
              <Clock className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-xl font-bold">{formatCents(heldBalance)}</p>
            <p className="text-xs text-muted-foreground">On hold</p>
          </CardContent>
        </Card>
      </div>

      {/* Next payout card */}
      {isAccountReady && eligibleBalance > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4 flex items-center gap-3">
            <Calendar className="h-5 w-5 text-primary shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium">Next payout: {nextPayoutDate}</p>
              <p className="text-xs text-muted-foreground">Estimated · Weekly Friday cadence</p>
            </div>
            <Badge variant="outline" className="text-xs">{formatCents(eligibleBalance)}</Badge>
          </CardContent>
        </Card>
      )}

      {/* Zero balance empty state */}
      {eligibleBalance === 0 && heldBalance === 0 && isAccountReady && (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Wallet className="h-10 w-10 text-muted-foreground/40 mb-3" />
          <p className="text-sm font-semibold text-foreground">No pending payouts</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-[260px]">
            Complete jobs to start earning. Payouts are processed every Friday.
          </p>
        </div>
      )}

      {/* History link */}
      <Card
        variant="interactive"
        className="cursor-pointer"
        onClick={() => navigate("/provider/payouts/history")}
      >
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm font-medium">Earnings & payout history</p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </CardContent>
      </Card>
    </div>
  );
}
