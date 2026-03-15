import { Card } from "@/components/ui/card";
import { useProviderJobs } from "@/hooks/useProviderJobs";
import { useProviderEarnings } from "@/hooks/useProviderEarnings";
import { formatCents } from "@/utils/format";
import { CheckCircle, Clock, ListChecks, DollarSign, Trophy, LogIn } from "lucide-react";

function getRecapMessage(completedCount: number, totalCount: number, checkInRate: number): string {
  if (completedCount === totalCount && totalCount > 0) {
    return checkInRate === 100
      ? "All visits complete with check-ins — great day!"
      : "All visits complete — solid work!";
  }
  if (completedCount === 1) return "Your first visit today is complete!";
  if (checkInRate >= 90) return "Looking great — strong check-in discipline!";
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

  // Service count from completed jobs' SKUs
  const totalSkus = completedJobs.reduce(
    (sum, j) => sum + (j.job_skus?.length ?? 0),
    0
  );

  const message = getRecapMessage(completedCount, totalCount, checkInRate);
  const earningsReady = completedCount > 0 && periodTotal > 0;

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
          <LogIn className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className="text-xs text-muted-foreground">
            {checkInRate}% checked in
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
            {earningsReady
              ? `${formatCents(periodTotal)} earned`
              : "Earnings updating…"}
          </span>
        </div>
      </div>

      <p className="text-xs text-success font-medium mt-3">{message}</p>
    </Card>
  );
}
