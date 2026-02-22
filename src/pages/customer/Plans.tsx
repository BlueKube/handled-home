import { useNavigate, useSearchParams } from "react-router-dom";
import { usePlans } from "@/hooks/usePlans";
import { PlanCard } from "@/components/plans/PlanCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

export default function CustomerPlans() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isGated = searchParams.get("gated") === "1";
  const { data: plans, isLoading } = usePlans("active");

  return (
    <div className="p-4 pb-24 space-y-6 animate-fade-in max-w-lg mx-auto">
      <div>
        <h1 className="text-h2">Choose a Plan</h1>
        <p className="text-muted-foreground mt-1">Pick the plan that fits your home.</p>
      </div>

      {isGated && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>You need an active subscription to access that feature. Pick a plan to get started.</AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-48 w-full" />)}
        </div>
      ) : (
        <div className="space-y-4">
          {plans?.map((plan, idx) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              isRecommended={idx === 0}
              onPreview={() => navigate(`/customer/plans/${plan.id}`)}
              onBuildRoutine={() => navigate(`/customer/routine?plan=${plan.id}`)}
            />
          ))}
          {(!plans || plans.length === 0) && (
            <p className="text-center text-muted-foreground py-8">No plans available at the moment.</p>
          )}
        </div>
      )}
    </div>
  );
}
