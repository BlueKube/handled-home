import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Users, X } from "lucide-react";
import { usePostVisitGrowth } from "@/hooks/usePostVisitGrowth";

interface Props {
  rating: number | null | undefined;
}

/**
 * Renders one growth CTA after a 4- or 5-star visit rating.
 * Variant chosen by usePostVisitGrowth (BYOP vs referral). Hidden
 * for ratings below 4, while data loads, when no variant applies,
 * or when the user dismisses the card for this session.
 */
export function PostVisitGrowthCard({ rating }: Props) {
  const navigate = useNavigate();
  const { variant, isLoading } = usePostVisitGrowth();
  const [dismissed, setDismissed] = useState(false);

  if (rating == null || rating < 4) return null;
  if (isLoading || variant === null) return null;
  if (dismissed) return null;

  const config =
    variant === "recommend_provider"
      ? {
          icon: Heart,
          headline: "Loved your service?",
          body: "Recommend a pro you trust — earn 30 credits when they're a fit.",
          cta: "Recommend a pro",
          onClick: () => navigate("/customer/recommend-provider?from=post_visit"),
        }
      : {
          icon: Users,
          headline: "Know a neighbor who'd love this?",
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
            onClick={() => setDismissed(true)}
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
