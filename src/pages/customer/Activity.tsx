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
  Clock,
  TrendingUp,
  ArrowRight,
  Camera,
} from "lucide-react";
import { CustomerEmptyState } from "@/components/customer/CustomerEmptyState";
import { HelpTip } from "@/components/ui/help-tip";
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
  const { data: completedJobs, isLoading } = useCustomerJobs("completed", { includePhotos: true });
  const { data: subscription } = useCustomerSubscription();

  const stats = useMemo(() => {
    if (!completedJobs) return null;
    const totalServices = completedJobs.length;
    const memberMonths = subscription?.created_at
      ? differenceInMonths(new Date(), new Date(subscription.created_at))
      : 0;
    const totalPhotos = completedJobs.reduce(
      (sum, job) => sum + (job.photo_count ?? 0),
      0
    );

    return { totalServices, memberMonths, totalPhotos };
  }, [completedJobs, subscription]);

  // Re-sort by completed_at DESC so the most recently finished job is first.
  // The hook orders by scheduled_date which is wrong for completion chronology.
  const sortedJobs = useMemo(() => {
    if (!completedJobs) return [];
    return [...completedJobs].sort((a, b) => {
      const aDate = a.completed_at ?? a.scheduled_date ?? a.created_at;
      const bDate = b.completed_at ?? b.scheduled_date ?? b.created_at;
      return bDate.localeCompare(aDate);
    });
  }, [completedJobs]);

  const latestJob: CustomerJob | null = sortedJobs[0] ?? null;

  const groupedJobs = useMemo(() => {
    if (sortedJobs.length === 0) return [];
    const groups: Record<string, any[]> = {};
    for (const job of sortedJobs) {
      // Prefer completed_at (timestamp) over scheduled_date (date-only) for
      // grouping — completed_at reflects when work actually happened and
      // avoids bucketing legacy/corrected records under "Unscheduled".
      const dateSource = job.completed_at ?? job.scheduled_date;
      const key = dateSource
        ? format(
            job.completed_at ? new Date(dateSource) : parseISO(dateSource),
            "MMMM yyyy",
          )
        : "Unscheduled";
      if (!groups[key]) groups[key] = [];
      groups[key].push(job);
    }
    return Object.entries(groups);
  }, [sortedJobs]);

  if (isLoading) {
    return (
      <div className="px-4 py-6 pb-24 max-w-lg mx-auto space-y-4">
        <h1 className="text-h2">Activity</h1>
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="px-4 py-6 pb-24 max-w-lg mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <h1 className="text-h2">Activity</h1>

      {/* Summary stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-3">
          <StatPill icon={Shield} label="Services" value={stats.totalServices} />
          <StatPill icon={Calendar} label="Months" value={stats.memberMonths > 0 ? stats.memberMonths : "New"} />
          <StatPill icon={Camera} label="Photos" value={stats.totalPhotos} />
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
                <HelpTip text="Every visit includes a photo receipt and checklist verification — this is the cumulative value your membership has delivered." />
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
              {latestJob.photos?.[0]?.url ? (
                <img
                  src={latestJob.photos[0].url}
                  alt="Service photo"
                  className="h-10 w-10 rounded-lg object-cover shrink-0"
                  onError={(e) => {
                    const el = e.currentTarget;
                    el.onerror = null;
                    el.style.display = "none";
                    el.parentElement?.querySelector("[data-photo-fallback]")?.classList.remove("hidden");
                  }}
                />
              ) : null}
              <div
                className={`h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0${latestJob.photos?.[0]?.url ? " hidden" : ""}`}
                data-photo-fallback
              >
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
        <CustomerEmptyState
          icon={Clock}
          title="No completed services yet"
          body="Your service history will build here over time. Each visit includes proof photos and a receipt."
          ctaLabel="View your schedule"
          ctaAction={() => navigate("/customer/schedule")}
        />
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
                          {job.completed_at
                            ? format(new Date(job.completed_at), "EEE, MMM d")
                            : job.scheduled_date
                              ? format(parseISO(job.scheduled_date), "EEE, MMM d")
                              : "Completed"}
                        </p>
                        {(job.photo_count > 0 || (job.photos?.length ?? 0) > 0) && (
                          <div className="flex items-center gap-1 mt-1">
                            <Camera className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              {job.photo_count} photo{job.photo_count !== 1 ? "s" : ""}
                            </span>
                          </div>
                        )}
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
