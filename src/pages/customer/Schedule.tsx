import { useCallback, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { QueryErrorCard } from "@/components/QueryErrorCard";
import { MiniCalendar } from "@/components/customer/MiniCalendar";
import { ThisCycleSummary } from "@/components/customer/ThisCycleSummary";
import {
  useUpcomingVisits,
  getVisitLabel,
  getVisitStyle,
  type UpcomingVisit,
} from "@/hooks/useUpcomingVisits";
import { useRoutine } from "@/hooks/useRoutine";
import { useProperty } from "@/hooks/useProperty";
import { useCustomerSubscription } from "@/hooks/useSubscription";
import { useHandleBalance, usePlanHandlesConfig } from "@/hooks/useHandles";
import { useServiceDayAssignment } from "@/hooks/useServiceDayAssignment";
import { format, isToday, isTomorrow, isThisWeek, parseISO } from "date-fns";
import {
  CalendarDays,
  Clock,
  User,
  AlertTriangle,
  ShieldCheck,
  Sparkles,
  CalendarCheck,
  Timer,
} from "lucide-react";
import { CustomerEmptyState } from "@/components/customer/CustomerEmptyState";
import { HelpTip } from "@/components/ui/help-tip";

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

  const isAppointment = visit.scheduling_profile === "appointment_window";
  const hasAppointmentWindow = !!(visit.time_window_start && visit.time_window_end);
  const needsWindowBooking =
    isAppointment &&
    !hasAppointmentWindow &&
    visit.schedule_state !== "complete" &&
    visit.schedule_state !== "canceled" &&
    visit.schedule_state !== "rescheduled";

  const etaWindow = isScheduledOrActive
    ? formatTimeWindow(visit.eta_range_start, visit.eta_range_end)
    : null;
  const coarseBlock = isPlanned ? getCoarseBlock(visit.eta_range_start) : null;
  const timeWindow = formatTimeWindow(visit.time_window_start, visit.time_window_end);

  const taskSummary =
    visit.tasks.length > 0
      ? visit.tasks.map((t) => t.sku_name ?? "Service").join(", ")
      : "Visit details pending";

  const totalMinutes = visit.tasks.reduce((sum, t) => sum + t.duration_estimate_minutes, 0);
  const presenceRequired = visit.tasks.some((t) => t.presence_required);

  const isActive = visit.schedule_state === "dispatched" || visit.schedule_state === "in_progress";
  const isException = visit.schedule_state === "exception_pending";
  const isDueSoon = visit.due_status === "due_soon";
  const isOverdue = visit.due_status === "overdue";
  const isPiggybacked = !!visit.piggybacked_onto_visit_id;

  return (
    <Card
      className={`p-4 space-y-3 transition-colors ${isActive ? "border-accent/40 bg-accent/5" : ""} ${isException ? "border-destructive/30 bg-destructive/5" : ""} ${isOverdue ? "border-warning/40 bg-warning/5" : ""}`}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-0.5">
          <p className="text-sm font-semibold">
            {visit.scheduling_profile === "service_week" && !isScheduledOrActive
              ? "Scheduled this week"
              : `${dateLabel}${isPlanned && coarseBlock ? ` (${coarseBlock})` : ""}`}
          </p>
          <p className="text-xs text-muted-foreground">{taskSummary}</p>
        </div>
        <div className="flex items-center gap-1.5">
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

      {hasAppointmentWindow && (
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1 text-xs border-accent/30 text-accent bg-accent/5">
            <CalendarCheck className="h-3 w-3" />
            Appointment: {timeWindow}
          </Badge>
        </div>
      )}

      {visit.scheduling_profile === "service_week" && visit.service_week_start && visit.service_week_end && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <CalendarDays className="h-3 w-3" />
          <span>
            Service week: {format(parseISO(visit.service_week_start), "MMM d")} –{" "}
            {format(parseISO(visit.service_week_end), "MMM d")}
          </span>
        </div>
      )}

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

      {isPiggybacked && (
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-secondary/50 text-xs text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 shrink-0 text-accent" />
          <span>Also scheduled during your appointment for convenience.</span>
        </div>
      )}

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

      {!isException && !isActive && !needsWindowBooking && !visit.provider_org_id && visit.schedule_state !== "canceled" && (
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-secondary/50 text-xs text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 shrink-0" />
          <span>We're matching the best pro for your visit.</span>
        </div>
      )}

      {visit.schedule_state === "dispatched" && (
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-accent/10 text-xs text-accent">
          <Clock className="h-3.5 w-3.5 shrink-0" />
          <span>Your pro is heading out today. We'll notify you when they're on the way.</span>
        </div>
      )}

      {visit.tasks.length > 1 && (
        <div className="flex flex-wrap gap-1.5">
          {visit.tasks.map((task) => (
            <Badge key={task.id} variant="outline" className="text-[10px] px-2 py-0.5 bg-card">
              {task.sku_name ?? "Service"}
              {task.duration_estimate_minutes > 0 && ` · ${task.duration_estimate_minutes}m`}
            </Badge>
          ))}
        </div>
      )}
    </Card>
  );
}

