import { Card } from "@/components/ui/card";
import { TrendingUp, Target, Zap } from "lucide-react";

interface EarningsProjectionCardProps {
  /** Current capacity utilization 0-100 */
  capacityPercent: number;
  /** Current weekly earnings in cents */
  weeklyEarningsCents: number;
  /** Projected weekly at full capacity in cents */
  fullCapacityWeeklyCents?: number;
  /** Number of jobs this week */
  weeklyJobs: number;
  /** Average estimated daily finish time */
  estimatedFinishTime?: string;
  variant?: "dashboard" | "onboarding";
}

function formatCents(cents: number) {
  return `$${Math.round(cents / 100).toLocaleString()}`;
}

export function EarningsProjectionCard({
  capacityPercent,
  weeklyEarningsCents,
  fullCapacityWeeklyCents,
  weeklyJobs,
  estimatedFinishTime,
  variant = "dashboard",
}: EarningsProjectionCardProps) {
  const monthlyEstimate = weeklyEarningsCents * 4;
  const fullCapacityMonthly = fullCapacityWeeklyCents ? fullCapacityWeeklyCents * 4 : undefined;
  const additionalMonthly = fullCapacityMonthly ? fullCapacityMonthly - monthlyEstimate : undefined;

  if (variant === "onboarding") {
    return (
      <Card className="p-5 bg-accent/5 border-accent/20 space-y-3">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-full bg-accent/10 flex items-center justify-center">
            <TrendingUp className="h-5 w-5 text-accent" />
          </div>
          <div>
            <p className="text-sm font-semibold">Earnings potential in your zone</p>
            <p className="text-xs text-muted-foreground">Based on current provider averages</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-background rounded-xl p-3 text-center">
            <p className="text-xs text-muted-foreground">At 60% capacity</p>
            <p className="text-xl font-bold text-foreground">
              {formatCents(weeklyEarningsCents)}<span className="text-sm font-normal text-muted-foreground">/wk</span>
            </p>
          </div>
          <div className="bg-background rounded-xl p-3 text-center">
            <p className="text-xs text-muted-foreground">Full schedule</p>
            <p className="text-xl font-bold text-accent">
              {fullCapacityWeeklyCents ? formatCents(fullCapacityWeeklyCents) : formatCents(Math.round(weeklyEarningsCents / 0.6))}
              <span className="text-sm font-normal text-muted-foreground">/wk</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Zap className="h-3 w-3 text-accent" />
          <span>Dense routes mean less time on the road, more earning</span>
        </div>
      </Card>
    );
  }

  // Dashboard variant
  return (
    <Card className="p-4 bg-primary/5 border-primary/20">
      <div className="flex items-start gap-3">
        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <Target className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground">
            {capacityPercent < 80
              ? `You're at ${capacityPercent}% capacity`
              : "You're nearly at full capacity"}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {weeklyJobs} jobs/week · {estimatedFinishTime ? `avg finish ${estimatedFinishTime}` : `est. ${formatCents(monthlyEstimate)}/mo`}
          </p>
          {additionalMonthly && additionalMonthly > 0 && capacityPercent < 90 && (
            <p className="text-xs text-accent font-medium mt-1">
              Fill your schedule to earn {formatCents(additionalMonthly)} more/mo
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}
