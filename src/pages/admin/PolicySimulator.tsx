import { useState, useMemo } from "react";
import { useSupportPolicies, type SupportPolicy } from "@/hooks/useSupportPolicies";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageSkeleton } from "@/components/PageSkeleton";
import { FlaskConical, DollarSign, RotateCcw, Shield, AlertTriangle } from "lucide-react";

interface ScenarioInput {
  ticketCategory: string;
  evidenceScore: number;
  riskScore: number;
  customerTicketsThisMonth: number;
  customerTenureDays: number;
  jobValueCents: number;
}

interface SimulatedOutcome {
  action: string;
  creditAmountCents: number | null;
  redoOffered: boolean;
  autoResolved: boolean;
  reasoning: string[];
}

const CATEGORIES = [
  "quality_issue",
  "missed_visit",
  "wrong_service",
  "property_damage",
  "billing_dispute",
  "scheduling_error",
  "provider_behavior",
];

const CATEGORY_LABELS: Record<string, string> = {
  quality_issue: "Quality Issue",
  missed_visit: "Missed Visit",
  wrong_service: "Wrong Service",
  property_damage: "Property Damage",
  billing_dispute: "Billing Dispute",
  scheduling_error: "Scheduling Error",
  provider_behavior: "Provider Behavior",
};

function simulatePolicy(scenario: ScenarioInput, policy: SupportPolicy | null): SimulatedOutcome {
  const dials = (policy?.dials ?? {}) as Record<string, any>;
  const maxCredit = dials.max_credit_cents ?? 5000;
  const creditTiers: number[] = dials.credit_tiers ?? [500, 1000, 2500];
  const generosity = dials.generosity ?? 0.5;
  const redoAllowed = dials.redo_allowed ?? true;
  const evidenceRequired = dials.evidence_required ?? true;
  const abuseControls = dials.abuse_controls ?? { max_tickets_per_month: 5, repeat_window_days: 30 };

  const reasoning: string[] = [];

  // Abuse check
  if (scenario.customerTicketsThisMonth >= (abuseControls.max_tickets_per_month ?? 5)) {
    reasoning.push(`Abuse control: ${scenario.customerTicketsThisMonth} tickets this month (limit: ${abuseControls.max_tickets_per_month})`);
    return {
      action: "escalate_to_admin",
      creditAmountCents: null,
      redoOffered: false,
      autoResolved: false,
      reasoning: [...reasoning, "Ticket flagged for manual review due to abuse threshold"],
    };
  }

  // Evidence threshold
  if (evidenceRequired && scenario.evidenceScore < 30) {
    reasoning.push(`Evidence score ${scenario.evidenceScore} below threshold (30) — requesting more evidence`);
    return {
      action: "request_evidence",
      creditAmountCents: null,
      redoOffered: false,
      autoResolved: false,
      reasoning: [...reasoning, "Customer asked to provide additional evidence"],
    };
  }

  // Auto-resolve eligibility
  const canAutoResolve = scenario.evidenceScore >= 75 && scenario.riskScore < 30;
  reasoning.push(`Evidence: ${scenario.evidenceScore}/100, Risk: ${scenario.riskScore}/100`);
  reasoning.push(canAutoResolve ? "Eligible for auto-resolution" : "Requires manual review");

  // Calculate credit
  const severityFactor = scenario.riskScore > 70 ? 0.3 : scenario.riskScore > 40 ? 0.6 : 1.0;
  const tenureFactor = scenario.customerTenureDays > 180 ? 1.2 : scenario.customerTenureDays > 60 ? 1.0 : 0.8;
  const targetCredit = Math.round(scenario.jobValueCents * generosity * severityFactor * tenureFactor);

  // Snap to nearest tier
  let creditAmount = 0;
  for (const tier of [...creditTiers].sort((a, b) => b - a)) {
    if (targetCredit >= tier) {
      creditAmount = tier;
      break;
    }
  }
  creditAmount = Math.min(creditAmount, maxCredit);
  reasoning.push(`Computed credit: $${(targetCredit / 100).toFixed(2)} → snapped to tier: $${(creditAmount / 100).toFixed(2)}`);
  reasoning.push(`Factors: generosity=${generosity}, severity=${severityFactor.toFixed(1)}, tenure=${tenureFactor.toFixed(1)}`);

  // Redo offer
  const offerRedo = redoAllowed && ["quality_issue", "missed_visit", "wrong_service"].includes(scenario.ticketCategory);
  if (offerRedo) reasoning.push("Redo offered (category eligible + redo_allowed=true)");

  const action = canAutoResolve ? "auto_resolve" : "present_offer";

  return {
    action,
    creditAmountCents: creditAmount,
    redoOffered: offerRedo,
    autoResolved: canAutoResolve,
    reasoning,
  };
}

