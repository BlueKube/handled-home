import { useState, useCallback } from "react";
import { CalendarDays, Sparkles, X, Settings2, Plus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useProperty } from "@/hooks/useProperty";
import { QueryErrorCard } from "@/components/QueryErrorCard";
import { useServiceDayAssignment } from "@/hooks/useServiceDayAssignment";
import { useRoutine } from "@/hooks/useRoutine";
import { useCustomerSubscription } from "@/hooks/useSubscription";
import { useCustomerJobs } from "@/hooks/useCustomerJobs";
import { useHandleBalance, usePlanHandlesConfig } from "@/hooks/useHandles";
import { useAddRoutineItem, useRemoveRoutineItem } from "@/hooks/useRoutineActions";
import { usePropertyCoverage } from "@/hooks/usePropertyCoverage";
import { usePropertySignals } from "@/hooks/usePropertySignals";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CustomerNotificationBanners } from "@/components/customer/NotificationBanners";
import { SmartAppBanner } from "@/components/SmartAppBanner";
import { HomeSetupCard } from "@/components/customer/HomeSetupCard";
import { NextVisitCard } from "@/components/customer/NextVisitCard";
import { CreditsRing } from "@/components/customer/CreditsRing";
import { LowCreditsBanner } from "@/components/customer/LowCreditsBanner";
import { HomeSuggestions } from "@/components/customer/HomeSuggestions";
import { PropertyHealthWidget } from "@/components/customer/PropertyHealthWidget";
import { FloatingAddButton } from "@/components/customer/FloatingAddButton";
import { AddServiceDrawer } from "@/components/customer/AddServiceDrawer";
import { SeasonalPlanCard } from "@/components/customer/SeasonalPlanCard";
import { CycleStatsRow } from "@/components/customer/CycleStatsRow";
import { HelpTip } from "@/components/ui/help-tip";
import { HomeTeamCard } from "@/components/customer/HomeTeamCard";
import { HomeTeamExpandCard } from "@/components/customer/HomeTeamExpandCard";
import { FirstServiceCelebration } from "@/components/customer/FirstServiceCelebration";
import { toast } from "sonner";

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const NUDGE_DISMISS_KEY = "routine_nudge_dismissed_at";

function isNudgeDismissed(): boolean {
  const val = localStorage.getItem(NUDGE_DISMISS_KEY);
  if (!val) return false;
  const dismissedAt = parseInt(val, 10);
  return Date.now() - dismissedAt < 7 * 24 * 60 * 60 * 1000;
}

