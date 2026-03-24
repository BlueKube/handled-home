import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { CustomerEmptyState } from "@/components/customer/CustomerEmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { QueryErrorCard } from "@/components/QueryErrorCard";
import {
  useUpcomingVisits,
  getVisitLabel,
  getVisitStyle,
  type UpcomingVisit,
} from "@/hooks/useUpcomingVisits";
import { format, isToday, isTomorrow, isThisWeek, parseISO } from "date-fns";
import { CalendarDays, Clock, User, AlertTriangle, ShieldCheck, Sparkles, CalendarCheck, Timer } from "lucide-react";

function formatVisitDate(dateStr: string): string {
  const date = parseISO(dateStr);
  if (isToday(date)) return "Today";
  if (isTomorrow(date)) return "Tomorrow";
  if (isThisWeek(date, { weekStartsOn: 1 })) return format(date, "EEEE");
  return format(date, "EEE, MMM d");
}

function formatTime12(t: string): string {
  const [h, m] = t.split(":");
  const hour = parseInt(h);
  const ampm = hour >= 12 ? "PM" : "AM";
  const h12 = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return m === "00" ? `${h12}${ampm}` : `${h12}:${m}${ampm}`;
}

function formatTimeWindow(start: string | null, end: string | null): string | null {
  if (!start || !end) return null;
  try {
    return `${formatTime12(start)} – ${formatTime12(end)}`;
  } catch {
    return null;
  }
}

function getCoarseBlock(etaStart: string | null): string {
  if (!etaStart) return "AM";
  try {
    const hour = parseInt(etaStart.split(":")[0]);
    return hour >= 12 ? "PM" : "AM";
  } catch {
    return "AM";
  }
}

