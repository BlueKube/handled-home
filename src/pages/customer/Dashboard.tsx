import { useState } from "react";
import { CalendarDays, CheckCircle2, Loader2, Sparkles, X, Settings2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { StatCard } from "@/components/StatCard";
import { useProperty } from "@/hooks/useProperty";
import { useServiceDayAssignment } from "@/hooks/useServiceDayAssignment";
import { useRoutine } from "@/hooks/useRoutine";
import { useCustomerSubscription } from "@/hooks/useSubscription";
import { useCustomerJobs } from "@/hooks/useCustomerJobs";
import { useFourWeekPreview } from "@/hooks/useFourWeekPreview";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SeasonalPlanCard } from "@/components/customer/SeasonalPlanCard";
import { NextVisitCard } from "@/components/customer/NextVisitCard";
import { WeekTimeline } from "@/components/customer/WeekTimeline";
import { CrossPollinationCard } from "@/components/customer/CrossPollinationCard";
import { CustomerNotificationBanners } from "@/components/customer/NotificationBanners";

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
  const navigate = useNavigate();
  const [nudgeDismissed, setNudgeDismissed] = useState(isNudgeDismissed);

  const serviceDayConfirmed = assignment?.status === "confirmed";
  const routineItems = routineData?.items ?? [];

  const previewWeeks = useFourWeekPreview(
    routineItems,
    serviceDayConfirmed,
    upcomingJobs ?? []
  );

  // Find next visit (first upcoming job or first planned visit from preview)
  const nextJob = upcomingJobs?.[0] ?? null;

  const serviceDayValue = (() => {
    if (isLoading) return "…";
    if (!assignment) return "Not assigned";
    if (assignment.status === "confirmed") return capitalize(assignment.day_of_week);
    return "Pending";
  })();

  const recentVisitCount = completedJobs?.length ?? 0;

  // Truth banners
  const showServiceDayBanner = !isLoading && !assignment;
  const showServiceDayOffer = !isLoading && assignment?.status === "offered";
  const showRoutineNotEffective = routineData?.routine.status === "active" && routineData?.version?.status === "locked" && routineData?.version?.effective_at && new Date(routineData.version.effective_at) > new Date();

  // Gentle nudge: draft routine exists but not confirmed for 24h+
  const showRoutineNudge = !nudgeDismissed
    && routineData?.routine.status === "draft"
    && routineData.items.length > 0
    && new Date(routineData.routine.updated_at).getTime() < Date.now() - 24 * 60 * 60 * 1000;

  const dismissNudge = () => {
    localStorage.setItem(NUDGE_DISMISS_KEY, String(Date.now()));
    setNudgeDismissed(true);
  };

  const hasPreviewContent = previewWeeks.some((w) => w.visits.length > 0);

  return (
    <div className="p-6 max-w-4xl space-y-4">
      <div>
        <h1 className="text-h2 mb-1">Your home is handled.</h1>
        <p className="text-caption">Welcome back{user?.user_metadata?.full_name ? `, ${user.user_metadata.full_name}` : ""}.</p>
      </div>

      {/* Notification Banners (payment failure, weather reschedule) */}
      <CustomerNotificationBanners />

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
              <p className="text-xs text-muted-foreground">You have {routineData!.items.length} service{routineData!.items.length !== 1 ? "s" : ""} ready to confirm.</p>
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

      {/* Next Visit Card */}
      <NextVisitCard job={nextJob} isLoading={jobsLoading} />

      {/* Stats Row */}
      <div className="grid gap-4 md:grid-cols-2">
        <StatCard icon={CalendarDays} label="Service Day" value={serviceDayValue} />
        <StatCard icon={CheckCircle2} label="Recent Visits" value={String(recentVisitCount)} />
      </div>

      {/* 4-Week Preview Timeline */}
      {hasPreviewContent && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">4-Week Preview</h2>
            <Button
              variant="link"
              size="sm"
              className="text-accent text-xs h-auto p-0"
              onClick={() => navigate("/customer/routine")}
            >
              Adjust routine →
            </Button>
          </div>
          <div className="space-y-0">
            {previewWeeks.map((week) => (
              <WeekTimeline key={week.weekNumber} week={week} defaultOpen={week.weekNumber === 1} />
            ))}
          </div>
          <p className="text-xs text-muted-foreground">Changes take effect next cycle.</p>
        </div>
      )}

      {/* Cross-Pollination Card */}
      <CrossPollinationCard zoneId={subscription?.zone_id} propertyId={property?.id} />

      {/* Seasonal Plan Card */}
      <SeasonalPlanCard propertyId={property?.id} zoneId={subscription?.zone_id} />
    </div>
  );
}
