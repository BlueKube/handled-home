import { useNavigate } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { ChevronLeft } from "lucide-react";
import { useCustomerSubscription } from "@/hooks/useSubscription";
import { useHandleBalance, usePlanHandlesConfig } from "@/hooks/useHandles";
import { CreditsRing } from "@/components/customer/CreditsRing";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { CreditsTopUpTab } from "./credits/CreditsTopUpTab";
import { CreditsHistoryTab } from "./credits/CreditsHistoryTab";
import { CreditsHowItWorksTab } from "./credits/CreditsHowItWorksTab";

function computeAnnualCap(perCycle: number, cycleDays: number): number {
  if (perCycle <= 0 || cycleDays <= 0) return 0;
  return Math.round(perCycle * (365 / cycleDays));
}

export default function CustomerCredits() {
  const navigate = useNavigate();
  const { data: subscription, isLoading: subLoading } = useCustomerSubscription();
  const { data: balance } = useHandleBalance();
  const { data: planHandles } = usePlanHandlesConfig(subscription?.plan_id ?? null);

  if (subLoading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="p-4 pb-24 space-y-4 animate-fade-in text-center">
        <h1 className="text-h2">Credits</h1>
        <p className="text-muted-foreground text-sm">
          You need an active plan to see your credit balance.
        </p>
        <Button onClick={() => navigate("/customer/plans")}>Browse plans</Button>
      </div>
    );
  }

  const perCycle = planHandles?.handles_per_cycle ?? 0;
  const cycleDays = subscription.billing_cycle_length_days ?? 28;
  const annualCap = computeAnnualCap(perCycle, cycleDays);
  const resetText = subscription.billing_cycle_end_at
    ? `Resets ${format(parseISO(subscription.billing_cycle_end_at), "MMM d")}`
    : "—";

  return (
    <div className="p-4 pb-24 space-y-6 animate-fade-in">
      <div>
        <button
          onClick={() => navigate("/customer/more")}
          className="flex items-center gap-1 text-muted-foreground mb-2 hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
          aria-label="Back to More menu"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="text-sm">More</span>
        </button>
        <h1 className="text-h2">Credits</h1>
      </div>

      <div className="flex flex-col items-center gap-4 py-6 rounded-xl border border-border bg-card">
        <CreditsRing
          balance={balance ?? 0}
          perCycle={perCycle}
          annualCap={annualCap}
          variant="hero"
        />
        <div className="text-center space-y-1">
          <p className="text-sm text-muted-foreground">{resetText}</p>
          {perCycle > 0 && (
            <p className="text-xs text-muted-foreground">
              {perCycle} credits this cycle · up to {annualCap} per year
            </p>
          )}
        </div>
      </div>

      <Tabs defaultValue="topup">
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="topup">Top up</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="howitworks">How it works</TabsTrigger>
        </TabsList>

        <TabsContent value="topup" className="mt-4">
          <CreditsTopUpTab />
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <CreditsHistoryTab subscriptionId={subscription.id} />
        </TabsContent>

        <TabsContent value="howitworks" className="mt-4">
          <CreditsHowItWorksTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
