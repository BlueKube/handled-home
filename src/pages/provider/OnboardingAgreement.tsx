import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useProviderAgreement, AGREEMENT_CLAUSES } from "@/hooks/useProviderAgreement";
import { useProviderApplication } from "@/hooks/useProviderApplication";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { QueryErrorCard } from "@/components/QueryErrorCard";
import { CheckCircle, Shield, Loader2, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import OnboardingProgressHeader from "@/components/provider/OnboardingProgressHeader";

export default function OnboardingAgreement() {
  const navigate = useNavigate();
  const location = useLocation();
  const orgId = location.state?.orgId;
  const allowedZoneIds = location.state?.allowedZoneIds;

  const { application } = useProviderApplication();
  const applicationId = application.data?.id;

  const {
    acceptedKeys,
    acceptedCount,
    totalClauses,
    allAccepted,
    loading,
    acceptClause,
  } = useProviderAgreement(applicationId);

  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const progressPercent = Math.round((acceptedCount / totalClauses) * 100);

  // Find first unaccepted clause for auto-scroll
  const firstUnacceptedIndex = AGREEMENT_CLAUSES.findIndex(
    (c) => !acceptedKeys.has(c.key)
  );

  const handleAccept = async (clauseKey: string, index: number) => {
    try {
      await acceptClause.mutateAsync(clauseKey);
      // Auto-advance to next unaccepted
      const nextUnaccepted = AGREEMENT_CLAUSES.findIndex(
        (c, i) => i > index && !acceptedKeys.has(c.key) && c.key !== clauseKey
      );
      if (nextUnaccepted >= 0) {
        setActiveIndex(nextUnaccepted);
      } else {
        setActiveIndex(null);
      }
    } catch (err: any) {
      if (err.message?.includes("duplicate")) {
        // Already accepted — no-op
      } else {
        toast.error("Failed to save acceptance");
      }
    }
  };

  const handleContinue = () => {
    navigate("/provider/onboarding/review", {
      state: { orgId, allowedZoneIds },
    });
  };

  if (loading || application.isLoading) {
    return (
      <div className="p-4 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (application.isError) return <QueryErrorCard />;

  if (!applicationId) {
    return (
      <div className="p-4">
        <p className="text-muted-foreground text-sm">
          No application found. Please{" "}
          <button
            className="text-primary underline"
            onClick={() => navigate("/provider/apply")}
          >
            submit an application
          </button>{" "}
          first.
        </p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in p-4 pb-24">
      <OnboardingProgressHeader currentStep={5} onBack={() => navigate("/provider/onboarding/compliance", { state: { orgId, allowedZoneIds } })} />
      <h1 className="text-h2 mb-1 flex items-center gap-2">
        <Shield className="h-5 w-5 text-primary" />
        Handled Standards
      </h1>
      <p className="text-caption mb-4">
        Please review and accept each operating rule. These protect you, your
        customers, and the platform.
      </p>

      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-medium text-muted-foreground">
            {acceptedCount} of {totalClauses} accepted
          </span>
          <span className="text-xs font-medium text-muted-foreground">
            {progressPercent}%
          </span>
        </div>
        <Progress value={progressPercent} className="h-2" />
      </div>

      {/* Clause cards */}
      <div className="space-y-3 mb-6">
        {AGREEMENT_CLAUSES.map((clause, index) => {
          const isAccepted = acceptedKeys.has(clause.key);
          const isActive =
            activeIndex === index ||
            (activeIndex === null && index === firstUnacceptedIndex);
          const isExpanded = isActive && !isAccepted;

          return (
            <ClauseCard
              key={clause.key}
              title={clause.title}
              text={clause.text}
              index={index}
              isAccepted={isAccepted}
              isExpanded={isExpanded}
              isAccepting={
                acceptClause.isPending &&
                acceptClause.variables === clause.key
              }
              onToggle={() =>
                setActiveIndex(isActive ? null : index)
              }
              onAccept={() => handleAccept(clause.key, index)}
            />
          );
        })}
      </div>

      {/* Continue button */}
      <Button
        className="w-full"
        onClick={handleContinue}
        disabled={!allAccepted}
      >
        {allAccepted ? (
          <>
            Continue to Review
            <ChevronRight className="h-4 w-4 ml-1" />
          </>
        ) : (
          `Accept all ${totalClauses} clauses to continue`
        )}
      </Button>
    </div>
  );
}

function ClauseCard({
  title,
  text,
  index,
  isAccepted,
  isExpanded,
  isAccepting,
  onToggle,
  onAccept,
}: {
  title: string;
  text: string;
  index: number;
  isAccepted: boolean;
  isExpanded: boolean;
  isAccepting: boolean;
  onToggle: () => void;
  onAccept: () => void;
}) {
  return (
    <Card
      className={`transition-all duration-200 ${
        isAccepted
          ? "border-success/30 bg-success/5"
          : isExpanded
          ? "border-primary/40 shadow-sm"
          : "cursor-pointer hover:border-primary/20"
      }`}
    >
      <CardContent className="py-3 px-4">
        <button
          className="w-full flex items-center gap-3 text-left"
          onClick={isAccepted ? undefined : onToggle}
          disabled={isAccepted}
        >
          {isAccepted ? (
            <CheckCircle className="h-5 w-5 text-success shrink-0" />
          ) : (
            <span className="h-5 w-5 rounded-full border-2 border-muted-foreground/30 shrink-0 flex items-center justify-center text-xs text-muted-foreground">
              {index + 1}
            </span>
          )}
          <span
            className={`text-sm font-medium flex-1 ${
              isAccepted ? "text-success" : ""
            }`}
          >
            {title}
          </span>
          {!isAccepted && (
            <ChevronRight
              className={`h-4 w-4 text-muted-foreground transition-transform ${
                isExpanded ? "rotate-90" : ""
              }`}
            />
          )}
        </button>

        {isExpanded && (
          <div className="mt-3 ml-8 animate-fade-in">
            <p className="text-sm text-muted-foreground leading-relaxed mb-3">
              {text}
            </p>
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onAccept();
              }}
              disabled={isAccepting}
              className="w-full"
            >
              {isAccepting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              I Agree
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
