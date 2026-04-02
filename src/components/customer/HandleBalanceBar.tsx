import { Sparkles } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface HandleBalanceBarProps {
  balance: number;
  perCycle: number;
  rollover?: number;
  className?: string;
}

export function HandleBalanceBar({ balance, perCycle, rollover, className = "" }: HandleBalanceBarProps) {
  const used = Math.max(0, perCycle - balance);
  const pct = perCycle > 0 ? Math.min(100, Math.round((balance / perCycle) * 100)) : 0;
  const rolloverCount = rollover ?? Math.max(0, balance - perCycle);

  return (
    <div className={`rounded-lg border bg-card p-4 space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-accent" />
          <span className="text-sm font-semibold">Handles</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {balance} remaining
          </span>
          {rolloverCount > 0 && (
            <Badge className="bg-accent text-accent-foreground border-transparent text-[10px] px-1.5 py-0">
              +{rolloverCount} rolled over
            </Badge>
          )}
        </div>
      </div>
      <Progress value={pct} className="h-2" />
      <p className="text-xs text-muted-foreground">
        {used} used · {balance} of {perCycle} remaining this cycle
      </p>
    </div>
  );
}
