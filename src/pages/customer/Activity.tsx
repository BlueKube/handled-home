import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useCustomerJobs, type CustomerJob } from "@/hooks/useCustomerJobs";
import { useCustomerSubscription } from "@/hooks/useSubscription";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CheckCircle,
  Shield,
  Calendar,
  TrendingUp,
  ArrowRight,
} from "lucide-react";
import { format, differenceInMonths, parseISO } from "date-fns";

function StatPill({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string | number }) {
  return (
    <div className="bg-card rounded-xl border p-3 text-center">
      <Icon className="h-4 w-4 text-accent mx-auto mb-1" />
      <p className="text-lg font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

export default function Activity() {
  const navigate = useNavigate();
  const { data: completedJobs, isLoading } = useCustomerJobs("completed");
  const { data: subscription } = useCustomerSubscription();

  const stats = useMemo(() => {
    if (!completedJobs) return null;
    const totalServices = completedJobs.length;
    const memberMonths = subscription?.created_at
      ? differenceInMonths(new Date(), new Date(subscription.created_at))
      : 0;

    return { totalServices, memberMonths };
  }, [completedJobs, subscription]);

  const latestJob: CustomerJob | null = completedJobs?.[0] ?? null;

  const groupedJobs = useMemo(() => {
    if (!completedJobs) return [];
    const groups: Record<string, any[]> = {};
    for (const job of completedJobs) {
      const key = job.scheduled_date
        ? format(parseISO(job.scheduled_date), "MMMM yyyy")
        : "Unscheduled";
      if (!groups[key]) groups[key] = [];
      groups[key].push(job);
    }
    return Object.entries(groups);
  }, [completedJobs]);

  if (isLoading) {
    return (
      <div className="p-4 space-y-4 max-w-lg mx-auto pb-24">
        <h1 className="text-h2">Activity</h1>
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="p-4 pb-24 space-y-6 max-w-lg mx-auto animate-fade-in">
      {/* Header */}
      <h1 className="text-h2">Activity</h1>

      {/* Summary stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-3">
          <StatPill icon={Shield} label="Services" value={stats.totalServices} />
          <StatPill icon={Calendar} label="Months" value={stats.memberMonths > 0 ? stats.memberMonths : "New"} />
          <StatPill icon={CheckCircle} label="Receipts" value={stats.totalServices} />
        </div>
      )}

      {/* Value card */}
      {stats && stats.totalServices > 0 && (
        <Card className="p-4 bg-accent/5 border-accent/20">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-5 w-5 text-accent shrink-0" />
            <div>
              <p className="text-sm font-semibold">
                Your home has received {stats.totalServices} professional service{stats.totalServices !== 1 ? "s" : ""}
                {subscription?.created_at && (
                  <> since {format(new Date(subscription.created_at), "MMMM yyyy")}</>
                )}
              </p>
              <Badge variant="outline" className="mt-1.5 text-[10px] border-primary/20 text-primary bg-primary/5">
                Insured providers · Proof on every visit
              </Badge>
            </div>
          </div>
        </Card>
      )}

      {/* Recent Receipt Highlight */}
      {latestJob && (
        <Card
          className="p-4 cursor-pointer hover:bg-secondary/30 transition-colors"
          onClick={() => navigate(`/customer/visits/${latestJob.id}`)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                <CheckCircle className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-sm font-medium">
                  {latestJob.skus
                    ?.map((s) => s.sku_name_snapshot)
                    .filter(Boolean)
                    .join(", ") || "Latest visit"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {latestJob.completed_at
                    ? format(new Date(latestJob.completed_at), "MMM d, yyyy")
                    : latestJob.scheduled_date
                      ? format(parseISO(latestJob.scheduled_date), "MMM d, yyyy")
                      : "Completed"}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="text-xs gap-1">
              View receipt
              <ArrowRight className="h-3 w-3" />
            </Button>
          </div>
        </Card>
      )}

      {/* Timeline */}
      {groupedJobs.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No completed services yet</p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            Your service history will build here over time.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {groupedJobs.map(([month, jobs]) => (
            <div key={month}>
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold">{month}</h2>
                <Badge variant="secondary" className="text-xs ml-auto">
                  {jobs.length} visit{jobs.length !== 1 ? "s" : ""}
                </Badge>
              </div>

              <div className="space-y-2 pl-2 border-l-2 border-accent/20">
                {jobs.map((job: any) => (
                  <Card
                    key={job.id}
                    className="p-3 ml-4 cursor-pointer hover:bg-secondary/30 transition-colors"
                    onClick={() => navigate(`/customer/visits/${job.id}`)}
                  >
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-4 w-4 text-accent shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {job.skus
                            ?.map((s: any) => s.sku_name_snapshot)
                            .filter(Boolean)
                            .join(", ") || "Service visit"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {job.scheduled_date
                            ? format(parseISO(job.scheduled_date), "EEE, MMM d")
                            : "Completed"}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
