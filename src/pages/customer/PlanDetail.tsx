import { useParams, useNavigate } from "react-router-dom";
import { usePlanDetail } from "@/hooks/usePlans";
import { useEntitlements } from "@/hooks/useEntitlements";
import { EntitlementBadge } from "@/components/plans/EntitlementBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Check, X, Info } from "lucide-react";

export default function CustomerPlanDetail() {
  const { planId } = useParams<{ planId: string }>();
  const navigate = useNavigate();
  const { data: plan, isLoading: planLoading } = usePlanDetail(planId ?? null);
  const { data: entitlements, isLoading: entLoading } = useEntitlements(planId ?? null, null);

  const isLoading = planLoading || entLoading;

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="p-4 text-center">
        <p className="text-muted-foreground">Plan not found.</p>
        <Button variant="ghost" onClick={() => navigate("/customer/plans")} className="mt-4">
          Back to Plans
        </Button>
      </div>
    );
  }

  const includedSkus = entitlements?.skus.filter((s) => s.status === "included") ?? [];
  const extraSkus = entitlements?.skus.filter((s) => s.status === "extra_allowed" || s.status === "available") ?? [];
  const blockedSkus = entitlements?.skus.filter((s) => s.status === "blocked") ?? [];

  return (
    <div className="p-4 pb-24 space-y-6 animate-fade-in max-w-lg mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div>
        <h1 className="text-h2">{plan.name}</h1>
        {plan.tagline && <p className="text-muted-foreground mt-1">{plan.tagline}</p>}
        {plan.display_price_text && <p className="text-2xl font-bold mt-2">{plan.display_price_text}</p>}
      </div>

      {entitlements && (
        <p className="text-sm text-muted-foreground">{entitlements.messages.included_explainer}</p>
      )}

      {includedSkus.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">What's Included</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {includedSkus.map((sku) => (
              <div key={sku.sku_id} className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-accent shrink-0" />
                <span>{sku.sku_name}</span>
                <EntitlementBadge status={sku.status} />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {extraSkus.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Available as Extras</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {extraSkus.map((sku) => (
              <div key={sku.sku_id} className="flex items-center gap-2 text-sm">
                <Info className="h-4 w-4 text-muted-foreground shrink-0" />
                <span>{sku.sku_name}</span>
                <EntitlementBadge status={sku.status} />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {blockedSkus.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Not Available</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {blockedSkus.map((sku) => (
              <div key={sku.sku_id} className="flex items-center gap-2 text-sm text-muted-foreground">
                <X className="h-4 w-4 text-destructive shrink-0" />
                <span>{sku.sku_name}</span>
                {sku.reason && <span className="text-xs">— {sku.reason}</span>}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">How Changes Work</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{entitlements?.messages.change_policy}</p>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button variant="outline" className="flex-1" onClick={() => navigate(`/customer/routine?plan=${plan.id}`)}>
          Build Routine
        </Button>
        <Button className="flex-1" onClick={() => navigate(`/customer/subscribe?plan=${plan.id}`)}>
          Subscribe
        </Button>
      </div>
    </div>
  );
}
