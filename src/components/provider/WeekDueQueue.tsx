import { VisitJobCard } from "@/components/provider/VisitJobCard";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import type { ProviderVisit } from "@/hooks/useProviderVisits";

interface WeekDueQueueProps {
  /** Pre-filtered due visits. If provided, skips the separate network request. */
  visits?: ProviderVisit[];
}

export function WeekDueQueue({ visits: passedVisits }: WeekDueQueueProps) {
  // Use passed visits directly — no redundant fetch
  const dueVisits = passedVisits;

  if (!dueVisits || dueVisits.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <CheckCircle2 className="h-8 w-8 text-green-500 mb-2" />
        <p className="text-sm font-medium text-muted-foreground">All caught up</p>
        <p className="text-xs text-muted-foreground/70 mt-0.5">No overdue or due-soon visits this week</p>
      </div>
    );
  }

  const overdue = dueVisits.filter((v) => v.due_status === "overdue");
  const dueSoon = dueVisits.filter((v) => v.due_status === "due_soon");

  return (
    <div className="space-y-4">
      {overdue.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <h3 className="text-sm font-semibold text-destructive">Overdue ({overdue.length})</h3>
          </div>
          <div className="space-y-2">
            {overdue.map((visit, i) => (
              <VisitJobCard
                key={visit.id}
                visit={visit}
                index={i}
                total={overdue.length}
                showReorder={false}
              />
            ))}
          </div>
        </div>
      )}

      {dueSoon.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <h3 className="text-sm font-semibold text-amber-700 dark:text-amber-400">Due Soon ({dueSoon.length})</h3>
          </div>
          <div className="space-y-2">
            {dueSoon.map((visit, i) => (
              <VisitJobCard
                key={visit.id}
                visit={visit}
                index={i}
                total={dueSoon.length}
                showReorder={false}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
