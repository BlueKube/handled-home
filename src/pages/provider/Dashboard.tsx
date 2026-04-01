import { useNavigate } from "react-router-dom";
import { StatCard } from "@/components/StatCard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { QueryErrorCard } from "@/components/QueryErrorCard";
import { useProviderJobs, ProviderJob } from "@/hooks/useProviderJobs";
import { useProviderEarnings } from "@/hooks/useProviderEarnings";
import { useProviderRoutePlan } from "@/hooks/useProviderRoutePlan";
import { useAuth } from "@/contexts/AuthContext";
import { useProviderOrg } from "@/hooks/useProviderOrg";
import { formatCents } from "@/utils/format";
import { ProviderNotificationBanners } from "@/components/provider/NotificationBanners";
import { ProviderStatusBanner } from "@/components/provider/ProviderStatusBanner";
import { MarketHeatBanner } from "@/components/provider/MarketHeatBanner";
import { ByocBanner } from "@/components/provider/ByocBanner";
import { ProbationBanner } from "@/components/provider/ProbationBanner";
import { EarningsProjectionCard } from "@/components/provider/EarningsProjectionCard";
import { DailyRecapCard } from "@/components/provider/DailyRecapCard";
import { RouteProgressCard } from "@/components/provider/RouteProgressCard";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Briefcase,
  Clock,
  DollarSign,
  ChevronRight,
  MapPin,
  CalendarDays,
  TrendingUp,
  Car,
  Lock,
  Loader2,
  ShieldOff,
  Headphones,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

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
  const { data: jobs, isLoading, isError, refetch } = useProviderJobs("today");
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

  if (isError) {
    return <QueryErrorCard message="Failed to load today's jobs." onRetry={() => refetch()} />;
  }

  if (!jobs || jobs.length === 0) {
    return (
      <EmptyState
        compact
        icon={MapPin}
        title="No jobs scheduled for today"
        body="Check upcoming jobs or enjoy the day off."
      />
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
  const { data: jobs, isLoading, isError, refetch } = useProviderJobs("upcoming");

  if (isLoading) {
    return <Skeleton className="h-20 w-full rounded-xl" />;
  }

  if (isError) {
    return <QueryErrorCard message="Failed to load upcoming jobs." onRetry={() => refetch()} />;
  }

  const upcoming = (jobs ?? []).slice(0, 3);

  if (upcoming.length === 0) {
    return (
      <EmptyState
        compact
        icon={CalendarDays}
        title="No upcoming jobs"
        body="Jobs will appear here when assigned to your schedule."
      />
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
                : "Not yet scheduled"}
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
  const { org } = useProviderOrg();
  const { data: todayJobs, isLoading: jobsLoading, isError: jobsError } = useProviderJobs("today");
  const { eligibleBalance, heldBalance, earnings, isLoading: earningsLoading, isError: earningsError } =
    useProviderEarnings();
  const {
    isLocked,
    totalStops,
    estWorkMinutes,
    estDriveMinutes,
    projectedEarningsCents,
    lockRoute,
    isLocking,
  } = useProviderRoutePlan();
  const navigate = useNavigate();

  const orgStatus = org?.status ?? "ACTIVE";

  // Suspended providers see a full-page notice
  if (orgStatus === "SUSPENDED") {
    return (
      <div className="animate-fade-in p-4 pb-24 flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
          <ShieldOff className="h-8 w-8 text-destructive" />
        </div>
        <h1 className="text-h2">Account Suspended</h1>
        <p className="text-sm text-muted-foreground max-w-xs">
          Your provider account has been suspended. You cannot receive new job assignments while your account is under review.
        </p>
        <Card className="p-4 w-full max-w-sm">
          <h2 className="text-sm font-semibold mb-2">What happens next?</h2>
          <ul className="text-xs text-muted-foreground space-y-2">
            <li>• Your existing scheduled jobs are being reassigned</li>
            <li>• Any pending earnings will be paid on the next payout cycle</li>
            <li>• Contact support to discuss reinstatement</li>
          </ul>
        </Card>
        <Button
          className="mt-2"
          onClick={() => navigate("/provider/support")}
        >
          <Headphones className="h-4 w-4 mr-2" />
          Contact Support
        </Button>
      </div>
    );
  }

  const todayCount = todayJobs?.length ?? 0;

  // This week's earnings
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekEarnings = earnings
    .filter((e) => new Date(e.created_at) >= weekAgo)
    .reduce((sum, e) => sum + e.total_cents, 0);

  const firstName = profile?.full_name?.split(" ")[0] ?? "Provider";
  const isLoading = jobsLoading || earningsLoading;

  const handleLockRoute = () => {
    lockRoute(undefined, {
      onSuccess: () => toast.success("Route locked! Your day is set."),
      onError: (err: any) => toast.error(err?.message ?? "Failed to lock route"),
    });
  };

  return (
    <div className="animate-fade-in p-4 pb-24 space-y-5">
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

      {/* Account status banners */}
      <ProviderStatusBanner status={orgStatus} />
      <ProbationBanner />

      {/* SLA Notification Banners */}
      <ProviderNotificationBanners />
      <MarketHeatBanner />

      {/* Start Route / Route Locked Banner */}
      {todayCount > 0 && (
        <Card className={`p-4 ${isLocked ? "bg-accent/5 border-accent/20" : "bg-primary/5 border-primary/20"}`}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {isLocked ? (
                <Lock className="h-5 w-5 text-accent shrink-0" />
              ) : (
                <Car className="h-5 w-5 text-primary shrink-0" />
              )}
              <div>
                <p className="text-sm font-semibold">
                  {isLocked ? "Route Locked" : "Ready to start?"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {isLocked
                    ? `${totalStops} stops · ${estWorkMinutes + estDriveMinutes} min total`
                    : "Lock your route to begin your day"}
                </p>
              </div>
            </div>
            {!isLocked && (
              <Button
                size="sm"
                onClick={handleLockRoute}
                disabled={isLocking}
              >
                {isLocking ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : (
                  <Lock className="h-4 w-4 mr-1" />
                )}
                Start Route
              </Button>
            )}
          </div>
          {isLocked && projectedEarningsCents > 0 && (
            <div className="mt-3 pt-3 border-t border-border flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-accent" />
              <span className="text-sm font-semibold text-accent">
                Projected today: {formatCents(projectedEarningsCents)}
              </span>
            </div>
          )}
        </Card>
      )}

      {/* Stats Row */}
      <div className="grid gap-3 grid-cols-2">
        <StatCard
          icon={Briefcase}
          label="Today's Jobs"
          value={isLoading ? "—" : todayCount}
        />
        <StatCard
          icon={Clock}
          label="Est. Work"
          value={isLoading ? "—" : estWorkMinutes > 0 ? `${estWorkMinutes} min` : "0 min"}
        />
      </div>

      <div className="grid gap-3 grid-cols-2">
        <StatCard
          icon={Car}
          label="Est. Drive"
          value={isLoading ? "—" : estDriveMinutes > 0 ? `${estDriveMinutes} min` : "0 min"}
        />
        <StatCard
          icon={TrendingUp}
          label="This Week"
          value={isLoading ? "—" : formatCents(weekEarnings)}
        />
      </div>

      {/* Earnings Growth Meter */}
      {!isLoading && (
        <EarningsProjectionCard
          capacityPercent={todayCount > 0 ? Math.min(Math.round((todayCount / 8) * 100), 100) : 0}
          weeklyEarningsCents={weekEarnings}
          weeklyJobs={todayCount * 5}
          estimatedFinishTime={estWorkMinutes > 0 ? `${Math.round((estWorkMinutes + estDriveMinutes) / 60)}h` : undefined}
        />
      )}

      {/* B2-4: Route progress card */}
      <RouteProgressCard />

      {/* BYOC Banner — bring your own customers */}
      <ByocBanner />

      {/* Daily Recap — visible once at least 1 job is completed today */}
      <DailyRecapCard />

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
