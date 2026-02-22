import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { Badge } from "@/components/ui/badge";
import type { PreviewVisit } from "@/hooks/useFourWeekPreview";

interface VisitCardProps {
  visit: PreviewVisit;
  compact?: boolean;
}

export function VisitCard({ visit, compact }: VisitCardProps) {
  const navigate = useNavigate();

  const canNavigate = visit.jobId && (visit.status === "completed" || visit.status === "issue");

  const typeBadgeClass =
    visit.type === "routine"
      ? "bg-accent/10 text-accent border-accent/20"
      : visit.type === "seasonal"
        ? "bg-warning/10 text-warning border-warning/20"
        : "bg-primary/10 text-primary border-primary/20";

  const typeLabel =
    visit.type === "routine" ? "Routine" : visit.type === "seasonal" ? "Seasonal" : "Add-on";

  return (
    <Card
      className={`p-3 flex items-center gap-3 transition-colors ${canNavigate ? "cursor-pointer hover:bg-secondary/50" : ""} ${compact ? "p-2" : ""}`}
      onClick={() => canNavigate && navigate(`/customer/visits/${visit.jobId}`)}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${typeBadgeClass}`}>
            {typeLabel}
          </Badge>
          <StatusBadge status={visit.status} className="text-[10px] h-5" />
        </div>
        <p className="text-sm truncate">{visit.serviceSummary}</p>
      </div>
      {canNavigate && (
        <span className="text-xs text-muted-foreground shrink-0">View →</span>
      )}
    </Card>
  );
}
