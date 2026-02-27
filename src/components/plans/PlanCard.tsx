import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, Sparkles, Check } from "lucide-react";
import type { Plan } from "@/hooks/usePlans";

interface PlanCardProps {
  plan: Plan;
  isRecommended?: boolean;
  zoneEnabled?: boolean;
  handlesPerCycle?: number;
  tierHighlights?: string[];
  onPreview?: () => void;
  onBuildRoutine?: () => void;
}

const TIER_ACCENT: Record<string, string> = {
  essential: "bg-muted text-foreground",
  plus: "bg-accent/10 text-accent border border-accent/30",
  premium: "bg-primary/10 text-primary border border-primary/30",
};

function getTierKey(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes("premium")) return "premium";
  if (lower.includes("plus")) return "plus";
  return "essential";
}

export function PlanCard({
  plan,
  isRecommended,
  zoneEnabled = true,
  handlesPerCycle,
  tierHighlights,
  onPreview,
  onBuildRoutine,
}: PlanCardProps) {
  const tierKey = getTierKey(plan.name);

  return (
    <Card
      className={`relative press-feedback overflow-hidden transition-shadow ${
        isRecommended
          ? "ring-2 ring-accent shadow-lg"
          : "hover:shadow-md"
      }`}
    >
      {/* Recommended ribbon */}
      {isRecommended && (
        <div className="absolute -top-3 left-4 z-10">
          <Badge className="bg-accent text-accent-foreground gap-1 shadow-sm">
            <Star className="h-3 w-3" /> Most Popular
          </Badge>
        </div>
      )}

      <CardHeader className="pb-1 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <Badge variant="outline" className={`text-xs font-semibold ${TIER_ACCENT[tierKey]}`}>
              {plan.name}
            </Badge>
          </div>
        </div>
        {plan.tagline && (
          <p className="text-sm text-muted-foreground mt-1.5">{plan.tagline}</p>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Price + handles callout */}
        <div className="flex items-baseline gap-3">
          {plan.display_price_text && (
            <span className="text-3xl font-bold tracking-tight">{plan.display_price_text}</span>
          )}
          <span className="text-xs text-muted-foreground">/ 4 weeks</span>
        </div>

        {/* Handles allowance — the key messaging */}
        {handlesPerCycle != null && (
          <div className="flex items-center gap-2 rounded-lg bg-accent/5 border border-accent/20 px-3 py-2.5">
            <Sparkles className="h-4 w-4 text-accent shrink-0" />
            <div className="text-sm">
              <span className="font-semibold text-foreground">{handlesPerCycle} handles</span>
              <span className="text-muted-foreground"> per cycle</span>
            </div>
          </div>
        )}

        {/* Tier highlights */}
        {tierHighlights && tierHighlights.length > 0 && (
          <ul className="space-y-1.5">
            {tierHighlights.map((h, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <Check className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                <span>{h}</span>
              </li>
            ))}
          </ul>
        )}

        {!zoneEnabled && (
          <Badge variant="secondary" className="text-xs">
            Not available in your area
          </Badge>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          {onPreview && (
            <Button variant="outline" size="sm" onClick={onPreview} className="flex-1">
              View Details
            </Button>
          )}
          {onBuildRoutine && zoneEnabled && (
            <Button
              size="sm"
              onClick={onBuildRoutine}
              className={`flex-1 ${isRecommended ? "bg-accent text-accent-foreground hover:bg-accent/90" : ""}`}
            >
              Get Started
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
