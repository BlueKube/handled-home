import { useParams, useNavigate } from "react-router-dom";
import { usePlanDetail } from "@/hooks/usePlans";
import { useEntitlements } from "@/hooks/useEntitlements";
import { EntitlementBadge } from "@/components/plans/EntitlementBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Check, X, Info, Sparkles, Calendar, Shield } from "lucide-react";

/** D-Pre prototype: static handles metadata until D0 schema */
function getHandlesForPlan(name: string): number {
  const lower = name.toLowerCase();
  if (lower.includes("premium")) return 24;
  if (lower.includes("plus")) return 16;
  return 10;
}

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

  const handlesPerCycle = getHandlesForPlan(plan.name);
  const includedSkus = entitlements?.skus.filter((s) => s.status === "included") ?? [];
  const extraSkus = entitlements?.skus.filter((s) => s.status === "extra_allowed" || s.status === "available") ?? [];
  const blockedSkus = entitlements?.skus.filter((s) => s.status === "blocked") ?? [];

  return (
    <div className="p-4 pb-24 space-y-6 animate-fade-in max-w-lg mx-auto">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      {/* Hero */}
      <div>
        <h1 className="text-h2">{plan.name}</h1>
        {plan.tagline && <p className="text-muted-foreground mt-1">{plan.tagline}</p>}
        <div className="flex items-baseline gap-3 mt-3">
          {plan.display_price_text && (
            <span className="text-3xl font-bold tracking-tight">{plan.display_price_text}</span>
          )}
          <span className="text-xs text-muted-foreground">/ 4 weeks</span>
        </div>
      </div>

      {/* Handles callout */}
      <Card className="border-accent/30 bg-accent/5">
        <CardContent className="pt-4 pb-4 space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-accent" />
            <span className="text-lg font-bold">{handlesPerCycle} handles</span>
            <span className="text-sm text-muted-foreground">per cycle</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Each service costs a set number of handles. Most homes use 10–13 per month.
            Unused handles roll over (up to {Math.floor(handlesPerCycle * 1.5)}).
          </p>
        </CardContent>
      </Card>

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

      {/* Plan change policy */}
      <Card className="border-dashed">
        <CardContent className="pt-4 pb-4 space-y-3">
          <p className="text-sm font-medium text-foreground">How changes work</p>
          <div className="space-y-2">
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4 shrink-0 mt-0.5" />
              <span>Plan changes take effect at the start of your next billing cycle.</span>
            </div>
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <Shield className="h-4 w-4 shrink-0 mt-0.5" />
              <span>Your remaining handles carry over — nothing is lost.</span>
            </div>
          </div>
          {entitlements?.messages.change_policy && (
            <p className="text-xs text-muted-foreground border-t border-border pt-2 mt-2">
              {entitlements.messages.change_policy}
            </p>
          )}
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
