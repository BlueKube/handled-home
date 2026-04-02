import { useEffect } from "react";
import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus, Heart } from "lucide-react";
import { usePropertyHealth, useComputePropertyHealth } from "@/hooks/usePropertyHealth";
import { useAuth } from "@/contexts/AuthContext";

interface PropertyHealthWidgetProps {
  propertyId: string | undefined;
}

function scoreLabel(score: number): string {
  if (score >= 80) return "Excellent";
  if (score >= 60) return "Good";
  if (score >= 40) return "Fair";
  if (score >= 20) return "Needs Attention";
  return "Critical";
}

function scoreColor(score: number): string {
  if (score >= 80) return "text-success";
  if (score >= 60) return "text-accent";
  if (score >= 40) return "text-warning";
  return "text-destructive";
}

function ringColor(score: number): string {
  if (score >= 80) return "stroke-success";
  if (score >= 60) return "stroke-accent";
  if (score >= 40) return "stroke-warning";
  return "stroke-destructive";
}

export function PropertyHealthWidget({ propertyId }: PropertyHealthWidgetProps) {
  const { user } = useAuth();
  const { data: health, isLoading } = usePropertyHealth(propertyId);
  const compute = useComputePropertyHealth();

  // Auto-compute on first load if no score exists or stale (>24h)
  useEffect(() => {
    if (!propertyId || !user?.id) return;
    if (compute.isPending || compute.isError) return;

    const shouldCompute = !health ||
      (new Date().getTime() - new Date(health.computed_at).getTime() > 24 * 60 * 60 * 1000);

    if (shouldCompute) {
      compute.mutate({ propertyId, customerId: user.id });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propertyId, user?.id, health?.computed_at]);

  if (isLoading || (!health && compute.isPending)) {
    return (
      <Card className="p-4">
        <div className="h-16 bg-muted/50 rounded animate-pulse" />
      </Card>
    );
  }

  if (compute.isError) {
    return (
      <Card className="p-4 text-center">
        <p className="text-xs text-destructive">Couldn't compute health score</p>
      </Card>
    );
  }

  if (!health) return null;

  const score = health.overall_score;
  const prev = health.previous_overall_score;
  const delta = prev != null ? score - prev : null;

  // SVG ring params
  const size = 56;
  const strokeWidth = 5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;

  return (
    <Card className="p-4">
      <div className="flex items-center gap-4">
        {/* Score Ring */}
        <div className="relative shrink-0" style={{ width: size, height: size }}>
          <svg width={size} height={size} className="-rotate-90">
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              className="stroke-muted"
              strokeWidth={strokeWidth}
            />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              className={ringColor(score)}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={circumference - progress}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-sm font-bold ${scoreColor(score)}`}>{score}</span>
          </div>
        </div>

        {/* Labels */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <Heart className="h-3.5 w-3.5 text-muted-foreground" />
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Home Health</p>
          </div>
          <p className={`text-sm font-semibold ${scoreColor(score)}`}>{scoreLabel(score)}</p>
          
          {/* Sub-scores */}
          <div className="flex gap-3 mt-1">
            {[
              { label: "Reg", value: health.regularity_score },
              { label: "Cov", value: health.coverage_score },
              { label: "Sea", value: health.seasonal_score },
              { label: "Iss", value: health.issue_score },
            ].map((s) => (
              <span key={s.label} className="text-[10px] text-muted-foreground">
                {s.label} {s.value}
              </span>
            ))}
          </div>
        </div>

        {/* Trend Arrow */}
        {delta != null && (
          <div className="flex flex-col items-center shrink-0">
            {delta > 0 ? (
              <TrendingUp className="h-4 w-4 text-success" />
            ) : delta < 0 ? (
              <TrendingDown className="h-4 w-4 text-destructive" />
            ) : (
              <Minus className="h-4 w-4 text-muted-foreground" />
            )}
            <span className={`text-[10px] font-medium ${delta > 0 ? "text-success" : delta < 0 ? "text-destructive" : "text-muted-foreground"}`}>
              {delta > 0 ? "+" : ""}{delta}
            </span>
          </div>
        )}
      </div>
    </Card>
  );
}