export default function Schedule() {
  const navigate = useNavigate();
  const { data: visits, isLoading, isError, refetch } = useUpcomingVisits();
  const { property } = useProperty();
  const { data: subscription } = useCustomerSubscription();
  const { data: routineData } = useRoutine(property?.id, subscription?.plan_id);
  const { data: handleBalance } = useHandleBalance();
  const { data: planHandles } = usePlanHandlesConfig(subscription?.plan_id);
  const { assignment } = useServiceDayAssignment(property?.id);
  const dateRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const routineItems = routineData?.items ?? [];
  const serviceNames = routineItems.map((i) => i.sku_name).filter(Boolean) as string[];

  const serviceDates = useMemo(
    () => (visits ?? []).map((v) => v.scheduled_date),
    [visits]
  );

  // Group visits by date for section headers
  const groupedVisits = useMemo(() => {
    if (!visits || visits.length === 0) return [];
    const groups: { date: string; label: string; visits: UpcomingVisit[] }[] = [];
    let currentKey = "";
    for (const visit of visits) {
      const key = visit.scheduled_date;
      if (key !== currentKey) {
        currentKey = key;
        groups.push({ date: key, label: formatVisitDate(key), visits: [] });
      }
      groups[groups.length - 1].visits.push(visit);
    }
    return groups;
  }, [visits]);

  const handleCalendarSelect = useCallback((date: Date) => {
    // Build key in local date space to avoid UTC offset shifting
    const key = format(date, "yyyy-MM-dd");
    for (const [refKey, el] of dateRefs.current) {
      if (refKey === key) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
    }
  }, []);

  if (isLoading) {
    return (
      <div className="p-4 pb-24 space-y-4 animate-fade-in">
        <h1 className="text-h2">Schedule</h1>
        <Skeleton className="h-[320px] rounded-2xl" />
        {[1, 2].map((i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-4 pb-24 animate-fade-in">
        <h1 className="text-h2 mb-4">Schedule</h1>
        <QueryErrorCard message="Failed to load your schedule." onRetry={() => refetch()} />
      </div>
    );
  }

  return (
    <div className="p-4 pb-24 space-y-4 animate-fade-in">
      {/* Header */}
      <h1 className="text-h2">Schedule <HelpTip text="Your schedule shows upcoming and past visits. Tap any visit for details, photos, and checklists." /></h1>

      {/* Mini Calendar */}
      <MiniCalendar serviceDates={serviceDates} onSelectDate={handleCalendarSelect} />

      {/* This Cycle Summary (moved from Dashboard) */}
      <ThisCycleSummary
        serviceCount={routineItems.length}
        serviceNames={serviceNames}
        handlesUsed={planHandles ? planHandles.handles_per_cycle - (handleBalance ?? 0) : undefined}
        handlesTotal={planHandles?.handles_per_cycle}
      />

      {/* Service Day info */}
      {assignment?.status === "confirmed" && assignment.day_of_week && (
        <Card className="p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-accent" />
            <span className="text-sm font-medium">
              Your service day: {assignment.day_of_week.charAt(0).toUpperCase() + assignment.day_of_week.slice(1)}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-accent h-auto p-0"
            onClick={() => navigate("/customer/service-day")}
          >
            Change →
          </Button>
        </Card>
      )}

      {/* Upcoming visits */}
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
          Upcoming
        </p>

        {!visits || visits.length === 0 ? (
          <CustomerEmptyState
            icon={CalendarDays}
            title="No upcoming visits"
            body="Your next service will appear here once scheduled."
            ctaLabel="Build your routine"
            ctaAction={() => navigate("/customer/routine")}
          />
        ) : (
          <div className="space-y-4">
            {groupedVisits.map((group) => (
              <div
                key={group.date}
                ref={(el) => {
                  if (el) dateRefs.current.set(group.date, el);
                  else dateRefs.current.delete(group.date);
                }}
              >
                <p className="text-xs font-semibold text-muted-foreground mb-2">
                  {group.label}
                </p>
                <div className="space-y-3">
                  {group.visits.map((visit) => (
                    <VisitCard key={visit.id} visit={visit} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
