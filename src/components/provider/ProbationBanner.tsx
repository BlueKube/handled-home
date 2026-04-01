import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Clock } from "lucide-react";
import { differenceInDays, format } from "date-fns";
import { useProviderOrg } from "@/hooks/useProviderOrg";
import { useActiveProbation } from "@/hooks/useProviderAccountability";

export function ProbationBanner() {
  const { org } = useProviderOrg();
  const { data: probation } = useActiveProbation(org?.id ?? "");

  if (!probation) return null;

  const daysLeft = differenceInDays(new Date(probation.deadline_at), new Date());
  const isOverdue = daysLeft < 0;

  return (
    <Card className="border-amber-500/50 bg-amber-500/5 p-4 space-y-2">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-amber-500" />
        <span className="text-sm font-semibold text-amber-600">Performance Improvement Period</span>
        <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-500/30">Active</Badge>
      </div>
      <p className="text-xs text-muted-foreground">
        Your account is under review due to recent service quality metrics.
        Focus on meeting your improvement targets to return to good standing.
      </p>
      <div className="flex items-center gap-4 text-xs">
        <div className="flex items-center gap-1">
          <Clock className={`h-3 w-3 ${isOverdue ? "text-destructive" : "text-amber-500"}`} />
          <span className={isOverdue ? "text-destructive font-semibold" : "text-muted-foreground"}>
            {isOverdue
              ? `Review overdue by ${Math.abs(daysLeft)} days`
              : `${daysLeft} days remaining (${format(new Date(probation.deadline_at), "MMM d")})`
            }
          </span>
        </div>
      </div>
    </Card>
  );
}
