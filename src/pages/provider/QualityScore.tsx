import { useNavigate } from "react-router-dom";
import { useProviderQualityScore } from "@/hooks/useProviderQualityScore";
import { useProviderTier, TIER_CONFIG } from "@/hooks/useProviderTier";
import { useProviderOrg } from "@/hooks/useProviderOrg";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  ShieldCheck, TrendingUp, TrendingDown, Minus, Star, Camera, Clock,
  AlertTriangle, Award, GraduationCap, CheckCircle2, Lock, ChevronLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const BAND_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  GREEN: { color: "text-success", bg: "bg-success/10", label: "Excellent" },
  YELLOW: { color: "text-amber-500", bg: "bg-amber-500/10", label: "Good" },
  ORANGE: { color: "text-orange-500", bg: "bg-orange-500/10", label: "Needs Improvement" },
  RED: { color: "text-destructive", bg: "bg-destructive/10", label: "At Risk" },
};

export default function ProviderQualityScore() {
  const navigate = useNavigate();
  const { org } = useProviderOrg();
  const { score, rollups, scoreEvents, isLoading } = useProviderQualityScore(org?.id);
  const { currentTier, tierConfig, tierEntry, tierHistory, pendingGates, completedGates, isLoading: tierLoading } = useProviderTier(org?.id);

  if (isLoading || tierLoading) {
    return (
      <div className="animate-fade-in p-4 pb-24 max-w-2xl space-y-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-11 w-11 rounded-xl" />
          <Skeleton className="h-7 w-40" />
        </div>
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-32 w-full rounded-2xl" />
      </div>
    );
  }

  const band = score ? BAND_CONFIG[score.band] || BAND_CONFIG.GREEN : null;
  const components = (score?.components ?? {}) as Record<string, number>;
  const latestRollup = rollups.find((r) => r.visibility_status === "PUBLISHED");
  const latestEvent = scoreEvents[0];
  const scoreDelta = latestEvent
    ? Number(latestEvent.new_score) - Number(latestEvent.old_score ?? latestEvent.new_score)
    : 0;

  return (
    <div className="animate-fade-in p-4 pb-24 max-w-2xl space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/provider/performance")} aria-label="Back to score">
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-h2">Quality & Tier</h1>
          <p className="text-caption">Rolling 28-day score</p>
        </div>
      </div>

      {/* Tier badge card */}
      <Card className={cn("p-4 flex items-center gap-4", tierConfig.bg)}>
        <Award className={cn("h-10 w-10", tierConfig.color)} />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className={cn("text-lg font-bold", tierConfig.color)}>{tierConfig.label} Tier</span>
            <Badge variant="outline" className="text-xs">{tierConfig.holdDays}-day hold</Badge>
            {tierConfig.priorityMod > 0 && (
              <Badge variant="secondary" className="text-xs">+{tierConfig.priorityMod} priority</Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {currentTier === "gold"
              ? "Fastest payouts, top assignment priority, and priority access to new zones."
              : currentTier === "silver"
              ? "Reduced hold period and higher assignment priority. Keep improving to reach Gold!"
              : "Standard hold period and assignment priority. Improve your quality score to unlock better tiers."}
          </p>
          {tierEntry && (
            <p className="text-xs text-muted-foreground mt-1">
              Since {format(new Date(tierEntry.effective_at), "MMM d, yyyy")}
            </p>
          )}
        </div>
      </Card>

      {/* Tier thresholds */}
      <Card className="p-4 space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tier Thresholds</h3>
        <div className="space-y-2">
          {[
            { tier: "gold", label: "Gold", min: 80, desc: "Score ≥ 80 (GREEN band)" },
            { tier: "silver", label: "Silver", min: 60, desc: "Score 60–79 (YELLOW band)" },
            { tier: "standard", label: "Standard", min: 0, desc: "Score < 60" },
          ].map((t) => {
            const cfg = TIER_CONFIG[t.tier];
            const isActive = currentTier === t.tier;
            return (
              <div key={t.tier} className={cn("flex items-center gap-3 p-2 rounded-lg", isActive && cfg.bg)}>
                <Award className={cn("h-5 w-5", cfg.color)} />
                <div className="flex-1">
                  <span className={cn("text-sm font-medium", isActive && cfg.color)}>{t.label}</span>
                  <p className="text-xs text-muted-foreground">{t.desc}</p>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  <div>{cfg.holdDays}d hold</div>
                  <div>+{cfg.priorityMod} priority</div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Quality Score card */}
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

          <div className="grid grid-cols-2 gap-3">
            <ComponentMetric icon={<Star className="h-4 w-4" />} label="Customer Rating" value={components.rating_score} weight="35%" />
            <ComponentMetric icon={<AlertTriangle className="h-4 w-4" />} label="Issue/Redo Rate" value={components.issue_score} weight="25%" />
            <ComponentMetric icon={<Camera className="h-4 w-4" />} label="Photo Compliance" value={components.photo_score} weight="20%" />
            <ComponentMetric icon={<Clock className="h-4 w-4" />} label="On-Time Performance" value={components.ontime_score} weight="20%" />
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
          <p className="text-sm text-muted-foreground">More feedback needed to generate your Quality Score.</p>
          <p className="text-xs text-muted-foreground">Scores are computed weekly from aggregated customer feedback.</p>
        </Card>
      )}

      {/* Training Gates */}
      {(pendingGates.length > 0 || completedGates.length > 0) && (
        <Card className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary" />
            <h3 className="text-sm font-semibold">Training Gates</h3>
          </div>
          <p className="text-xs text-muted-foreground">
            Some service SKUs require training completion before you can be assigned jobs.
          </p>

          {pendingGates.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-amber-600">Pending ({pendingGates.length})</p>
              {pendingGates.map((g) => (
                <div key={g.id} className="flex items-center gap-3 p-2 rounded-lg bg-amber-500/5 border border-amber-500/20">
                  <Lock className="h-4 w-4 text-amber-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{g.sku_name || "Unknown SKU"}</p>
                    <p className="text-xs text-muted-foreground">
                      Min. score: {g.required_score_minimum} · {g.sku_category || "—"}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs text-amber-600">Locked</Badge>
                </div>
              ))}
            </div>
          )}

          {completedGates.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-success">Completed ({completedGates.length})</p>
              {completedGates.map((g) => (
                <div key={g.id} className="flex items-center gap-3 p-2 rounded-lg bg-success/5">
                  <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{g.sku_name || "Unknown SKU"}</p>
                    {g.completed_at && (
                      <p className="text-xs text-muted-foreground">
                        Completed {format(new Date(g.completed_at), "MMM d, yyyy")}
                      </p>
                    )}
                  </div>
                  <Badge variant="outline" className="text-xs text-success">Unlocked</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Tier History */}
      {tierHistory.length > 0 && (
        <Card className="p-4 space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tier History</h3>
          <div className="space-y-2">
            {tierHistory.map((entry) => {
              const cfg = TIER_CONFIG[entry.tier] ?? TIER_CONFIG.standard;
              return (
                <div key={entry.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30">
                  <Award className={cn("h-4 w-4 shrink-0", cfg.color)} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      {entry.previous_tier && (
                        <>
                          <span className="text-xs text-muted-foreground capitalize">{entry.previous_tier}</span>
                          <span className="text-xs text-muted-foreground">→</span>
                        </>
                      )}
                      <span className={cn("text-xs font-medium capitalize", cfg.color)}>{entry.tier}</span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{entry.reason}</p>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {format(new Date(entry.effective_at), "MMM d")}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Weekly Coaching Rollup */}
      {latestRollup && (
        <Card className="p-4 space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Weekly Insights — {format(new Date(latestRollup.period_start), "MMM d")} to{" "}
            {format(new Date(latestRollup.period_end), "MMM d")}
          </h3>

          {latestRollup.avg_rating && (
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              <span className="text-sm font-medium">{Number(latestRollup.avg_rating).toFixed(1)} avg</span>
              <span className="text-xs text-muted-foreground">({latestRollup.review_count} reviews)</span>
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

          {Object.keys(latestRollup.theme_counts).length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(latestRollup.theme_counts)
                .sort(([, a], [, b]) => (b as number) - (a as number))
                .slice(0, 6)
                .map(([theme, count]) => (
                  <span key={theme} className="text-xs bg-secondary px-2 py-0.5 rounded-full">
                    {theme} ({count as number})
                  </span>
                ))}
            </div>
          )}
        </Card>
      )}

      {!latestRollup && rollups.length > 0 && (
        <Card className="p-4 text-center">
          <p className="text-sm text-muted-foreground">Not enough reviews yet to publish insights. Minimum 5 reviews needed.</p>
        </Card>
      )}

      {rollups.length === 0 && (
        <Card className="p-4 text-center">
          <p className="text-sm text-muted-foreground">Weekly coaching insights will appear here once customers submit feedback.</p>
        </Card>
      )}
    </div>
  );
}

function ComponentMetric({ icon, label, value, weight }: { icon: React.ReactNode; label: string; value?: number; weight: string }) {
  return (
    <div className="flex items-center gap-2 p-2 rounded-lg bg-background/50">
      <div className="text-muted-foreground">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate">{label}</p>
        <p className="text-xs text-muted-foreground">{weight} weight</p>
      </div>
      <span className="text-sm font-semibold tabular-nums">{value != null ? Number(value).toFixed(0) : "—"}</span>
    </div>
  );
}
