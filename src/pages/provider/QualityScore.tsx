import { useProviderQualityScore } from "@/hooks/useProviderQualityScore";
import { useProviderOrg } from "@/hooks/useProviderOrg";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ShieldCheck, TrendingUp, TrendingDown, Minus, Star, Camera, Clock, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const BAND_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  GREEN: { color: "text-success", bg: "bg-success/10", label: "Excellent" },
  YELLOW: { color: "text-amber-500", bg: "bg-amber-500/10", label: "Good" },
  ORANGE: { color: "text-orange-500", bg: "bg-orange-500/10", label: "Needs Improvement" },
  RED: { color: "text-destructive", bg: "bg-destructive/10", label: "At Risk" },
};

export default function ProviderQualityScore() {
  const { org } = useProviderOrg();
  const { score, rollups, scoreEvents, isLoading } = useProviderQualityScore(org?.id);

  if (isLoading) {
    return (
      <div className="p-6 max-w-2xl space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  const band = score ? BAND_CONFIG[score.band] || BAND_CONFIG.GREEN : null;
  const components = (score?.components ?? {}) as Record<string, number>;

  // Latest rollup
  const latestRollup = rollups.find((r) => r.visibility_status === "PUBLISHED");

  // Score trend from events
  const latestEvent = scoreEvents[0];
  const scoreDelta = latestEvent
    ? Number(latestEvent.new_score) - Number(latestEvent.old_score ?? latestEvent.new_score)
    : 0;

  return (
    <div className="p-6 max-w-2xl space-y-4">
      <h1 className="text-h2">Quality Score</h1>
      <p className="text-sm text-muted-foreground">
        Rolling 28-day composite score based on customer feedback, issue rate, photo compliance, and on-time performance.
      </p>

      {/* Score card */}
      {score ? (
        <Card className={cn("p-6 space-y-4", band?.bg)}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn("text-4xl font-bold tabular-nums", band?.color)}>
                {Number(score.score).toFixed(0)}
              </div>
              <div>
                <Badge variant="outline" className={cn("text-xs", band?.color)}>
                  {band?.label}
                </Badge>
                <p className="text-xs text-muted-foreground mt-1">Last 28 days</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {scoreDelta > 0 && <TrendingUp className="h-4 w-4 text-success" />}
              {scoreDelta < 0 && <TrendingDown className="h-4 w-4 text-destructive" />}
              {scoreDelta === 0 && <Minus className="h-4 w-4 text-muted-foreground" />}
              {scoreDelta !== 0 && (
                <span className={cn("text-sm font-medium", scoreDelta > 0 ? "text-success" : "text-destructive")}>
                  {scoreDelta > 0 ? "+" : ""}{scoreDelta.toFixed(0)}
                </span>
              )}
            </div>
          </div>

          {/* Component breakdown */}
          <div className="grid grid-cols-2 gap-3">
            <ComponentMetric
              icon={<Star className="h-4 w-4" />}
              label="Customer Rating"
              value={components.rating_score}
              weight="35%"
            />
            <ComponentMetric
              icon={<AlertTriangle className="h-4 w-4" />}
              label="Issue/Redo Rate"
              value={components.issue_score}
              weight="25%"
            />
            <ComponentMetric
              icon={<Camera className="h-4 w-4" />}
              label="Photo Compliance"
              value={components.photo_score}
              weight="20%"
            />
            <ComponentMetric
              icon={<Clock className="h-4 w-4" />}
              label="On-Time Performance"
              value={components.ontime_score}
              weight="20%"
            />
          </div>

          {score.computed_at && (
            <p className="text-xs text-muted-foreground">
              Updated {format(new Date(score.computed_at), "MMM d, h:mm a")}
            </p>
          )}
        </Card>
      ) : (
        <Card className="p-6 text-center space-y-2">
          <ShieldCheck className="h-8 w-8 text-muted-foreground mx-auto" />
          <p className="text-sm text-muted-foreground">
            More feedback needed to generate your Quality Score.
          </p>
          <p className="text-xs text-muted-foreground">
            Scores are computed weekly from aggregated customer feedback.
          </p>
        </Card>
      )}

      {/* Weekly coaching rollup */}
      {latestRollup && (
        <Card className="p-4 space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Weekly Insights — {format(new Date(latestRollup.period_start), "MMM d")} to{" "}
            {format(new Date(latestRollup.period_end), "MMM d")}
          </h3>

          {latestRollup.avg_rating && (
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              <span className="text-sm font-medium">
                {Number(latestRollup.avg_rating).toFixed(1)} avg
              </span>
              <span className="text-xs text-muted-foreground">
                ({latestRollup.review_count} reviews)
              </span>
            </div>
          )}

          {latestRollup.summary_positive && (
            <div className="bg-success/5 rounded-lg p-3">
              <p className="text-xs font-medium text-success mb-1">What's working</p>
              <p className="text-sm">{latestRollup.summary_positive}</p>
            </div>
          )}

          {latestRollup.summary_improve && (
            <div className="bg-warning/5 rounded-lg p-3">
              <p className="text-xs font-medium text-warning mb-1">Improve next week</p>
              <p className="text-sm">{latestRollup.summary_improve}</p>
            </div>
          )}

          {/* Theme counts */}
          {Object.keys(latestRollup.theme_counts).length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(latestRollup.theme_counts)
                .sort(([, a], [, b]) => (b as number) - (a as number))
                .slice(0, 6)
                .map(([theme, count]) => (
                  <span
                    key={theme}
                    className="text-xs bg-secondary px-2 py-0.5 rounded-full"
                  >
                    {theme} ({count as number})
                  </span>
                ))}
            </div>
          )}
        </Card>
      )}

      {!latestRollup && rollups.length > 0 && (
        <Card className="p-4 text-center">
          <p className="text-sm text-muted-foreground">
            Not enough reviews yet to publish insights. Minimum 5 reviews needed.
          </p>
        </Card>
      )}

      {rollups.length === 0 && (
        <Card className="p-4 text-center">
          <p className="text-sm text-muted-foreground">
            Weekly coaching insights will appear here once customers submit feedback.
          </p>
        </Card>
      )}
    </div>
  );
}

function ComponentMetric({
  icon,
  label,
  value,
  weight,
}: {
  icon: React.ReactNode;
  label: string;
  value?: number;
  weight: string;
}) {
  return (
    <div className="flex items-center gap-2 p-2 rounded-lg bg-background/50">
      <div className="text-muted-foreground">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate">{label}</p>
        <p className="text-xs text-muted-foreground">{weight} weight</p>
      </div>
      <span className="text-sm font-semibold tabular-nums">
        {value != null ? Number(value).toFixed(0) : "—"}
      </span>
    </div>
  );
}
