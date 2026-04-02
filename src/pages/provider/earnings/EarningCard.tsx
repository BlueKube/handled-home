import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, ChevronDown, ChevronUp, Zap, PauseCircle } from "lucide-react";
import { formatCents } from "@/utils/format";
import { format, formatDistanceToNow } from "date-fns";
import type { ProviderEarning } from "@/hooks/useProviderEarnings";
import { modifierExplanation, holdReasonLabel, statusVariant } from "./shared";

export function EarningCard({ earning }: { earning: ProviderEarning }) {
  const [expanded, setExpanded] = useState(false);
  const jobDate = earning.jobs?.scheduled_date;
  const address = earning.jobs?.properties?.street_address;
  const baseCents = earning.base_amount_cents ?? (earning.total_cents - earning.modifier_cents);

  return (
    <Card
      className="p-3 cursor-pointer"
      role="button"
      tabIndex={0}
      aria-expanded={expanded}
      aria-label={`Earning details for ${address ?? "job"}`}
      onClick={() => setExpanded(!expanded)}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), setExpanded(!expanded))}
    >
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
          <DollarSign className="h-4 w-4 text-accent" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{address ?? "Job"}</p>
          <div className="flex items-center gap-2 mt-0.5">
            {jobDate && (
              <span className="text-xs text-muted-foreground">
                {format(new Date(jobDate), "MMM d")}
              </span>
            )}
            <Badge variant={statusVariant(earning.status)} className="text-xs">
              {earning.status.replace(/_/g, " ")}
            </Badge>
          </div>
        </div>
        <div className="text-right shrink-0 flex items-center gap-1">
          <div>
            <p className="text-sm font-bold">{formatCents(earning.total_cents)}</p>
            {earning.modifier_cents !== 0 && (
              <p className="text-xs text-muted-foreground">
                {earning.modifier_cents > 0 ? "+" : ""}
                {formatCents(earning.modifier_cents)}
              </p>
            )}
          </div>
          {expanded ? (
            <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          )}
        </div>
      </div>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-border space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Base pay</span>
            <span className="font-medium">{formatCents(baseCents)}</span>
          </div>
          {earning.modifier_cents !== 0 && (
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground flex items-center gap-1">
                <Zap className="h-3 w-3" />
                {modifierExplanation(earning.modifier_cents, earning.hold_reason)}
              </span>
              <span className={`font-medium ${earning.modifier_cents > 0 ? "text-success" : "text-destructive"}`}>
                {earning.modifier_cents > 0 ? "+" : ""}
                {formatCents(earning.modifier_cents)}
              </span>
            </div>
          )}
          <div className="flex justify-between text-xs font-semibold pt-1 border-t border-border/50">
            <span>Net pay</span>
            <span>{formatCents(earning.total_cents)}</span>
          </div>
          {earning.hold_reason && (
            <div className="flex items-center gap-1.5 text-xs text-warning mt-1">
              <PauseCircle className="h-3 w-3" />
              <span>Hold: {holdReasonLabel(earning.hold_reason)}</span>
              {earning.hold_until && (
                <span className="text-muted-foreground">
                  · releases {formatDistanceToNow(new Date(earning.hold_until), { addSuffix: true })}
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
