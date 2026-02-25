import { useNavigate } from "react-router-dom";
import { StatCard } from "@/components/StatCard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { useProviderJobs, ProviderJob } from "@/hooks/useProviderJobs";
import { useProviderEarnings } from "@/hooks/useProviderEarnings";
import { useAuth } from "@/contexts/AuthContext";
import {
  Briefcase,
  Clock,
  DollarSign,
  ChevronRight,
  MapPin,
  CalendarDays,
  TrendingUp,
} from "lucide-react";
import { format } from "date-fns";

function formatCents(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function QuickJobCard({ job, index }: { job: ProviderJob; index: number }) {
  const navigate = useNavigate();
  const skuNames =
    job.job_skus
      ?.map((s) => s.sku_name_snapshot)
      .filter(Boolean)
      .join(", ") || "No services";
  const addr = job.property;
  const estMinutes =
    job.job_skus?.reduce(
      (sum, s) => sum + (s.duration_minutes_snapshot ?? 0),
      0
    ) ?? 0;

  return (
    <Card
      className="p-3 press-feedback cursor-pointer"
      onClick={() => navigate(`/provider/jobs/${job.id}`)}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/10 shrink-0">
          <span className="text-xs font-bold text-accent">#{index + 1}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">
            {addr ? `${addr.street_address}` : "Property"}
          </p>
          <p className="text-xs text-muted-foreground truncate">{skuNames}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {estMinutes > 0 && (
            <span className="text-xs text-muted-foreground">
              {estMinutes}m
            </span>
          )}
          <StatusBadge status={job.status.toLowerCase()} />
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
    </Card>
  );
}

function TodaysJobsList() {
  const { data: jobs, isLoading } = useProviderJobs("today");
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (!jobs || jobs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <MapPin className="h-8 w-8 text-muted-foreground/30 mb-2" />
        <p className="text-sm text-muted-foreground font-medium">
          No jobs scheduled for today
        </p>
        <p className="text-xs text-muted-foreground/60 mt-1">
          Check upcoming jobs or enjoy the day off
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {jobs.map((job, i) => (
        <QuickJobCard key={job.id} job={job} index={i} />
      ))}
      <Button
        variant="ghost"
        size="sm"
        className="w-full text-accent"
        onClick={() => navigate("/provider/jobs")}
      >
        View all jobs
        <ChevronRight className="h-4 w-4 ml-1" />
      </Button>
    </div>
  );
}

function UpcomingPreview() {
  const { data: jobs, isLoading } = useProviderJobs("upcoming");

  if (isLoading) {
    return <Skeleton className="h-20 w-full rounded-xl" />;
  }

  const upcoming = (jobs ?? []).slice(0, 3);

  if (upcoming.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        No upcoming jobs scheduled
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {upcoming.map((job) => (
        <div
          key={job.id}
          className="flex items-center gap-3 px-1 py-2 border-b border-border last:border-0"
        >
          <CalendarDays className="h-4 w-4 text-muted-foreground shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {job.property?.street_address ?? "Property"}
            </p>
            <p className="text-xs text-muted-foreground">
              {job.scheduled_date
                ? format(new Date(job.scheduled_date), "EEE, MMM d")
                : "TBD"}
            </p>
          </div>
          <span className="text-xs text-muted-foreground">
            {job.job_skus?.length ?? 0} services
          </span>
        </div>
      ))}
    </div>
  );
}

export default function ProviderDashboard() {
  const { profile } = useAuth();
  const { data: todayJobs, isLoading: jobsLoading } = useProviderJobs("today");
  const { eligibleBalance, heldBalance, earnings, isLoading: earningsLoading } =
    useProviderEarnings();
  const navigate = useNavigate();

  const todayCount = todayJobs?.length ?? 0;
  const estMinutes =
    todayJobs?.reduce(
      (sum, job) =>
        sum +
        (job.job_skus?.reduce(
          (s, sku) => s + (sku.duration_minutes_snapshot ?? 0),
          0
        ) ?? 0),
      0
    ) ?? 0;

  // This week's earnings: filter earnings created in the last 7 days
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekEarnings = earnings
    .filter((e) => new Date(e.created_at) >= weekAgo)
    .reduce((sum, e) => sum + e.total_cents, 0);

  const firstName = profile?.full_name?.split(" ")[0] ?? "Provider";
  const isLoading = jobsLoading || earningsLoading;

  return (
    <div className="animate-fade-in p-4 pb-24 space-y-5 max-w-2xl">
      {/* Greeting */}
      <div>
        <h1 className="text-h2">
          {getGreeting()}, {firstName}
        </h1>
        <p className="text-caption mt-0.5">
          {todayCount > 0
            ? `You have ${todayCount} job${todayCount > 1 ? "s" : ""} today`
            : "No jobs scheduled for today"}
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid gap-3 grid-cols-2">
        <StatCard
          icon={Briefcase}
          label="Today's Jobs"
          value={isLoading ? "—" : todayCount}
        />
        <StatCard
          icon={Clock}
          label="Est. Time"
          value={isLoading ? "—" : estMinutes > 0 ? `${estMinutes} min` : "0 min"}
        />
      </div>

      <div className="grid gap-3 grid-cols-2">
        <StatCard
          icon={DollarSign}
          label="Available"
          value={isLoading ? "—" : formatCents(eligibleBalance)}
        />
        <StatCard
          icon={TrendingUp}
          label="This Week"
          value={isLoading ? "—" : formatCents(weekEarnings)}
        />
      </div>

      {/* Today's Job Queue */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold">Today's Queue</h2>
          {todayCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-accent h-auto p-0"
              onClick={() => navigate("/provider/jobs")}
            >
              See all
            </Button>
          )}
        </div>
        <TodaysJobsList />
      </div>

      {/* Upcoming Preview */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold">Coming Up</h2>
        </div>
        <Card className="p-3">
          <UpcomingPreview />
        </Card>
      </div>
    </div>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}
