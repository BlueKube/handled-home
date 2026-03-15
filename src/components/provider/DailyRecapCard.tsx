import { Card } from "@/components/ui/card";
import { useProviderJobs } from "@/hooks/useProviderJobs";
import { useProviderEarnings } from "@/hooks/useProviderEarnings";
import { CheckCircle, Clock, ListChecks, DollarSign, Trophy } from "lucide-react";

function formatCents(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function getRecapMessage(completedCount: number, totalCount: number, onTimeRate: number): string {
  if (completedCount === totalCount && totalCount > 0) {
    return onTimeRate === 100
      ? "All visits complete and on time — great day!"
      : "All visits complete — solid work!";
  }
  if (completedCount === 1) return "Your first visit today is complete!";
  if (onTimeRate >= 90) return "Looking great — strong on-time performance!";
  return "Keep it up — you're making progress!";
}

export function DailyRecapCard() {
  const { data: allTodayJobs, isLoading: jobsLoading } = useProviderJobs("today_all");
  const { periodTotal, isLoading: earningsLoading } = useProviderEarnings("today");

  if (jobsLoading || earningsLoading) return null;

  const jobs = allTodayJobs ?? [];
  const totalCount = jobs.length;
  const completedJobs = jobs.filter((j) => j.status === "COMPLETED");
  const completedCount = completedJobs.length;

  // Don't show recap until at least one job is completed
  if (completedCount === 0) return null;

  // Check-in rate: percentage of completed jobs where provider checked in (arrived_at set)
  const arrivedCount = completedJobs.filter((j) => j.arrived_at).length;
  const checkInRate = Math.round((arrivedCount / completedCount) * 100);

  // Photo count from completed jobs' SKUs (proxy — actual photo count would need a separate query)
  const totalSkus = completedJobs.reduce(
    (sum, j) => sum + (j.job_skus?.length ?? 0),
    0
  );

  const message = getRecapMessage(completedCount, totalCount, checkInRate);

  return (
    <Card className="p-4 bg-success/5 border-success/20">
      <div className="flex items-center gap-2 mb-3">
        <Trophy className="h-4 w-4 text-success" />
        <h3 className="text-sm font-semibold">Today's Recap</h3>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-3.5 w-3.5 text-success shrink-0" />
          <span className="text-xs text-muted-foreground">
            {completedCount} of {totalCount} complete
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-3.5 w-3.5 text-accent shrink-0" />
          <span className="text-xs text-muted-foreground">
            {checkInRate}% on-time
          </span>
        </div>
        <div className="flex items-center gap-2">
          <ListChecks className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className="text-xs text-muted-foreground">
            {totalSkus} service{totalSkus !== 1 ? "s" : ""} logged
          </span>
        </div>
        <div className="flex items-center gap-2">
          <DollarSign className="h-3.5 w-3.5 text-accent shrink-0" />
          <span className="text-xs text-muted-foreground">
            {formatCents(periodTotal)} earned
          </span>
        </div>
      </div>

      <p className="text-xs text-success font-medium mt-3">{message}</p>
    </Card>
  );
}
