import { CalendarDays, CheckCircle2, Loader2, Sparkles } from "lucide-react";
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

export default function CustomerDashboard() {
  const { user } = useAuth();
  const { property } = useProperty();
  const { assignment, isLoading } = useServiceDayAssignment(property?.id);
  const { data: subscription } = useCustomerSubscription();
  const { data: routineData } = useRoutine(property?.id, subscription?.plan_id);
  const navigate = useNavigate();

  const serviceDayValue = (() => {
    if (isLoading) return "…";
    if (!assignment) return "Not assigned";
    if (assignment.status === "confirmed") return capitalize(assignment.day_of_week);
    return "Pending";
  })();

  // Gentle nudge: draft routine exists but not confirmed for 24h+
  const showRoutineNudge = routineData?.routine.status === "draft"
    && routineData.items.length > 0
    && new Date(routineData.routine.updated_at).getTime() < Date.now() - 24 * 60 * 60 * 1000;

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

      {/* Gentle nudge for unconfirmed routine */}
      {showRoutineNudge && (
        <Card
          className="p-4 mb-4 flex items-center justify-between cursor-pointer hover:bg-accent/5 transition-colors border-accent/30"
          onClick={() => navigate("/customer/routine")}
        >
          <div className="flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-accent" />
            <div>
              <p className="text-sm font-medium">Finish your routine</p>
              <p className="text-xs text-muted-foreground">You have {routineData.items.length} service{routineData.items.length !== 1 ? "s" : ""} ready to confirm.</p>
            </div>
          </div>
          <Button variant="ghost" size="sm">Continue →</Button>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <StatCard icon={CalendarDays} label="Service Day" value={serviceDayValue} />
        <StatCard icon={CheckCircle2} label="Recent Visits" value="0" />
      </div>
    </div>
  );
}
