import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { Star, Sparkles, Check, Info } from "lucide-react";
import { TIER_ACCENT, type PlanFamilyKey } from "./planTierStyles";
import type { Plan } from "@/hooks/usePlans";

type Family = Exclude<PlanFamilyKey, "legacy">;

interface PlanVariantCardProps {
  variant: Plan;
  family: Family;
  handlesPerCycle?: number;
  rationale?: string;
  highlights?: string[];
  isRecommended?: boolean;
  onConfirm?: () => void;
  onChangeSize?: () => void;
  confirmLabel?: string;
}

const FAMILY_LABEL: Record<Family, string> = {
  basic: "Basic plan",
  full: "Full plan",
  premier: "Premier plan",
};

export function PlanVariantCard({
  variant,
  family,
  handlesPerCycle,
  rationale,
  highlights,
  isRecommended,
  onConfirm,
  onChangeSize,
  confirmLabel = "Continue",
}: PlanVariantCardProps) {
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
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{FAMILY_LABEL[family]}</p>
        <div className="flex items-center justify-between mt-1">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={`text-xs font-semibold ${TIER_ACCENT[family]}`}>
              {variant.name}
            </Badge>
            {isRecommended && <StatusBadge status="recommended" />}
          </div>
        </div>
        {variant.tagline && (
          <p className="text-sm text-muted-foreground mt-1.5">{variant.tagline}</p>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {variant.display_price_text && (
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold tracking-tight">{variant.display_price_text}</span>
            <span className="text-xs text-muted-foreground">/ 4 weeks</span>
          </div>
        )}

        {handlesPerCycle != null && (
          <div className="flex items-center gap-2 rounded-lg bg-accent/5 border border-accent/20 px-3 py-2.5">
            <Sparkles className="h-4 w-4 text-accent shrink-0" />
            <div className="text-sm">
              <span className="font-semibold text-foreground">{handlesPerCycle} credits</span>
              <span className="text-muted-foreground"> per cycle</span>
            </div>
          </div>
        )}

        {rationale && (
          <div className="flex items-start gap-2 rounded-lg bg-muted/40 border border-border px-3 py-2.5">
            <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground">{rationale}</p>
          </div>
        )}

        {highlights && highlights.length > 0 && (
          <ul className="space-y-1.5">
            {highlights.map((h) => (
              <li key={h} className="flex items-start gap-2 text-sm text-muted-foreground">
                <Check className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                <span>{h}</span>
              </li>
            ))}
          </ul>
        )}

        {(onConfirm || onChangeSize) && (
          <div className="flex flex-col gap-2 pt-1">
            {onConfirm && (
              <Button
                size="sm"
                onClick={onConfirm}
                className={isRecommended ? "bg-accent text-accent-foreground hover:bg-accent/90" : ""}
              >
                {confirmLabel}
              </Button>
            )}
            {onChangeSize && (
              <Button variant="ghost" size="sm" onClick={onChangeSize}>
                See other sizes
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
