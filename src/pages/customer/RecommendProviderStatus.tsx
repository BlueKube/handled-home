import { useNavigate } from "react-router-dom";
import { ChevronLeft, Gift, UserPlus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CustomerEmptyState } from "@/components/customer/CustomerEmptyState";
import { useByopRecommendations, ByopStatus } from "@/hooks/useByopRecommendation";
import { getCategoryLabel } from "@/lib/serviceCategories";
import { formatCents } from "@/utils/format";

const STATUS_CONFIG: Record<ByopStatus, { label: string; variant: "default" | "secondary" | "outline" | "destructive"; className?: string }> = {
  received: { label: "Received", variant: "secondary" },
  under_review: { label: "Under Review", variant: "outline", className: "border-warning text-warning" },
  accepted: { label: "Accepted", variant: "default", className: "bg-success text-success-foreground" },
  not_a_fit: { label: "Not a Fit", variant: "secondary", className: "text-muted-foreground" },
};

export default function RecommendProviderStatus() {
  const navigate = useNavigate();
  const { recommendations, totalCredits } = useByopRecommendations();

  if (recommendations.isLoading) {
    return (
      <div className="p-4 pb-24 space-y-4 animate-fade-in">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-24" />
      </div>
    );
  }

  const list = recommendations.data ?? [];

  return (
    <div className="p-4 pb-24 space-y-5 animate-fade-in">
      {/* Header */}
      <div>
        <button
          onClick={() => navigate("/customer/more")}
          className="flex items-center gap-1 text-muted-foreground mb-2 min-h-[44px]"
          aria-label="Back to More menu"
        >
          <ChevronLeft className="h-5 w-5" />
          <span className="text-sm">More</span>
        </button>
        <h1 className="text-h2">Provider Recommendations</h1>
        <p className="text-caption text-muted-foreground mt-1">
          Track the status of providers you've recommended.
        </p>
      </div>

      {list.length === 0 ? (
        <CustomerEmptyState
          icon={UserPlus}
          title="No recommendations yet"
          body="Your provider recommendations will appear here. Recommend a provider you trust to get started."
          ctaLabel="Recommend a Provider"
          ctaAction={() => navigate("/customer/recommend-provider")}
        />
      ) : (
        <>
          {/* Active Recommendations */}
          <div className="space-y-3">
            {list.map((rec) => {
              const config = STATUS_CONFIG[rec.status];
              return (
                <Card
                  key={rec.id}
                  className={
                    rec.status === "accepted"
                      ? "border-accent"
                      : rec.status === "not_a_fit"
                        ? "border-muted"
                        : ""
                  }
                >
                  <CardContent className="pt-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold">{rec.provider_name}</p>
                      <Badge variant={config.variant} className={config.className}>
                        {config.label}
                      </Badge>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {getCategoryLabel(rec.category)}
                    </Badge>

                    {rec.status === "accepted" && (
                      <div className="pt-2 space-y-2">
                        <p className="text-sm text-success">
                          Great news — {rec.provider_name} has joined the Handled Home network.
                        </p>
                        <Button
                          variant="accent"
                          className="min-h-[44px]"
                          onClick={() => navigate("/customer/routine")}
                        >
                          Add to My Routine
                        </Button>
                      </div>
                    )}

                    {rec.status === "not_a_fit" && (
                      <div className="pt-2">
                        <p className="text-sm text-muted-foreground">
                          This provider wasn't a match for our coverage area right now.
                        </p>
                        <p className="text-caption text-muted-foreground mt-1">
                          We appreciate the recommendation.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* BYOP Credits Card */}
          <Card>
            <CardContent className="pt-4 flex gap-3">
              <Gift className="h-5 w-5 text-accent shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold">
                  BYOP Credits Earned: {formatCents(totalCredits)}
                </p>
                <p className="text-caption text-muted-foreground mt-0.5">
                  You earn $30 for each accepted provider recommendation.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Recommend Another */}
          <Button
            variant="outline"
            className="w-full h-12"
            onClick={() => navigate("/customer/recommend-provider")}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Recommend Another Provider
          </Button>
        </>
      )}
    </div>
  );
}
