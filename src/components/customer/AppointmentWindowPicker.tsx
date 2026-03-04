import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarDays, Clock, Home, Check, Sparkles } from "lucide-react";
import { format, parseISO } from "date-fns";
import type { OfferedWindow } from "@/hooks/useAppointmentWindows";

interface AppointmentWindowPickerProps {
  windows: OfferedWindow[];
  isLoading: boolean;
  onSelect: (window: OfferedWindow) => void;
  isConfirming: boolean;
}

function formatWindowTime(isoStr: string): string {
  const d = parseISO(isoStr);
  const h = d.getUTCHours();
  const m = d.getUTCMinutes();
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return m === 0 ? `${h12}${ampm}` : `${h12}:${String(m).padStart(2, "0")}${ampm}`;
}

function formatWindowDate(dateStr: string): string {
  return format(parseISO(dateStr), "EEE, MMM d");
}

/** Group windows by date for visual clarity */
function groupByDate(windows: OfferedWindow[]): Map<string, OfferedWindow[]> {
  const map = new Map<string, OfferedWindow[]>();
  for (const w of windows) {
    const arr = map.get(w.date) ?? [];
    arr.push(w);
    map.set(w.date, arr);
  }
  return map;
}

export function AppointmentWindowPicker({
  windows,
  isLoading,
  onSelect,
  isConfirming,
}: AppointmentWindowPickerProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center">
            <CalendarDays className="h-5 w-5 text-accent" />
          </div>
          <div>
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-3 w-64 mt-1" />
          </div>
        </div>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 rounded-xl" />
        ))}
      </div>
    );
  }

  if (windows.length === 0) {
    return (
      <Card className="p-6 text-center space-y-3">
        <CalendarDays className="h-10 w-10 text-muted-foreground mx-auto" />
        <p className="text-sm font-medium">No available windows</p>
        <p className="text-xs text-muted-foreground">
          All appointment slots are currently full. We'll notify you when new windows open up.
        </p>
      </Card>
    );
  }

  const grouped = groupByDate(windows);
  const selectedWindow = windows.find(
    (w) => `${w.date}-${w.template_id}` === selectedId
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center">
          <Home className="h-5 w-5 text-accent" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Pick Your Window</h2>
          <p className="text-xs text-muted-foreground">
            This service needs you home. Choose a time that works.
          </p>
        </div>
      </div>

      {/* Windows grouped by date */}
      {Array.from(grouped.entries()).map(([date, dateWindows]) => (
        <div key={date} className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {formatWindowDate(date)}
          </p>
          <div className="space-y-2">
            {dateWindows.map((w) => {
              const wId = `${w.date}-${w.template_id}`;
              const isSelected = selectedId === wId;

              return (
                <Card
                  key={wId}
                  className={`p-3.5 flex items-center gap-3 cursor-pointer transition-all ${
                    isSelected
                      ? "border-accent bg-accent/5 ring-1 ring-accent/30"
                      : "hover:bg-secondary/50"
                  }`}
                  onClick={() => setSelectedId(wId)}
                >
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                    isSelected ? "bg-accent text-accent-foreground" : "bg-muted"
                  }`}>
                    {isSelected ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{w.window_label}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatWindowTime(w.window_start)} – {formatWindowTime(w.window_end)}
                    </p>
                  </div>
                  {w.is_fallback && (
                    <Badge variant="outline" className="text-[10px] shrink-0">
                      <Sparkles className="h-2.5 w-2.5 mr-1" />
                      Flexible
                    </Badge>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      ))}

      {/* Confirm button */}
      <Button
        className="w-full"
        disabled={!selectedWindow || isConfirming}
        onClick={() => selectedWindow && onSelect(selectedWindow)}
      >
        {isConfirming
          ? "Confirming…"
          : selectedWindow
            ? `Confirm ${selectedWindow.window_label} on ${formatWindowDate(selectedWindow.date)}`
            : "Select a window"}
      </Button>

      {/* Policy note */}
      <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
        Locked once inside the 7-day window. Your pro will arrive during this time.
      </p>
    </div>
  );
}
