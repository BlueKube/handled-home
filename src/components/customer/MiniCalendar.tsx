import { useMemo, useState } from "react";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface MiniCalendarProps {
  /** Dates that have a service scheduled (ISO strings or Date objects) */
  serviceDates: (string | Date)[];
  /** Called when user taps a day that has a service dot */
  onSelectDate?: (date: Date) => void;
}

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function MiniCalendar({ serviceDates, onSelectDate }: MiniCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(() => new Date());

  const serviceDateSet = useMemo(() => {
    const set = new Set<string>();
    for (const d of serviceDates) {
      const date = typeof d === "string" ? new Date(d) : d;
      set.add(format(date, "yyyy-MM-dd"));
    }
    return set;
  }, [serviceDates]);

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [currentMonth]);

  const servicesThisMonth = useMemo(() => {
    return serviceDates.filter((d) => {
      const date = typeof d === "string" ? new Date(d) : d;
      return isSameMonth(date, currentMonth);
    }).length;
  }, [serviceDates, currentMonth]);

  return (
    <div className="bg-card rounded-2xl border p-4 space-y-3">
      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
          className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
        >
          <ChevronLeft className="h-4 w-4 text-muted-foreground" />
        </button>
        <h3 className="text-sm font-semibold">{format(currentMonth, "MMMM yyyy")}</h3>
        <button
          onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
          className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
        >
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1">
        {WEEKDAY_LABELS.map((day) => (
          <div key={day} className="text-center text-[10px] font-medium text-muted-foreground uppercase">
            {day}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day) => {
          const inMonth = isSameMonth(day, currentMonth);
          const today = isToday(day);
          const key = format(day, "yyyy-MM-dd");
          const hasService = serviceDateSet.has(key);

          return (
            <button
              key={key}
              onClick={() => hasService && onSelectDate?.(day)}
              disabled={!hasService}
              className={`
                relative flex flex-col items-center justify-center h-9 rounded-lg text-xs transition-colors
                ${!inMonth ? "text-muted-foreground/30" : ""}
                ${today ? "bg-accent text-accent-foreground font-bold" : ""}
                ${hasService && !today ? "font-medium hover:bg-secondary" : ""}
                ${!hasService ? "cursor-default" : "cursor-pointer"}
              `}
            >
              {day.getDate()}
              {hasService && (
                <span
                  className={`absolute bottom-0.5 h-1 w-1 rounded-full ${
                    today ? "bg-accent-foreground" : "bg-accent"
                  }`}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Service count caption */}
      <p className="text-xs text-muted-foreground text-center">
        {servicesThisMonth} service{servicesThisMonth !== 1 ? "s" : ""} this month
      </p>
    </div>
  );
}
