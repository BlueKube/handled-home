import { Sparkles } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface HandleBalanceBarProps {
  balance: number;
  perCycle: number;
  className?: string;
}

export function HandleBalanceBar({ balance, perCycle, className = "" }: HandleBalanceBarProps) {
  const used = Math.max(0, perCycle - balance);
  const pct = perCycle > 0 ? Math.round((balance / perCycle) * 100) : 0;

  return (
    <div className={`rounded-lg border bg-card p-4 space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-accent" />
          <span className="text-sm font-semibold">Handles</span>
        </div>
        <span className="text-sm text-muted-foreground">
          {balance} remaining
        </span>
      </div>
      <Progress value={pct} className="h-2" />
      <p className="text-xs text-muted-foreground">
        {used} used · {balance} of {perCycle} remaining this cycle
      </p>
    </div>
  );
}
