import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { VisitCard } from "./VisitCard";
import type { PreviewWeek } from "@/hooks/useFourWeekPreview";

interface WeekTimelineProps {
  week: PreviewWeek;
  defaultOpen?: boolean;
}

export function WeekTimeline({ week, defaultOpen = false }: WeekTimelineProps) {
  const [expanded, setExpanded] = useState(defaultOpen);
  const visits = week.visits;
  const hasVisits = visits.length > 0;
  const extraCount = visits.length > 1 ? visits.length - 1 : 0;

  return (
    <div className="border-l-2 border-border pl-4 pb-4 last:pb-0 relative">
      {/* Timeline dot */}
      <div className="absolute -left-[5px] top-0 h-2 w-2 rounded-full bg-accent" />

      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-sm font-medium mb-2 hover:text-accent transition-colors w-full text-left"
      >
        {expanded ? (
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
        )}
        {week.label}
        {!hasVisits && (
          <span className="text-xs text-muted-foreground font-normal">— No visits</span>
        )}
        {!expanded && extraCount > 0 && (
          <span className="text-xs text-muted-foreground font-normal ml-auto">+{extraCount} more</span>
        )}
      </button>

      {hasVisits && !expanded && (
        <VisitCard visit={visits[0]} compact />
      )}

      {hasVisits && expanded && (
        <div className="space-y-2">
          {visits.map((v, i) => (
            <VisitCard key={i} visit={v} />
          ))}
        </div>
      )}
    </div>
  );
}
