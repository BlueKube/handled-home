import { type LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { HelpTip } from "@/components/ui/help-tip";
import { cn } from "@/lib/utils";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  trend?: {
    direction: "up" | "down";
    percentage: number;
  };
  compact?: boolean;
  className?: string;
  helpText?: string;
}

export function StatCard({ icon: Icon, label, value, trend, compact = false, className, helpText }: StatCardProps) {
  if (compact) {
    return (
      <div className={cn("flex items-center gap-3 py-2", className)}>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/10 shrink-0">
          <Icon className="h-4 w-4 text-accent" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-muted-foreground truncate">{label}</p>
          <p className="text-base font-semibold">{value}</p>
        </div>
        {trend && (
          <div className={cn(
            "flex items-center gap-0.5 text-xs font-medium",
            trend.direction === "up" ? "text-success" : "text-destructive"
          )}>
            {trend.direction === "up" ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {trend.percentage}%
          </div>
        )}
      </div>
    );
  }

  return (
    <Card variant="interactive" className={cn("p-4", className)}>
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 shrink-0">
          <Icon className="h-5 w-5 text-accent" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-muted-foreground flex items-center gap-0.5">
            {label}
            {helpText && <HelpTip text={helpText} />}
          </p>
          <div className="flex items-baseline gap-2 mt-0.5">
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            {trend && (
              <div className={cn(
                "flex items-center gap-0.5 text-xs font-medium",
                trend.direction === "up" ? "text-success" : "text-destructive"
              )}>
                {trend.direction === "up" ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {trend.percentage}%
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
