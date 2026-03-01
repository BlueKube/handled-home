import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertTriangle, ArrowUpCircle, Lightbulb } from "lucide-react";
import { useSkuLevels, useLevelRecommendation, useCourtesyUpgrade } from "@/hooks/useSkuLevels";
import { toast } from "sonner";
import type { JobSku } from "@/hooks/useJobDetail";

const REASON_CODES = [
  { code: "home_larger_than_expected", label: "Home larger than expected" },
  { code: "more_buildup_than_typical", label: "More buildup/debris than typical" },
  { code: "access_constraints", label: "Access constraints reduced time" },
  { code: "customer_requested_extra", label: "Customer requested extra scope" },
  { code: "requires_deeper_level", label: "Requires deeper level to meet standard" },
  { code: "other", label: "Other (requires note)" },
];

interface LevelSufficiencyFormProps {
  jobSku: JobSku;
  jobId: string;
  propertyId: string;
  providerOrgId: string;
  onComplete: () => void;
}

type Step = "ask" | "recommend" | "courtesy" | "done";

export function LevelSufficiencyForm({ jobSku, jobId, propertyId, providerOrgId, onComplete }: LevelSufficiencyFormProps) {
  const { data: levels } = useSkuLevels(jobSku.sku_id);
  const activeLevels = (levels ?? []).filter((l) => l.is_active);
  const hasLevels = activeLevels.length > 0 && !!jobSku.scheduled_level_id;

  const [step, setStep] = useState<Step>("ask");
  const [recommendedLevelId, setRecommendedLevelId] = useState<string | null>(null);
  const [reasonCode, setReasonCode] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [doCourtesy, setDoCourtesy] = useState(false);

  const recommendMutation = useLevelRecommendation();
  const courtesyMutation = useCourtesyUpgrade();

  // Higher levels than currently scheduled
  const higherLevels = activeLevels.filter(
    (l) => l.level_number > (activeLevels.find((a) => a.id === jobSku.scheduled_level_id)?.level_number ?? 0)
  );

  // P5-F2: Auto-complete when no levels exist (e.g. deactivated after scheduling)
  useEffect(() => {
    if (!hasLevels) onComplete();
  }, [hasLevels, onComplete]);

  if (!hasLevels) return null;

  const scheduledLevel = activeLevels.find((l) => l.id === jobSku.scheduled_level_id);
  const recommendedLevel = activeLevels.find((l) => l.id === recommendedLevelId);

  const handleSufficient = () => {
    setStep("done");
    onComplete();
  };

  const handleSubmitRecommendation = async () => {
    if (!recommendedLevelId || !reasonCode || !jobSku.scheduled_level_id) return;

    try {
      await recommendMutation.mutateAsync({
        job_id: jobId,
        provider_org_id: providerOrgId,
        scheduled_level_id: jobSku.scheduled_level_id,
        recommended_level_id: recommendedLevelId,
        reason_code: reasonCode,
        note: note || null,
      });

      if (doCourtesy) {
        setStep("courtesy");
      } else {
        setStep("done");
        onComplete();
      }
    } catch (e: any) {
      // Error handled by mutation
    }
  };

  const handleSubmitCourtesy = async () => {
    if (!recommendedLevelId || !reasonCode || !jobSku.scheduled_level_id) return;

    try {
      await courtesyMutation.mutateAsync({
        job_id: jobId,
        property_id: propertyId,
        sku_id: jobSku.sku_id,
        scheduled_level_id: jobSku.scheduled_level_id,
        performed_level_id: recommendedLevelId,
        reason_code: reasonCode,
        provider_org_id: providerOrgId,
      });
      setStep("done");
      onComplete();
    } catch (e: any) {
      // P5-F4: Show toast on courtesy upgrade failure, then proceed
      toast.error("Courtesy upgrade not recorded: already used in last 6 months");
      setStep("done");
      onComplete();
    }
  };

  if (step === "done") {
    return (
      <Card className="p-4 border-success/30 bg-success/5">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-success" />
          <p className="text-sm font-medium">{jobSku.sku_name_snapshot} — Level feedback recorded</p>
        </div>
      </Card>
    );
  }

  if (step === "ask") {
    return (
      <Card className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-accent" />
          <p className="text-sm font-medium">{jobSku.sku_name_snapshot}</p>
          {scheduledLevel && (
            <Badge variant="outline" className="text-[10px]">{scheduledLevel.label}</Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          Was the scheduled level sufficient to meet Handled standards?
        </p>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" className="gap-1.5" onClick={handleSufficient}>
            <CheckCircle2 className="h-4 w-4 text-success" />
            Yes, sufficient
          </Button>
          <Button variant="outline" className="gap-1.5" onClick={() => setStep("recommend")}>
            <AlertTriangle className="h-4 w-4 text-warning" />
            No, recommend higher
          </Button>
        </div>
      </Card>
    );
  }

  if (step === "recommend") {
    return (
      <Card className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <ArrowUpCircle className="h-4 w-4 text-primary" />
          <p className="text-sm font-medium">Recommend level for {jobSku.sku_name_snapshot}</p>
        </div>

        {/* Level selection */}
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">Recommended level next time</p>
          <div className="flex flex-wrap gap-1.5">
            {higherLevels.map((l) => (
              <Button
                key={l.id}
                variant={recommendedLevelId === l.id ? "default" : "outline"}
                size="sm"
                className="h-8 text-xs"
                onClick={() => setRecommendedLevelId(l.id)}
              >
                {l.label}
              </Button>
            ))}
            {higherLevels.length === 0 && (
              <p className="text-xs text-muted-foreground">Already at the highest level</p>
            )}
          </div>
        </div>

        {/* Reason code */}
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">Reason</p>
          <div className="flex flex-wrap gap-1.5">
            {REASON_CODES.map((r) => (
              <Button
                key={r.code}
                variant={reasonCode === r.code ? "default" : "outline"}
                size="sm"
                className="h-7 text-[11px]"
                onClick={() => setReasonCode(r.code)}
              >
                {r.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Note */}
        {(reasonCode === "other" || note.length > 0) && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Note</p>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value.slice(0, 200))}
              placeholder="Brief explanation..."
              rows={2}
              className="resize-none text-sm"
            />
          </div>
        )}

        {/* Courtesy upgrade offer */}
        {recommendedLevelId && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
            <input
              type="checkbox"
              checked={doCourtesy}
              onChange={(e) => setDoCourtesy(e.target.checked)}
              className="mt-0.5 rounded"
            />
            <div>
              <p className="text-xs font-medium">I performed the higher level today (courtesy upgrade)</p>
              <p className="text-[10px] text-muted-foreground">
                Customer won't be charged extra. They'll be prompted to update for next time.
              </p>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => setStep("ask")} className="flex-1">
            Back
          </Button>
          <Button
            size="sm"
            className="flex-1"
            disabled={!recommendedLevelId || !reasonCode || (reasonCode === "other" && !note) || recommendMutation.isPending}
            onClick={handleSubmitRecommendation}
          >
            {recommendMutation.isPending ? "Submitting..." : "Submit"}
          </Button>
        </div>
      </Card>
    );
  }

  if (step === "courtesy") {
    return (
      <Card className="p-4 space-y-3 border-primary/30 bg-primary/5">
        <div className="flex items-center gap-2">
          <ArrowUpCircle className="h-5 w-5 text-primary" />
          <p className="text-sm font-medium">Confirm Courtesy Upgrade</p>
        </div>
        <p className="text-sm text-muted-foreground">
          You performed <strong>{recommendedLevel?.label}</strong> instead of <strong>{scheduledLevel?.label}</strong>.
          The customer won't be charged extra today.
        </p>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" className="flex-1" onClick={() => { setStep("done"); onComplete(); }}>
            Skip
          </Button>
          <Button
            size="sm"
            className="flex-1"
            disabled={courtesyMutation.isPending}
            onClick={handleSubmitCourtesy}
          >
            {courtesyMutation.isPending ? "Recording..." : "Confirm Upgrade"}
          </Button>
        </div>
      </Card>
    );
  }

  return null;
}
