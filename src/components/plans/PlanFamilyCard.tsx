import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { Star, Layers, Check } from "lucide-react";
import { TIER_ACCENT, type PlanFamilyKey } from "./planTierStyles";

type Family = Exclude<PlanFamilyKey, "legacy">;

interface PlanFamilyCardProps {
  family: Family;
  familyName: string;
  tagline?: string;
  startsAtPriceText: string;
  variantCount: number;
  highlights?: string[];
  isRecommended?: boolean;
  zoneEnabled?: boolean;
  onSelect?: () => void;
  onPreview?: () => void;
}

export function PlanFamilyCard({
  family,
  familyName,
  tagline,
  startsAtPriceText,
  variantCount,
  highlights,
  isRecommended,
  zoneEnabled = true,
  onSelect,
  onPreview,
}: PlanFamilyCardProps) {
  return (
    <Card
      className={`relative press-feedback overflow-hidden transition-shadow ${
        isRecommended ? "ring-2 ring-accent shadow-lg" : "hover:shadow-md"
      }`}
    >
      {isRecommended && (
        <div className="absolute -top-3 left-4 z-10">
          <Badge className="bg-accent text-accent-foreground gap-1 shadow-sm">
            <Star className="h-3 w-3" /> Most Popular
          </Badge>
        </div>
      )}

      <CardHeader className="pb-1 pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={`text-xs font-semibold ${TIER_ACCENT[family]}`}>
              {familyName}
            </Badge>
            {isRecommended && <StatusBadge status="recommended" />}
          </div>
        </div>
        {tagline && (
          <p className="text-sm text-muted-foreground mt-1.5">{tagline}</p>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-baseline gap-2">
          <span className="text-xs text-muted-foreground">Starts at</span>
          <span className="text-3xl font-bold tracking-tight">{startsAtPriceText}</span>
          <span className="text-xs text-muted-foreground">/ 4 weeks</span>
        </div>

        <div className="flex items-center gap-2 rounded-lg bg-muted/40 border border-border px-3 py-2.5">
          <Layers className="h-4 w-4 text-muted-foreground shrink-0" />
          <div className="text-sm">
            <span className="font-semibold text-foreground">{variantCount} sizes</span>
            <span className="text-muted-foreground"> — we'll match one to your home</span>
          </div>
        </div>

        {highlights && highlights.length > 0 && (
          <ul className="space-y-1.5">
            {highlights.map((h, i) => (
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

        <div className="flex gap-2 pt-1">
          {onPreview && (
            <Button variant="outline" size="sm" onClick={onPreview} className="flex-1">
              View Details
            </Button>
          )}
          {onSelect && zoneEnabled && (
            <Button
              size="sm"
              onClick={onSelect}
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
