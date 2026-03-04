import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { QueryErrorCard } from "@/components/QueryErrorCard";
import {
  useUpcomingVisits,
  getVisitLabel,
  getVisitStyle,
  type UpcomingVisit,
} from "@/hooks/useUpcomingVisits";
import { format, isToday, isTomorrow, isThisWeek, parseISO } from "date-fns";
import { CalendarDays, Clock, User, AlertTriangle, ShieldCheck, Sparkles } from "lucide-react";

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

/**
 * For Planned/draft visits, show a coarse AM/PM block instead of a precise ETA.
 * AM = 8am–12pm, PM = 12pm–5pm (PRD §UX v1 defaults).
 */
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
  const stateLabel = getVisitLabel(visit);
  const stateStyle = getVisitStyle(visit);
  const dateLabel = formatVisitDate(visit.scheduled_date);

  const isPlanned = visit.schedule_state === "planning" && visit.plan_window === "draft";
  const isScheduledOrActive =
    visit.plan_window === "locked" ||
    visit.schedule_state === "scheduled" ||
    visit.schedule_state === "dispatched" ||
    visit.schedule_state === "in_progress";

  // Scheduled/locked → precise ETA range; Planned/draft → coarse AM/PM block
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

  return (
    <Card className={`p-4 space-y-3 transition-colors ${isActive ? "border-accent/40 bg-accent/5" : ""} ${isException ? "border-destructive/30 bg-destructive/5" : ""}`}>
      {/* Header row */}
      <div className="flex items-start justify-between">
        <div className="space-y-0.5">
          <p className="text-sm font-semibold">
            {dateLabel}{isPlanned && coarseBlock ? ` (${coarseBlock})` : ""}
          </p>
          <p className="text-xs text-muted-foreground">{taskSummary}</p>
        </div>
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${stateStyle.pill}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${stateStyle.dot}`} />
          {stateLabel}
        </span>
      </div>

      {/* Details row */}
      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        {/* ETA range for scheduled/active visits */}
        {etaWindow && (
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {isActive ? `ETA ${etaWindow}` : etaWindow}
          </span>
        )}

        {/* Coarse AM/PM block for planned/draft visits */}
        {coarseBlock && !etaWindow && (
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {coarseBlock}
          </span>
        )}

        {/* Fallback time window */}
        {!etaWindow && !coarseBlock && timeWindow && (
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {timeWindow}
          </span>
        )}

        {/* Duration estimate */}
        {totalMinutes > 0 && (
          <span className="inline-flex items-center gap-1">
            <CalendarDays className="h-3 w-3" />
            ~{totalMinutes} min
          </span>
        )}

        {/* Presence required */}
        {presenceRequired && (
          <span className="inline-flex items-center gap-1 text-accent">
            <User className="h-3 w-3" />
            Home access needed
          </span>
        )}
      </div>

      {/* Exception hint */}
      {isException && (
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-destructive/10 text-xs text-destructive">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          <span>We're working on rescheduling this visit. We'll update you soon.</span>
        </div>
      )}

      {/* Assignment status messaging */}
      {!isException && !isActive && visit.provider_org_id && (
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
      {!isException && !isActive && !visit.provider_org_id && visit.schedule_state !== "canceled" && (
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
      <div className="p-6 max-w-4xl space-y-4">
        <div>
          <h1 className="text-xl font-bold">Upcoming Visits</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Your scheduled home care.</p>
        </div>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6 max-w-4xl">
        <QueryErrorCard message="Failed to load upcoming visits." onRetry={() => refetch()} />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl space-y-4 pb-24">
      <div>
        <h1 className="text-xl font-bold">Upcoming Visits</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Your scheduled home care.</p>
      </div>

      {(!visits || visits.length === 0) ? (
        <Card className="p-8 text-center">
          <CalendarDays className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-medium">No upcoming visits</p>
          <p className="text-xs text-muted-foreground mt-1">
            Visits will appear here as your routine generates them.
          </p>
        </Card>
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