function VisitCard({ visit }: { visit: UpcomingVisit }) {
  const navigate = useNavigate();
  const stateLabel = getVisitLabel(visit);
  const stateStyle = getVisitStyle(visit);
  const dateLabel = formatVisitDate(visit.scheduled_date);

  const isPlanned = visit.schedule_state === "planning" && visit.plan_window === "draft";
  const isScheduledOrActive =
    visit.plan_window === "locked" ||
    visit.schedule_state === "scheduled" ||
    visit.schedule_state === "dispatched" ||
    visit.schedule_state === "in_progress";

  const isServiceWeek = visit.scheduling_profile === "service_week";
  const isAppointment = visit.scheduling_profile === "appointment_window";
  const hasAppointmentWindow = !!(visit.time_window_start && visit.time_window_end);
  const needsWindowBooking = isAppointment && !hasAppointmentWindow && visit.schedule_state !== "complete" && visit.schedule_state !== "canceled" && visit.schedule_state !== "rescheduled";

  // ETA display logic
  const etaWindow = isScheduledOrActive
    ? formatTimeWindow(visit.eta_range_start, visit.eta_range_end)
    : null;
  const coarseBlock = isPlanned ? getCoarseBlock(visit.eta_range_start) : null;
  const timeWindow = formatTimeWindow(visit.time_window_start, visit.time_window_end);

  const taskSummary = visit.tasks.length > 0
    ? visit.tasks.map((t) => t.sku_name ?? "Service").join(", ")
    : "Visit details pending";

  const totalMinutes = visit.tasks.reduce((sum, t) => sum + t.duration_estimate_minutes, 0);
  const presenceRequired = visit.tasks.some((t) => t.presence_required);

  const isActive = visit.schedule_state === "dispatched" || visit.schedule_state === "in_progress";
  const isException = visit.schedule_state === "exception_pending";

  // Due status badges
  const isDueSoon = visit.due_status === "due_soon";
  const isOverdue = visit.due_status === "overdue";

  // Piggybacking
  const isPiggybacked = !!visit.piggybacked_onto_visit_id;

  return (
    <Card className={`p-4 space-y-3 transition-colors ${isActive ? "border-accent/40 bg-accent/5" : ""} ${isException ? "border-destructive/30 bg-destructive/5" : ""} ${isOverdue ? "border-warning/40 bg-warning/5" : ""}`}>
      {/* Header row */}
      <div className="flex items-start justify-between">
        <div className="space-y-0.5">
          <p className="text-sm font-semibold">
            {isServiceWeek && !isScheduledOrActive
              ? "Scheduled this week"
              : `${dateLabel}${isPlanned && coarseBlock ? ` (${coarseBlock})` : ""}`}
          </p>
          <p className="text-xs text-muted-foreground">{taskSummary}</p>
        </div>
        <div className="flex items-center gap-1.5">
          {/* Due status badges */}
          {isDueSoon && (
            <Badge variant="outline" className="text-[10px] border-warning/30 text-warning bg-warning/10">
              <Timer className="h-2.5 w-2.5 mr-0.5" />
              Due soon
            </Badge>
          )}
          {isOverdue && (
            <Badge variant="destructive" className="text-[10px]">
              Overdue
            </Badge>
          )}
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${stateStyle.pill}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${stateStyle.dot}`} />
            {stateLabel}
          </span>
        </div>
      </div>

      {/* Appointment window badge */}
      {hasAppointmentWindow && (
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1 text-xs border-accent/30 text-accent bg-accent/5">
            <CalendarCheck className="h-3 w-3" />
            Appointment: {timeWindow}
          </Badge>
          {visit.customer_window_preference && (
            <span className="text-[10px] text-muted-foreground">
              {visit.customer_window_preference}
            </span>
          )}
        </div>
      )}

      {/* Service week range */}
      {isServiceWeek && visit.service_week_start && visit.service_week_end && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <CalendarDays className="h-3 w-3" />
          <span>
            Service week: {format(parseISO(visit.service_week_start), "MMM d")} – {format(parseISO(visit.service_week_end), "MMM d")}
          </span>
        </div>
      )}

      {/* Details row */}
      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        {etaWindow && !hasAppointmentWindow && (
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {isActive ? `ETA ${etaWindow}` : etaWindow}
          </span>
        )}

        {coarseBlock && !etaWindow && !hasAppointmentWindow && (
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {coarseBlock}
          </span>
        )}

        {!etaWindow && !coarseBlock && !hasAppointmentWindow && timeWindow && (
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {timeWindow}
          </span>
        )}

        {totalMinutes > 0 && (
          <span className="inline-flex items-center gap-1">
            <CalendarDays className="h-3 w-3" />
            ~{totalMinutes} min
          </span>
        )}

        {presenceRequired && (
          <span className="inline-flex items-center gap-1 text-accent">
            <User className="h-3 w-3" />
            Home access needed
          </span>
        )}
      </div>

      {/* Piggybacking disclosure */}
      {isPiggybacked && (
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-secondary/50 text-xs text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 shrink-0 text-accent" />
          <span>Also scheduled during your appointment for convenience.</span>
        </div>
      )}

      {/* Book appointment CTA */}
      {needsWindowBooking && (
        <Button
          variant="default"
          size="sm"
          className="w-full gap-1.5"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/customer/appointment/${visit.id}`);
          }}
        >
          <CalendarCheck className="h-3.5 w-3.5" />
          Book Appointment Window
        </Button>
      )}

      {/* Exception hint */}
      {isException && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-destructive/10 text-xs text-destructive">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            <span>We're working on rescheduling this visit. We'll update you soon.</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full gap-1.5"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/customer/reschedule/${visit.id}`);
            }}
          >
            <CalendarDays className="h-3.5 w-3.5" />
            Reschedule Visit
          </Button>
        </div>
      )}

      {/* Assignment status messaging */}
      {!isException && !isActive && !needsWindowBooking && visit.provider_org_id && (
        visit.plan_window === "draft" ? (
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-secondary/50 text-xs text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 shrink-0" />
            <span>Planned visits may shift nightly until they become Scheduled.</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-primary/10 text-xs text-primary">
            <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
            <span>Your pro is scheduled. We'll send a reminder before your visit.</span>
          </div>
        )
      )}

      {/* Unassigned visit */}
      {!isException && !isActive && !needsWindowBooking && !visit.provider_org_id && visit.schedule_state !== "canceled" && (
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-secondary/50 text-xs text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 shrink-0" />
          <span>We're matching the best pro for your visit.</span>
        </div>
      )}

      {/* Active visit hint */}
      {visit.schedule_state === "dispatched" && (
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-accent/10 text-xs text-accent">
          <Clock className="h-3.5 w-3.5 shrink-0" />
          <span>Your pro is heading out today. We'll notify you when they're on the way.</span>
        </div>
      )}

      {/* Task pills */}
      {visit.tasks.length > 1 && (
        <div className="flex flex-wrap gap-1.5">
          {visit.tasks.map((task) => (
            <Badge
              key={task.id}
              variant="outline"
              className="text-[10px] px-2 py-0.5 bg-card"
            >
              {task.sku_name ?? "Service"}
              {task.duration_estimate_minutes > 0 && ` · ${task.duration_estimate_minutes}m`}
            </Badge>
          ))}
        </div>
      )}
    </Card>
  );
}

export default function UpcomingVisits() {
  const { data: visits, isLoading, isError, refetch } = useUpcomingVisits();

  if (isLoading) {
    return (
      <div className="p-4 pb-24 space-y-4">
        <div>
          <h1 className="text-h2">Upcoming Visits</h1>
          <p className="text-caption mt-0.5">Your scheduled home care.</p>
        </div>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-4 pb-24">
        <QueryErrorCard message="Failed to load upcoming visits." onRetry={() => refetch()} />
      </div>
    );
  }

  return (
    <div className="p-4 pb-24 space-y-4 animate-fade-in">
      <div>
        <h1 className="text-h2">Upcoming Visits</h1>
        <p className="text-caption mt-0.5">Your scheduled home care.</p>
      </div>

      {(!visits || visits.length === 0) ? (
        <CustomerEmptyState
          icon={CalendarDays}
          title="No upcoming visits"
          body="Visits will appear here as your routine generates them."
        />
      ) : (
        <div className="space-y-3">
          {visits.map((visit) => (
            <VisitCard key={visit.id} visit={visit} />
          ))}
        </div>
      )}
    </div>
  );
}
