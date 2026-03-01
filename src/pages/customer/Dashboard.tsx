import { useState, useCallback } from "react";
import { CalendarDays, Loader2, Sparkles, X, Settings2, Plus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useProperty } from "@/hooks/useProperty";
import { useServiceDayAssignment } from "@/hooks/useServiceDayAssignment";
import { useRoutine } from "@/hooks/useRoutine";
import { useCustomerSubscription } from "@/hooks/useSubscription";
import { useCustomerJobs } from "@/hooks/useCustomerJobs";
import { useHandleBalance, usePlanHandlesConfig } from "@/hooks/useHandles";
import { useAddRoutineItem, useRemoveRoutineItem } from "@/hooks/useRoutineActions";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CustomerNotificationBanners } from "@/components/customer/NotificationBanners";
import { HomeSetupCard } from "@/components/customer/HomeSetupCard";
import { NextVisitCard } from "@/components/customer/NextVisitCard";
import { HandleBalanceBar } from "@/components/customer/HandleBalanceBar";
import { ThisCycleSummary } from "@/components/customer/ThisCycleSummary";
import { HomeSuggestions } from "@/components/customer/HomeSuggestions";
import { RecentReceipt } from "@/components/customer/RecentReceipt";
import { PropertyHealthWidget } from "@/components/customer/PropertyHealthWidget";
import { FloatingAddButton } from "@/components/customer/FloatingAddButton";
import { AddServiceDrawer } from "@/components/customer/AddServiceDrawer";
import { SeasonalPlanCard } from "@/components/customer/SeasonalPlanCard";
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
  const { property } = useProperty();
  const { assignment, isLoading } = useServiceDayAssignment(property?.id);
  const { data: subscription } = useCustomerSubscription();
  const { data: routineData } = useRoutine(property?.id, subscription?.plan_id);
  const { data: upcomingJobs, isLoading: jobsLoading } = useCustomerJobs("upcoming");
  const { data: completedJobs } = useCustomerJobs("completed");
  const { data: handleBalance } = useHandleBalance();
  const { data: planHandles } = usePlanHandlesConfig(subscription?.plan_id);
  const addItem = useAddRoutineItem();
  const removeItem = useRemoveRoutineItem();
  const navigate = useNavigate();
  const [nudgeDismissed, setNudgeDismissed] = useState(isNudgeDismissed);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const serviceDayConfirmed = assignment?.status === "confirmed";
  const routineItems = routineData?.items ?? [];
  const nextJob = upcomingJobs?.[0] ?? null;
  const lastCompletedJob = completedJobs?.[0] ?? null;

  const showServiceDayBanner = !isLoading && !assignment;
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

  const serviceNames = routineItems.map((i) => i.sku_name).filter(Boolean) as string[];

  return (
    <div className="p-6 max-w-4xl space-y-4 pb-24">
      {/* Header */}
      <div>
        <h1 className="text-h2 mb-1">Your home is handled.</h1>
        <p className="text-caption">
          Welcome back{user?.user_metadata?.full_name ? `, ${user.user_metadata.full_name}` : ""}.
        </p>
      </div>

      {/* Notification Banners */}
      <CustomerNotificationBanners />

      {/* Home Setup Prompt */}
      <HomeSetupCard />

      {/* Truth Banners */}
      {showServiceDayBanner && (
        <Card className="p-4 flex items-center gap-3 bg-muted/50">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          <p className="text-sm">We're assigning your Service Day…</p>
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
      <NextVisitCard job={nextJob} isLoading={jobsLoading} />

      {/* Handles Balance */}
      {handleBalance != null && planHandles && planHandles.handles_per_cycle > 0 && (
        <HandleBalanceBar balance={handleBalance} perCycle={planHandles.handles_per_cycle} />
      )}

      {/* Section B — This Cycle */}
      <ThisCycleSummary
        serviceCount={routineItems.length}
        serviceNames={serviceNames}
        handlesUsed={planHandles ? (planHandles.handles_per_cycle - (handleBalance ?? 0)) : undefined}
        handlesTotal={planHandles?.handles_per_cycle}
      />

      {/* Property Health Score */}
      <PropertyHealthWidget propertyId={property?.id} />

      {/* Section C — Suggested for Your Home */}
      <HomeSuggestions onAddToRoutine={handleAddToRoutine} onUndo={handleUndo} />

      {/* Section D — Recent Receipt */}
      <RecentReceipt job={lastCompletedJob} />

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
