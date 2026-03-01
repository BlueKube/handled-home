import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Camera } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSkuLevels, useGuidanceQuestions } from "@/hooks/useSkuLevels";
import { LevelSelector } from "./LevelSelector";
import type { EntitlementSku } from "@/hooks/useEntitlements";

interface SkuDetailModalProps {
  sku: EntitlementSku | null;
  onClose: () => void;
  onAdd: (skuId: string, levelId?: string | null) => void;
  alreadyAdded: boolean;
}

export function SkuDetailModal({ sku, onClose, onAdd, alreadyAdded }: SkuDetailModalProps) {
  const { data: skuDetail } = useQuery({
    queryKey: ["sku-detail", sku?.sku_id],
    enabled: !!sku?.sku_id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_skus")
        .select("inclusions, exclusions, duration_minutes, description")
        .eq("id", sku!.sku_id)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: levels } = useSkuLevels(sku?.sku_id ?? null);
  const { data: guidanceQuestions } = useGuidanceQuestions(sku?.sku_id ?? null);
  const activeLevels = (levels ?? []).filter((l) => l.is_active);
  const hasLevels = activeLevels.length > 0;
  const activeQuestions = guidanceQuestions ?? [];

  const [selectedLevelId, setSelectedLevelId] = useState<string | null>(null);
  const [questionAnswers, setQuestionAnswers] = useState<Record<string, number>>({});

  // Reset state when SKU changes
  useEffect(() => {
    setQuestionAnswers({});
    if (hasLevels) {
      setSelectedLevelId(activeLevels[0].id);
    } else {
      setSelectedLevelId(null);
    }
  }, [sku?.sku_id, levels]);

  // P5-F1 fix: Use additive level_bump from guidance options (not maps_to_level_number)
  const guidanceRecommendedLevelId = useMemo(() => {
    if (!hasLevels || activeQuestions.length === 0) return null;
    let totalBump = 0;
    for (const q of activeQuestions) {
      const answerIdx = questionAnswers[q.id];
      if (answerIdx === undefined) continue;
      const options = (q.options as any[]) ?? [];
      const chosen = options[answerIdx];
      if (chosen?.level_bump && chosen.level_bump > totalBump) {
        totalBump = chosen.level_bump;
      }
    }
    const targetNumber = 1 + totalBump;
    const recommended = activeLevels.find((l) => l.level_number === targetNumber);
    return recommended?.id ?? null;
  }, [questionAnswers, activeQuestions, activeLevels, hasLevels]);

  // Auto-select recommended level when guidance answers change
  useEffect(() => {
    if (guidanceRecommendedLevelId) {
      setSelectedLevelId(guidanceRecommendedLevelId);
    }
  }, [guidanceRecommendedLevelId]);

  if (!sku) return null;

  const selectedLevel = activeLevels.find((l) => l.id === selectedLevelId);

  const inclusions = hasLevels && selectedLevel
    ? (selectedLevel.inclusions as string[]) ?? []
    : skuDetail?.inclusions ?? [];
  const exclusions = hasLevels && selectedLevel
    ? (selectedLevel.exclusions as string[]) ?? []
    : skuDetail?.exclusions ?? [];

  return (
    <Dialog open={!!sku} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{sku.sku_name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Badge variant="secondary">{sku.ui_badge}</Badge>
          <p className="text-sm text-muted-foreground">{skuDetail?.description || sku.ui_explainer}</p>

          {/* P4-F5: Guidance Questions */}
          {activeQuestions.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Help us recommend the right level</p>
              {activeQuestions.map((q) => {
                const options = (q.options as any[]) ?? [];
                return (
                  <div key={q.id} className="space-y-1.5">
                    <p className="text-sm font-medium">{q.question_text}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {options.map((opt: any, idx: number) => (
                        <Button
                          key={idx}
                          variant={questionAnswers[q.id] === idx ? "default" : "outline"}
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => setQuestionAnswers((prev) => ({ ...prev, [q.id]: idx }))}
                        >
                          {opt.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Level Selector */}
          {hasLevels && (
            <div>
              {guidanceRecommendedLevelId && (
                <p className="text-xs text-primary mb-1">✨ Recommended based on your answers</p>
              )}
              <LevelSelector
                levels={activeLevels}
                selectedLevelId={selectedLevelId}
                onSelect={setSelectedLevelId}
              />
            </div>
          )}

          {/* Inclusions / Exclusions */}
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-success mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium">What's included</p>
                {inclusions.length > 0 ? (
                  <ul className="text-xs text-muted-foreground mt-1 space-y-0.5">
                    {inclusions.map((item: string, i: number) => (
                      <li key={i}>• {item}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-muted-foreground">Full service as described in your plan</p>
                )}
              </div>
            </div>
            <div className="flex items-start gap-2">
              <XCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium">What's not included</p>
                {exclusions.length > 0 ? (
                  <ul className="text-xs text-muted-foreground mt-1 space-y-0.5">
                    {exclusions.map((item: string, i: number) => (
                      <li key={i}>• {item}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-muted-foreground">Specialty treatments, hazardous materials, structural work</p>
                )}
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Camera className="h-4 w-4 text-accent mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium">Proof of completion</p>
                <p className="text-xs text-muted-foreground">
                  {selectedLevel
                    ? `${selectedLevel.proof_photo_min} photo${selectedLevel.proof_photo_min !== 1 ? "s" : ""} required`
                    : "Before & after photos submitted by your provider"}
                </p>
              </div>
            </div>
          </div>

          <Button
            className="w-full"
            disabled={alreadyAdded}
            onClick={() => onAdd(sku.sku_id, selectedLevelId)}
          >
            {alreadyAdded ? "Already in Routine" : hasLevels && selectedLevel
              ? `Add ${selectedLevel.label} · ${selectedLevel.handles_cost}h`
              : "Add to Routine"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
