import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { WeekPreview } from "@/hooks/useRoutinePreview";

interface WeekPreviewTimelineProps {
  weeks: WeekPreview[];
}

export function WeekPreviewTimeline({ weeks }: WeekPreviewTimelineProps) {
  const [expandedWeek, setExpandedWeek] = useState<number | null>(0);

  return (
    <div className="space-y-2">
      <h3 className="text-caption uppercase tracking-wider px-1">4-Week Preview</h3>
      {weeks.map((week) => {
        const isExpanded = expandedWeek === week.weekNumber - 1;
        const isEmpty = week.items.length === 0;

        return (
          <button
            key={week.weekNumber}
            onClick={() => setExpandedWeek(isExpanded ? null : week.weekNumber - 1)}
            className="w-full text-left"
          >
            <div className={`rounded-xl border transition-colors ${
              isExpanded ? "border-accent/30 bg-accent/5" : "border-border bg-card"
            } p-3`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isExpanded
                    ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    : <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  }
                  <span className="text-sm font-medium">{week.label}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {week.items.length} service{week.items.length !== 1 ? "s" : ""}
                </span>
              </div>
              {isExpanded && (
                <div className="mt-2 pl-6 space-y-1.5 animate-fade-in">
                  {isEmpty ? (
                    <p className="text-xs text-muted-foreground italic">No services this week</p>
                  ) : (
                    week.items.map((item, i) => (
                      <div key={`${item.skuId}-${i}`} className="flex items-center justify-between">
                        <span className="text-sm">{item.skuName}</span>
                        <span className="text-xs text-muted-foreground">{item.cadence}</span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