export default function PolicySimulator() {
  const { policies, isLoading, isError } = useSupportPolicies();
  const [scenario, setScenario] = useState<ScenarioInput>({
    ticketCategory: "quality_issue",
    evidenceScore: 80,
    riskScore: 20,
    customerTicketsThisMonth: 0,
    customerTenureDays: 90,
    jobValueCents: 5500,
  });

  const activePolicy = useMemo(
    () => policies?.find((p) => p.status === "published") ?? policies?.[0] ?? null,
    [policies]
  );

  const outcome = useMemo(
    () => simulatePolicy(scenario, activePolicy),
    [scenario, activePolicy]
  );

  if (isLoading) return <PageSkeleton />;

  if (isError) {
    return (
      <div className="p-6 space-y-4 max-w-4xl animate-fade-in">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-6 w-6 text-destructive" />
          <h1 className="text-2xl font-bold">Policy Simulator</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Failed to load support policies. Check your connection and try again.
        </p>
        <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
          <RotateCcw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in max-w-4xl">
      <div className="flex items-center gap-2">
        <FlaskConical className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Policy Simulator</h1>
      </div>
      <p className="text-sm text-muted-foreground">
        Test scenario inputs against the active support policy to see what resolution offers would be shown to customers.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inputs */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Scenario Inputs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <label className="text-xs text-muted-foreground">Ticket Category</label>
              <Select value={scenario.ticketCategory} onValueChange={(v) => setScenario((s) => ({ ...s, ticketCategory: v }))}>
                <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{CATEGORY_LABELS[c]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <div className="flex justify-between"><label className="text-xs text-muted-foreground">Evidence Score</label><span className="text-xs font-semibold text-primary">{scenario.evidenceScore}</span></div>
              <Slider value={[scenario.evidenceScore]} min={0} max={100} step={5} onValueChange={([v]) => setScenario((s) => ({ ...s, evidenceScore: v }))} />
            </div>

            <div>
              <div className="flex justify-between"><label className="text-xs text-muted-foreground">Risk Score</label><span className="text-xs font-semibold text-primary">{scenario.riskScore}</span></div>
              <Slider value={[scenario.riskScore]} min={0} max={100} step={5} onValueChange={([v]) => setScenario((s) => ({ ...s, riskScore: v }))} />
            </div>

            <div>
              <div className="flex justify-between"><label className="text-xs text-muted-foreground">Tickets This Month</label><span className="text-xs font-semibold text-primary">{scenario.customerTicketsThisMonth}</span></div>
              <Slider value={[scenario.customerTicketsThisMonth]} min={0} max={10} step={1} onValueChange={([v]) => setScenario((s) => ({ ...s, customerTicketsThisMonth: v }))} />
            </div>

            <div>
              <div className="flex justify-between"><label className="text-xs text-muted-foreground">Customer Tenure (days)</label><span className="text-xs font-semibold text-primary">{scenario.customerTenureDays}</span></div>
              <Slider value={[scenario.customerTenureDays]} min={0} max={365} step={30} onValueChange={([v]) => setScenario((s) => ({ ...s, customerTenureDays: v }))} />
            </div>

            <div>
              <div className="flex justify-between"><label className="text-xs text-muted-foreground">Job Value</label><span className="text-xs font-semibold text-primary">${(scenario.jobValueCents / 100).toFixed(0)}</span></div>
              <Slider value={[scenario.jobValueCents]} min={1000} max={20000} step={500} onValueChange={([v]) => setScenario((s) => ({ ...s, jobValueCents: v }))} />
            </div>
          </CardContent>
        </Card>

        {/* Outcome */}
        <div className="space-y-4">
          <Card className={outcome.autoResolved ? "border-green-500/30" : outcome.action === "escalate_to_admin" ? "border-destructive/30" : ""}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                Simulated Outcome
                {outcome.autoResolved && <Badge className="text-[10px] bg-green-500/20 text-green-400">Auto-Resolve</Badge>}
                {outcome.action === "escalate_to_admin" && <Badge variant="destructive" className="text-[10px]">Escalated</Badge>}
                {outcome.action === "request_evidence" && <Badge variant="outline" className="text-[10px]">Need Evidence</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground">Action</p>
                  <p className="text-sm font-semibold capitalize mt-1">{outcome.action.replace(/_/g, " ")}</p>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground">Credit Offered</p>
                  <p className="text-sm font-semibold mt-1">
                    {outcome.creditAmountCents != null ? `$${(outcome.creditAmountCents / 100).toFixed(2)}` : "—"}
                  </p>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground">Redo Offered</p>
                  <p className="text-sm font-semibold mt-1">{outcome.redoOffered ? "Yes" : "No"}</p>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground">Auto-Resolved</p>
                  <p className="text-sm font-semibold mt-1">{outcome.autoResolved ? "Yes" : "No"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">Decision Reasoning</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-1.5">
                {outcome.reasoning.map((r, i) => (
                  <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                    <span className="text-primary font-mono shrink-0">{i + 1}.</span>
                    {r}
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>

          {activePolicy && (
            <Card>
              <CardContent className="py-3">
                <p className="text-xs text-muted-foreground">
                  Using policy: <span className="font-medium text-foreground">{activePolicy.name}</span>
                  {" "}(v{activePolicy.version}, {activePolicy.status})
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
