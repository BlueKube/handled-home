import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, TrendingUp, Clock, Ban, Users } from "lucide-react";

export type BannerVariant = "EARLY" | "OPEN" | "EARLY_2" | "WAITLIST" | "CLOSED";

interface OpportunityBannerProps {
  variant: BannerVariant;
  zoneName?: string;
  slotsRemaining?: number;
  onApply: () => void;
}

const VARIANTS: Record<
  BannerVariant,
  {
    icon: React.ElementType;
    headline: string;
    body: (zoneName: string, slots?: number) => string;
    bullets: string[];
    cta: string;
    accent: string;
  }
> = {
  EARLY: {
    icon: Sparkles,
    headline: "Good news — we're launching in your area.",
    body: (z, slots) =>
      `We're onboarding a small group of Founding Partners in ${z}.${slots ? ` Only ${slots} spots remaining.` : ""} Founding Partners get early priority, BYOC incentives, and the chance to help define local service standards.`,
    bullets: [
      "Dense local routes (less driving)",
      "Automatic billing + payouts",
      "Proof-of-work receipts reduce disputes",
      "BYOC bonuses for customers you bring",
    ],
    cta: "Apply now",
    accent: "border-primary/40 bg-primary/5",
  },
  OPEN: {
    icon: TrendingUp,
    headline: "Good news — demand is growing fast near you.",
    body: (z) =>
      `We're adding quality providers in ${z}. If approved, you'll receive local work routed efficiently with built-in billing and proof-of-work.`,
    bullets: [
      "More paying hours, less dead time",
      "Optimized routes",
      "Simple job flows + required proof",
      "Option to bring your customers (BYOC)",
    ],
    cta: "Apply now",
    accent: "border-success/40 bg-success/5",
  },
  EARLY_2: {
    icon: Users,
    headline: "Good news — you're early in your area.",
    body: (z) =>
      `Apply now to get first access as we fill categories in ${z}. Early approved providers are first in line for Founding Partner status.`,
    bullets: [
      "First-mover advantage",
      "Shape local service standards",
      "Priority when zone opens",
    ],
    cta: "Apply now",
    accent: "border-accent/40 bg-accent/5",
  },
  WAITLIST: {
    icon: Clock,
    headline: "We're not fully open in your area yet.",
    body: (z) =>
      `Apply now and we'll review your application. We'll notify you when ${z} opens for your category.`,
    bullets: [
      "Your application is saved",
      "We'll notify you when ready",
      "Invite customers to move up the list",
    ],
    cta: "Join waitlist",
    accent: "border-warning/40 bg-warning/5",
  },
  CLOSED: {
    icon: Ban,
    headline: "We're currently full in your area.",
    body: () =>
      "Join the provider waitlist. We'll notify you when openings appear.",
    bullets: [],
    cta: "Join waitlist",
    accent: "border-muted bg-muted/30",
  },
};

/**
 * Maps market_zone_category_state status to banner variant.
 * SOFT_LAUNCH → EARLY, OPEN → OPEN, PROTECT_QUALITY → WAITLIST, CLOSED → CLOSED
 */
export function mapStateToBannerVariant(
  status: string,
  hasFoundingSlots: boolean,
  categoriesFilled: boolean
): BannerVariant {
  switch (status) {
    case "SOFT_LAUNCH":
      return hasFoundingSlots ? "EARLY" : "EARLY_2";
    case "OPEN":
      return categoriesFilled ? "OPEN" : "EARLY_2";
    case "PROTECT_QUALITY":
      return "WAITLIST";
    case "CLOSED":
      return "CLOSED";
    default:
      return "WAITLIST";
  }
}

export default function OpportunityBanner({
  variant,
  zoneName = "your area",
  slotsRemaining,
  onApply,
}: OpportunityBannerProps) {
  const config = VARIANTS[variant];
  const Icon = config.icon;

  return (
    <Card className={`${config.accent} transition-all animate-fade-in`}>
      <CardContent className="py-5 space-y-3">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-background shadow-sm">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-base leading-tight">
              {config.headline}
            </h3>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
              {config.body(zoneName, slotsRemaining)}
            </p>
          </div>
        </div>

        {config.bullets.length > 0 && (
          <ul className="space-y-1.5 ml-1">
            {config.bullets.map((b, i) => (
              <li key={i} className="text-sm flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>{b}</span>
              </li>
            ))}
          </ul>
        )}

        <Button className="w-full" onClick={onApply}>
          {config.cta}
        </Button>
      </CardContent>
    </Card>
  );
}
