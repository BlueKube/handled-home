import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Brain, ShieldCheck, AlertTriangle, Camera, Sparkles, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

interface AiInsightsCardProps {
  ticket: {
    id: string;
    ai_classification: Record<string, any> | null;
    ai_summary: string | null;
    ai_evidence_score: number | null;
    ai_risk_score: number | null;
    status: string;
    customer_id: string;
  };
}

export function AiInsightsCard({ ticket }: AiInsightsCardProps) {
  const queryClient = useQueryClient();
  const classification = ticket.ai_classification as Record<string, any> | null;
  const [applying, setApplying] = useState(false);
  const [creditOverride, setCreditOverride] = useState("");

  if (!classification && !ticket.ai_summary) return null;

  const autoResolvable = classification?.auto_resolvable === true;
  const suggestedCreditCents = classification?.suggested_credit_cents ?? 0;
  const resolutionExplanation = classification?.resolution_explanation ?? "";
  const photoAnalysis = classification?.photo_analysis as { has_evidence?: boolean; evidence_description?: string } | null;
  const reasoning = classification?.reasoning ?? "";
  const recommendedAction = classification?.recommended_action ?? "";
  const isRepeatOffender = classification?.is_repeat_offender === true;
  const evidenceScore = ticket.ai_evidence_score ?? 0;
  const riskScore = ticket.ai_risk_score ?? 0;
  const isResolved = ["resolved", "closed"].includes(ticket.status);

  const meetsAutoResolve = autoResolvable && evidenceScore >= 75 && riskScore < 30;

  const handleApplyResolution = async () => {
    setApplying(true);
    try {
      const overrideCents = creditOverride ? Math.round(parseFloat(creditOverride) * 100) : null;
      const { data, error } = await supabase.functions.invoke("auto-resolve-dispute", {
        body: { ticket_id: ticket.id, ...(overrideCents != null ? { credit_override_cents: overrideCents } : {}) },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (data?.success) {
        toast({ title: "AI resolution applied", description: `Credit: $${((data.credit_cents ?? 0) / 100).toFixed(2)}` });
        queryClient.invalidateQueries({ queryKey: ["support-ticket", ticket.id] });
        queryClient.invalidateQueries({ queryKey: ["support-ticket-events", ticket.id] });
      } else {
        toast({ title: "Cannot auto-resolve", description: data?.reason ?? "Does not meet criteria", variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Resolution failed", description: err.message, variant: "destructive" });
    } finally {
      setApplying(false);
    }
  };

  const scoreColor = (score: number, invert = false) => {
    const effective = invert ? 100 - score : score;
    if (effective >= 75) return "text-emerald-600";
    if (effective >= 50) return "text-amber-600";
    return "text-destructive";
  };

  return (
    <Card className="p-4 space-y-3 border-primary/20 bg-primary/5">
      <div className="flex items-center gap-2">
        <Brain className="h-4 w-4 text-primary" />
        <h3 className="text-xs font-semibold uppercase tracking-wider text-primary">AI Analysis</h3>
        {meetsAutoResolve && !isResolved && (
          <span className="ml-auto text-[10px] font-medium bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full flex items-center gap-1">
            <Sparkles className="h-3 w-3" /> Auto-resolvable
          </span>
        )}
      </div>

      {/* Scores */}
      <div className="flex gap-4">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Evidence:</span>
          <span className={`text-sm font-semibold ${scoreColor(evidenceScore)}`}>{evidenceScore}/100</span>
        </div>
        <div className="flex items-center gap-1.5">
          <AlertTriangle className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Risk:</span>
          <span className={`text-sm font-semibold ${scoreColor(riskScore, true)}`}>{riskScore}/100</span>
        </div>
        {isRepeatOffender && (
          <span className="text-[10px] font-medium bg-destructive/10 text-destructive px-2 py-0.5 rounded-full">
            Repeat offender
          </span>
        )}
      </div>

      {/* Reasoning */}
      {reasoning && (
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-0.5">Reasoning</p>
          <p className="text-sm">{reasoning}</p>
        </div>
      )}

      {/* Recommended action */}
      {recommendedAction && (
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-0.5">Recommended action</p>
          <p className="text-sm capitalize">{recommendedAction.replace(/_/g, " ")}</p>
        </div>
      )}

      {/* Photo analysis */}
      {photoAnalysis && (
        <div className="flex items-start gap-2">
          <Camera className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-0.5">
              Photo evidence: {photoAnalysis.has_evidence ? "Found" : "None"}
            </p>
            {photoAnalysis.evidence_description && (
              <p className="text-sm">{photoAnalysis.evidence_description}</p>
            )}
          </div>
        </div>
      )}

      {/* Resolution suggestion + apply button */}
      {resolutionExplanation && !isResolved && (
        <div className="bg-background rounded-lg p-3 space-y-2 border">
          <p className="text-xs font-medium text-muted-foreground">Suggested resolution</p>
          <p className="text-sm">{resolutionExplanation}</p>
          {suggestedCreditCents > 0 && (
            <p className="text-sm font-medium">
              Credit: ${(suggestedCreditCents / 100).toFixed(2)}
            </p>
          )}

          {meetsAutoResolve && (
            <div className="flex items-center gap-2 pt-1">
              <Input
                type="number"
                step="0.01"
                min="0"
                max="50"
                value={creditOverride}
                onChange={(e) => setCreditOverride(e.target.value)}
                placeholder={`Override ($${(suggestedCreditCents / 100).toFixed(2)})`}
                className="w-36 h-8 text-xs"
              />
              <Button
                size="sm"
                onClick={handleApplyResolution}
                disabled={applying}
                className="gap-1"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                {applying ? "Applying…" : "Apply AI resolution"}
              </Button>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}