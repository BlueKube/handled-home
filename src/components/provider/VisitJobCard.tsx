import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, ChevronRight, ArrowUp, ArrowDown, Timer, AlertTriangle, CalendarClock, Home, Link2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import type { ProviderVisit } from "@/hooks/useProviderVisits";

import { formatTime12 } from "@/lib/formatTime12";

function getScheduleLabel(visit: ProviderVisit): string {
  if (visit.schedule_state === "in_progress") return "In Progress";
  if (visit.schedule_state === "dispatched") return "Today";
  return "Scheduled";
}

interface VisitJobCardProps {
  visit: ProviderVisit;
  index: number;
  total: number;
  showReorder: boolean;
  isSelected?: boolean;
  onSelect?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
}

export function VisitJobCard({
  visit,
  index,
  total,
  showReorder,
  isSelected,
  onSelect,
  onMoveUp,
  onMoveDown,
  canMoveUp = true,
  canMoveDown = true,
}: VisitJobCardProps) {
  const navigate = useNavigate();
  const addr = visit.properties;
  const taskNames = visit.visit_tasks
    ?.map((t) => t.service_skus?.name)
    .filter(Boolean)
    .join(", ") || "No tasks";
  const totalMinutes = visit.visit_tasks?.reduce(
    (sum, t) => sum + (t.duration_estimate_minutes ?? 0),
    0
  ) ?? 0;

  const isNext = index === 0 && visit.schedule_state !== "in_progress";
  const isWindowed = visit.scheduling_profile === "appointment_window" && visit.time_window_start;
  const isServiceWeek = visit.scheduling_profile === "service_week";
  const isPiggybacked = !!visit.piggybacked_onto_visit_id;
  const hasPresenceRequired = visit.visit_tasks?.some((t) => t.presence_required);

  return (
    <Card
      className={`p-4 press-feedback cursor-pointer ${isNext ? "ring-2 ring-accent/40" : ""} ${isSelected ? "bg-accent/5 border-accent/30" : ""}`}
      onClick={onSelect}
    >
      <div className="flex items-start gap-2">
        {showReorder && (
          <div className="flex flex-col gap-0.5 shrink-0 pt-1">
            <Button
              variant="ghost" size="icon"
              className="h-9 w-9"
              disabled={!canMoveUp}
              aria-label="Move up"
              onClick={(e) => { e.stopPropagation(); onMoveUp?.(); }}
            >
              <ArrowUp className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost" size="icon"
              className="h-9 w-9"
              disabled={!canMoveDown}
              aria-label="Move down"
              onClick={(e) => { e.stopPropagation(); onMoveDown?.(); }}
            >
              <ArrowDown className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
        <div
          className="flex-1 min-w-0"
          onClick={(e) => { e.stopPropagation(); /* navigate to visit detail when available */ }}
        >
          {/* Top badges row */}
          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
            <span className="text-xs font-bold text-accent bg-accent/10 rounded-full px-2 py-0.5">
              {isNext ? "Next" : `#${index + 1}`}
            </span>
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              {getScheduleLabel(visit)}
            </Badge>

            {/* Time window badge */}
            {isWindowed && visit.time_window_start && visit.time_window_end && (
              <Badge variant="default" className="text-[10px] px-1.5 py-0 gap-0.5">
                <CalendarClock className="h-2.5 w-2.5" />
                {formatTime12(visit.time_window_start)}–{formatTime12(visit.time_window_end)}
              </Badge>
            )}

            {/* Service-week badge */}
            {isServiceWeek && !visit.due_status && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                This week
              </Badge>
            )}

            {/* Due-soon badge */}
            {visit.due_status === "due_soon" && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-warning/10 text-warning-foreground dark:bg-warning/20 dark:text-warning">
                <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />
                Due soon
              </Badge>
            )}

            {/* Overdue badge */}
            {visit.due_status === "overdue" && (
              <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />
                Overdue
              </Badge>
            )}

            {/* Presence-required indicator */}
            {hasPresenceRequired && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 gap-0.5">
                <Home className="h-2.5 w-2.5" />
                Home
              </Badge>
            )}

            {/* Piggybacked indicator */}
            {isPiggybacked && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 gap-0.5 border-dashed">
                <Link2 className="h-2.5 w-2.5" />
                Bundled
              </Badge>
            )}
          </div>

          <p className="text-sm font-semibold text-foreground truncate">
            {addr ? `${addr.street_address}, ${addr.city}` : "Property"}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">{taskNames}</p>

          <div className="flex items-center gap-3 mt-1.5">
            {visit.scheduled_date && (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {format(parseISO(visit.scheduled_date), "EEE, MMM d")}
              </span>
            )}
            {totalMinutes > 0 && (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Timer className="h-3 w-3" />
                ~{totalMinutes} min
              </span>
            )}
            {isServiceWeek && visit.service_week_end && (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                Due by {format(parseISO(visit.service_week_end), "EEE, MMM d")}
              </span>
            )}
          </div>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
      </div>
    </Card>
  );
}
