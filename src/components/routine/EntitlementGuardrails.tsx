import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface EntitlementGuardrailsProps {
  cycleDemand: number;
  included: number;
  maxExtras: number;
  modelLabel: string;
  onAutoFit: () => void;
  isAutoFitting?: boolean;
}

export function EntitlementGuardrails({
  cycleDemand,
  included,
  maxExtras,
  modelLabel,
  onAutoFit,
  isAutoFitting,
}: EntitlementGuardrailsProps) {
  const navigate = useNavigate();
  const total = included + maxExtras;
  const isOver = cycleDemand > total;

  if (!isOver) return null;

  const overBy = Math.ceil((cycleDemand - total) * 10) / 10;

  return (
    <div className="rounded-xl border border-warning/50 bg-warning/10 p-4 space-y-3 animate-scale-in">
      <div className="flex items-start gap-2">
        <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-warning-foreground">
            Routine exceeds plan by ~{overBy} {modelLabel}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Your plan includes {included} {modelLabel}/cycle{maxExtras > 0 ? ` + ${maxExtras} extras` : ""}.
            This routine needs ~{Math.ceil(cycleDemand)}.
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" className="text-xs" onClick={onAutoFit} disabled={isAutoFitting}>
          Auto-fit to plan
        </Button>
        <Button variant="outline" size="sm" className="text-xs" onClick={() => navigate("/customer/plans")}>
          Change plan
        </Button>
      </div>
    </div>
  );
}
