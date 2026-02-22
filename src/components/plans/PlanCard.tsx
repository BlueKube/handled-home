import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";
import type { Plan } from "@/hooks/usePlans";

interface PlanCardProps {
  plan: Plan;
  isRecommended?: boolean;
  zoneEnabled?: boolean;
  onPreview?: () => void;
  onBuildRoutine?: () => void;
}

export function PlanCard({ plan, isRecommended, zoneEnabled = true, onPreview, onBuildRoutine }: PlanCardProps) {
  return (
    <Card className={`relative press-feedback ${isRecommended ? "ring-2 ring-accent" : ""}`}>
      {isRecommended && (
        <div className="absolute -top-3 left-4">
          <Badge className="bg-accent text-accent-foreground gap-1">
            <Star className="h-3 w-3" /> Recommended
          </Badge>
        </div>
      )}
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{plan.name}</CardTitle>
        {plan.tagline && <p className="text-sm text-muted-foreground">{plan.tagline}</p>}
      </CardHeader>
      <CardContent className="space-y-3">
        {plan.display_price_text && (
          <p className="text-2xl font-bold">{plan.display_price_text}</p>
        )}
        {!zoneEnabled && (
          <Badge variant="secondary" className="text-xs">Not available in your area</Badge>
        )}
        <div className="flex gap-2">
          {onPreview && (
            <Button variant="outline" size="sm" onClick={onPreview} className="flex-1">
              Preview
            </Button>
          )}
          {onBuildRoutine && zoneEnabled && (
            <Button size="sm" onClick={onBuildRoutine} className="flex-1">
              Build Routine
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
