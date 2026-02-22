import { useState } from "react";
import { CalendarDays, CheckCircle2, Loader2, Sparkles, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { StatCard } from "@/components/StatCard";
import { useProperty } from "@/hooks/useProperty";
import { useServiceDayAssignment } from "@/hooks/useServiceDayAssignment";
import { useRoutine } from "@/hooks/useRoutine";
import { useCustomerSubscription } from "@/hooks/useSubscription";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const NUDGE_DISMISS_KEY = "routine_nudge_dismissed_at";

function isNudgeDismissed(): boolean {
  const val = localStorage.getItem(NUDGE_DISMISS_KEY);
  if (!val) return false;
  const dismissedAt = parseInt(val, 10);
  // Show again after 7 days
  return Date.now() - dismissedAt < 7 * 24 * 60 * 60 * 1000;
}

export default function CustomerDashboard() {
  const { user } = useAuth();
  const { property } = useProperty();
  const { assignment, isLoading } = useServiceDayAssignment(property?.id);
  const { data: subscription } = useCustomerSubscription();
  const { data: routineData } = useRoutine(property?.id, subscription?.plan_id);
  const navigate = useNavigate();
  const [nudgeDismissed, setNudgeDismissed] = useState(isNudgeDismissed);

  const serviceDayValue = (() => {
    if (isLoading) return "…";
    if (!assignment) return "Not assigned";
    if (assignment.status === "confirmed") return capitalize(assignment.day_of_week);
    return "Pending";
  })();

  // Gentle nudge: draft routine exists but not confirmed for 24h+
  const showRoutineNudge = !nudgeDismissed
    && routineData?.routine.status === "draft"
    && routineData.items.length > 0
    && new Date(routineData.routine.updated_at).getTime() < Date.now() - 24 * 60 * 60 * 1000;

  const dismissNudge = () => {
    localStorage.setItem(NUDGE_DISMISS_KEY, String(Date.now()));
    setNudgeDismissed(true);
  };

  return (
    <div className="p-6 max-w-4xl">
      <h1 className="text-h2 mb-1">Your home is handled.</h1>
      <p className="text-caption mb-6">Welcome back{user?.user_metadata?.full_name ? `, ${user.user_metadata.full_name}` : ""}.</p>

      {/* Service Day Banner */}
      {!isLoading && !assignment && (
        <Card className="p-4 mb-4 flex items-center gap-3 bg-muted/50">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          <p className="text-sm">We're assigning your Service Day…</p>
        </Card>
      )}
      {!isLoading && assignment?.status === "offered" && (
        <Card
          className="p-4 mb-4 flex items-center justify-between cursor-pointer hover:bg-secondary/50 transition-colors"
          onClick={() => navigate("/customer/service-day")}
        >
          <div className="flex items-center gap-3">
            <CalendarDays className="h-5 w-5 text-accent" />
            <p className="text-sm font-medium">Confirm your Service Day</p>
          </div>
          <Button variant="ghost" size="sm">View →</Button>
        </Card>
      )}

      {/* L12: Dismissible gentle nudge for unconfirmed routine */}
      {showRoutineNudge && (
        <Card className="p-4 mb-4 flex items-center justify-between cursor-pointer hover:bg-accent/5 transition-colors border-accent/30">
          <div
            className="flex items-center gap-3 flex-1"
            onClick={() => navigate("/customer/routine")}
          >
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

      <div className="grid gap-4 md:grid-cols-2">
        <StatCard icon={CalendarDays} label="Service Day" value={serviceDayValue} />
        <StatCard icon={CheckCircle2} label="Recent Visits" value="0" />
      </div>
    </div>
  );
}
