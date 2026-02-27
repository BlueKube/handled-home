import { Home, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useNeighborhoodDensity } from "@/hooks/useNeighborhoodDensity";

const MILESTONE_LABELS: Record<number, string> = {
  5: "Growing fast!",
  10: "Neighborhood favorite",
  25: "Community staple",
  50: "Block party ready",
  100: "Legendary neighborhood",
};

export function NeighborhoodDensityWidget() {
  const { data, isLoading } = useNeighborhoodDensity();

  if (isLoading || !data || data.count < 2) return null;

  const milestoneLabel = data.milestone > 0 ? MILESTONE_LABELS[data.milestone] : null;

  return (
    <Card className="p-4 flex items-center gap-3 bg-accent/5 border-accent/20">
      <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
        <Home className="h-5 w-5 text-accent" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">
          <span className="text-accent font-bold">{data.count}</span> homes in your area use Handled Home
        </p>
        {milestoneLabel && (
          <div className="flex items-center gap-1 mt-0.5">
            <TrendingUp className="h-3 w-3 text-accent" />
            <p className="text-xs text-muted-foreground">{milestoneLabel}</p>
          </div>
        )}
      </div>
    </Card>
  );
}