export default function CustomerDashboard() {
  const { user } = useAuth();
  const { property, isError: propertyError } = useProperty();
  const { assignment, isLoading } = useServiceDayAssignment(property?.id);
  const { data: subscription } = useCustomerSubscription();
  const { data: routineData } = useRoutine(property?.id, subscription?.plan_id);
  const { data: upcomingJobs, isLoading: jobsLoading } = useCustomerJobs("upcoming");
  const { data: completedJobs } = useCustomerJobs("completed");
  const { data: handleBalance } = useHandleBalance();
  const { data: planHandles } = usePlanHandlesConfig(subscription?.plan_id);
  const addItem = useAddRoutineItem();
  const removeItem = useRemoveRoutineItem();
  const { hasData: hasCoverage } = usePropertyCoverage();
  const { hasData: hasSignals } = usePropertySignals();
  const navigate = useNavigate();
  const [nudgeDismissed, setNudgeDismissed] = useState(isNudgeDismissed);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const serviceDayConfirmed = assignment?.status === "confirmed";
  // Mirrors HomeSetupCard completion check — cached by React Query
  const setupComplete = hasCoverage && hasSignals;
  const routineItems = routineData?.items ?? [];
  const nextJob = upcomingJobs?.[0] ?? null;
  const lastCompletedJob = completedJobs?.[0] ?? null;

  const showServiceDayBanner = !isLoading && !assignment && setupComplete;
  const showServiceDayOffer = !isLoading && assignment?.status === "offered";
  const showRoutineNotEffective =
    routineData?.routine.status === "active" &&
    routineData?.version?.status === "locked" &&
    routineData?.version?.effective_at &&
    new Date(routineData.version.effective_at) > new Date();

  const showRoutineNudge =
    !nudgeDismissed &&
    routineData?.routine.status === "draft" &&
    routineData.items.length > 0 &&
    new Date(routineData.routine.updated_at).getTime() < Date.now() - 24 * 60 * 60 * 1000;

  const dismissNudge = () => {
    localStorage.setItem(NUDGE_DISMISS_KEY, String(Date.now()));
    setNudgeDismissed(true);
  };

  // Add to routine from suggestion
  const handleAddToRoutine = useCallback(
    (skuId: string, levelId?: string | null) => {
      const versionId = routineData?.version?.id;
      if (!versionId) {
        toast.error("Set up your routine first");
        navigate("/customer/routine");
        return;
      }
      addItem.mutate({ versionId, skuId, levelId });
    },
    [routineData?.version?.id, addItem, navigate]
  );

  // Undo last add
  const handleUndo = useCallback(
    (skuId: string) => {
      const item = routineItems.find((i) => i.sku_id === skuId);
      if (item) {
        removeItem.mutate(item.id);
        toast("Service removed");
      }
    },
    [routineItems, removeItem]
  );

  if (propertyError) {
    return (
      <div className="p-4">
        <QueryErrorCard message="Could not load your property data." />
      </div>
    );
  }

  return (
    <div className="p-4 pb-24 space-y-4 animate-fade-in">
      {/* Header */}
      <div>
        {subscription ? (
          <>
            <h1 className="text-h2 mb-1">Your home is handled.</h1>
            <p className="text-caption">
              Welcome back{user?.user_metadata?.full_name ? `, ${user.user_metadata.full_name.split(" ")[0]}` : ""}.
            </p>
          </>
        ) : setupComplete ? (
          <>
            <h1 className="text-h2 mb-1">Almost there.</h1>
            <p className="text-caption">Choose a plan to start your home maintenance routine.</p>
          </>
        ) : (
          <>
            <h1 className="text-h2 mb-1">Let's get started.</h1>
            <p className="text-caption">Complete your home profile to unlock personalized services.</p>
          </>
        )}
      </div>

      {/* Notification Banners */}
      <CustomerNotificationBanners />

      {/* Your Home Team */}
      <HomeTeamCard serviceDayConfirmed={serviceDayConfirmed} />
      <HomeTeamExpandCard />

      {/* Home Setup Prompt */}
      <HomeSetupCard />

      {/* Subscription Bridge CTA — setup complete but no subscription */}
      {setupComplete && !subscription && (
        <Card className="p-4 space-y-3 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
              <Sparkles className="h-4 w-4 text-accent" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold">Your home profile is ready</p>
              <p className="text-xs text-muted-foreground">
                Choose a plan to start your recurring maintenance routine.
              </p>
            </div>
          </div>
          <Button
            className="w-full"
            onClick={() => navigate("/customer/plans")}
          >
            Browse plans
          </Button>
        </Card>
      )}

      {/* Truth Banners */}
      {showServiceDayBanner && (
        <Card className="p-4 space-y-2">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
              <CalendarDays className="h-4 w-4 text-accent animate-pulse" />
            </div>
            <div>
              <p className="text-sm font-medium">Finding your best service day</p>
              <p className="text-xs text-muted-foreground">
                We're matching your area and preferences — usually ready within a few hours.
              </p>
            </div>
          </div>
        </Card>
      )}

      {showServiceDayOffer && (
        <Card
          className="p-4 flex items-center justify-between cursor-pointer hover:bg-secondary/50 transition-colors"
          onClick={() => navigate("/customer/service-day")}
        >
          <div className="flex items-center gap-3">
            <CalendarDays className="h-5 w-5 text-accent" />
            <p className="text-sm font-medium">Confirm your Service Day to activate your plan.</p>
          </div>
          <Button variant="ghost" size="sm">View →</Button>
        </Card>
      )}

      {showRoutineNotEffective && (
        <Card className="p-4 flex items-center gap-3 bg-accent/5 border-accent/20">
          <Settings2 className="h-4 w-4 text-accent" />
          <p className="text-sm text-muted-foreground">Your routine updates take effect next cycle.</p>
        </Card>
      )}

      {showRoutineNudge && (
        <Card className="p-4 flex items-center justify-between cursor-pointer hover:bg-accent/5 transition-colors border-accent/30">
          <div className="flex items-center gap-3 flex-1" onClick={() => navigate("/customer/routine")}>
            <Sparkles className="h-5 w-5 text-accent" />
            <div>
              <p className="text-sm font-medium">Finish your routine</p>
              <p className="text-xs text-muted-foreground">
                You have {routineData!.items.length} service{routineData!.items.length !== 1 ? "s" : ""} ready to confirm.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={() => navigate("/customer/routine")}>Continue →</Button>
            <button
              onClick={(e) => { e.stopPropagation(); dismissNudge(); }}
              className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </Card>
      )}

      {/* No routine CTA */}
      {routineItems.length === 0 && !showRoutineNudge && (
        <Card
          className="p-4 cursor-pointer hover:bg-primary/5 transition-colors border-primary/20"
          onClick={() => navigate("/customer/routine")}
        >
          <div className="flex items-center gap-3">
            <Plus className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-medium">Start your routine</p>
              <p className="text-xs text-muted-foreground">
                Choose services to keep your home maintained automatically.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Section A — Next Up */}
      <div className="space-y-2">
        <div className="flex items-center justify-between pr-16">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Next Up</p>
          <Button variant="link" size="sm" className="text-xs h-auto p-0" onClick={() => navigate("/customer/schedule")}>
            View schedule →
          </Button>
        </div>
        <NextVisitCard job={nextJob} isLoading={jobsLoading} />
      </div>

      {/* Cycle Stats */}
      {serviceDayConfirmed && (
        <CycleStatsRow
          upcomingCount={upcomingJobs?.length ?? 0}
          completedCount={completedJobs?.length ?? 0}
          handlesUsed={handleBalance ?? null}
          handlesPerCycle={planHandles?.handles_per_cycle ?? null}
        />
      )}

      {/* Credits balance */}
      {handleBalance != null && planHandles && planHandles.handles_per_cycle > 0 && (() => {
        const cycleDays = subscription?.billing_cycle_length_days ?? null;
        const annualCap = cycleDays
          ? Math.round(planHandles.handles_per_cycle * (365 / cycleDays))
          : 0;
        return (
          <div className="space-y-3">
            <LowCreditsBanner
              balance={handleBalance}
              annualCap={annualCap}
              onTopUp={() => navigate("/customer/credits")}
            />
            <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4">
              <CreditsRing
                balance={handleBalance}
                perCycle={planHandles.handles_per_cycle}
                annualCap={annualCap}
                variant="compact"
              />
              <div className="flex-1">
                <div className="flex items-center gap-1">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Credits balance
                  </p>
                  <HelpTip text="Credits are your service allowance — each service you book costs a set number. Unused credits roll over up to your plan's cap." />
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {planHandles.handles_per_cycle} credits per cycle
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={() => navigate("/customer/credits")}>
                Top up
              </Button>
            </div>
          </div>
        );
      })()}

      {/* Property Health Score */}
      <PropertyHealthWidget propertyId={property?.id} />

      {/* Suggested for Your Home */}
      <HomeSuggestions onAddToRoutine={handleAddToRoutine} onUndo={handleUndo} />

      {/* Smart App Banner (demoted below product content) */}
      <SmartAppBanner />

      {/* First Service Celebration */}
      {lastCompletedJob && (
        <FirstServiceCelebration
          jobId={lastCompletedJob.id}
          serviceDate={lastCompletedJob.scheduled_date ?? undefined}
        />
      )}

      {/* Seasonal Plan Card */}
      <SeasonalPlanCard propertyId={property?.id} zoneId={subscription?.zone_id} />

      {/* Floating Add Button */}
      <FloatingAddButton onClick={() => setDrawerOpen(true)} />

      {/* Add Service Drawer */}
      <AddServiceDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onBrowseAll={() => navigate("/customer/routine")}
        onAddToRoutine={handleAddToRoutine}
        onUndo={handleUndo}
      />
    </div>
  );
}
