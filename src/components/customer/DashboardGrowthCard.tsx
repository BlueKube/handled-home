import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Users, X } from "lucide-react";
import { useDashboardGrowth } from "@/hooks/useDashboardGrowth";

/**
 * Always-on dashboard surface that rotates between BYOP recommend and
 * referral share. Rate-limited via localStorage: shown at most once
 * per 7 days and hidden for 14 days after dismissal. The parent page
 * is responsible for any subscription / onboarding gates so this
 * component doesn't compete with HomeSetupCard or the Bridge CTA.
 */
export function DashboardGrowthCard() {
  const navigate = useNavigate();
  const { variant, isLoading, recordShown, dismiss } = useDashboardGrowth();
  const recordedRef = useRef(false);

  // Mark the card as shown the first time it's actually visible this
  // mount. The ref guard prevents duplicate writes when variant flips
  // identity mid-mount (e.g., a query refetch) — recordShown is
  // idempotent but extra writes burn localStorage churn for nothing.
  useEffect(() => {
    if (!isLoading && variant !== null && !recordedRef.current) {
      recordedRef.current = true;
      recordShown();
    }
  }, [isLoading, variant, recordShown]);

  if (isLoading || variant === null) return null;

  const config =
    variant === "recommend_provider"
      ? {
          icon: Heart,
          headline: "Know a great pro?",
          body: "Recommend someone you trust — earn 30 credits when they're a fit.",
          cta: "Recommend a pro",
          onClick: () => navigate("/customer/recommend-provider?from=dashboard"),
        }
      : {
          icon: Users,
          headline: "Bring your neighbors along",
          body: "Share your code — you both earn credits when they subscribe.",
          cta: "Share your code",
          onClick: () => navigate("/customer/referrals"),
        };

  const Icon = config.icon;

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="py-4 px-4">
        <div className="flex items-start gap-3">
          <Icon className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div className="space-y-1.5 flex-1 min-w-0">
            <p className="text-sm font-medium">{config.headline}</p>
            <p className="text-xs text-muted-foreground">{config.body}</p>
            <Button
              variant="default"
              size="sm"
              className="gap-1 mt-2 min-h-[44px]"
              onClick={config.onClick}
            >
              {config.cta}
            </Button>
          </div>
          <button
            type="button"
            onClick={dismiss}
            className="p-1.5 rounded hover:bg-secondary text-muted-foreground min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
