/**
 * Creative Director UI/UX Audit Report Generator
 *
 * Evaluates screenshots grouped by user flows (not individual screens).
 * Produces a structured 4-part audit document:
 *   Part A — Strategic Audit (cross-flow insights)
 *   Part B — Flow-by-Flow Redesign Spec
 *   Part C — Global Pattern Rules + Cross-Product State Audit
 *   Part D — Priority Roadmap
 *
 * v2 upgrades:
 *   - Risk taxonomy on every finding (conversion/trust/retention/ops-burden/...)
 *   - Product-rule compliance as first-class scoring per flow
 *   - State coverage audit (loading/empty/error/locked/pending/partial)
 *   - Cross-product state pattern audit (horizontal review)
 *   - Component rules on every redesign target (not just recommendations)
 *
 * Usage:
 *   ANTHROPIC_API_KEY=sk-... npx tsx scripts/generate-creative-director-audit.ts
 *   npx tsx scripts/generate-creative-director-audit.ts --dry-run
 *
 * Environment:
 *   ANTHROPIC_API_KEY  — Required (falls back to scaffold mode)
 *   UX_CONCURRENCY     — Max parallel API calls (default: 2)
 *   UX_MODEL           — Claude model (default: claude-sonnet-4-20250514)
 *   UX_MAX_RETRIES     — Rate limit retry attempts (default: 5)
 */

import Anthropic from "@anthropic-ai/sdk";
import fs from "fs";
import path from "path";

const MILESTONES_DIR = path.resolve("test-results/milestones");
const MANIFEST_FILE = path.join(MILESTONES_DIR, "manifest.json");
const SYSTEM_PROMPT_FILE = path.resolve("e2e/prompts/creative-director-system.md");
const OUTPUT_FILE = path.resolve("test-results/creative-director-audit.md");
const SCORES_FILE = path.resolve("test-results/creative-director-scores.json");

const DRY_RUN = process.argv.includes("--dry-run");
const CONCURRENCY = parseInt(process.env.UX_CONCURRENCY ?? "2", 10);
const MODEL = process.env.UX_MODEL ?? "claude-sonnet-4-20250514";
const MAX_RETRIES = parseInt(process.env.UX_MAX_RETRIES ?? "5", 10);

// ── Risk Types ──

type RiskType =
  | "conversion"
  | "trust"
  | "retention"
  | "ops-burden"
  | "design-inconsistency"
  | "policy-violation";

// ── Flow Definitions ──

interface FlowDefinition {
  id: string;
  name: string;
  description: string;
  userJourney: string;
  /** Known system states this flow should handle */
  expectedStates: string[];
  prefixes: string[];
  priority: number;
}

const AUDIT_FLOWS: FlowDefinition[] = [
  {
    id: "customer-onboarding",
    name: "Customer Onboarding",
    description: "First-time customer experience from BYOC invite link through property setup",
    userJourney: "Customer receives invite link from provider → lands on BYOC page → signs up → enters property details → sees dashboard for first time",
    expectedStates: ["expired invite link", "duplicate account", "address not in coverage zone", "provider suspended", "incomplete wizard resume"],
    prefixes: ["byoc-", "customer-property", "customer-coverage-map", "customer-property-sizing"],
    priority: 1,
  },
  {
    id: "plans-subscribe-routine",
    name: "Plans / Subscribe / Routine",
    description: "Service selection, subscription, and routine configuration",
    userJourney: "Customer browses plans → selects a plan → configures service routine (SKUs + cadences) → reviews schedule → confirms subscription",
    expectedStates: ["no plans available", "payment failed", "plan change pending next cycle", "routine empty", "service unavailable in zone"],
    prefixes: ["customer-plans", "customer-subscription", "customer-routine", "customer-services"],
    priority: 2,
  },
  {
    id: "customer-dashboard-receipts",
    name: "Customer Dashboard / Receipts / Issues",
    description: "Day-to-day customer experience: dashboard, visit history, billing, support",
    userJourney: "Customer opens app → checks dashboard → views upcoming visits → reviews past visits with photos → manages billing → reports issues if needed",
    expectedStates: ["no visits yet", "visit delayed/rescheduled", "payment failed banner", "issue under review", "photos not yet uploaded", "empty billing history"],
    prefixes: [
      "customer-dashboard", "customer-history", "customer-upcoming",
      "customer-photos", "customer-billing", "customer-home-assistant",
      "customer-support",
    ],
    priority: 3,
  },
  {
    id: "provider-onboarding",
    name: "Provider Onboarding",
    description: "Provider application and onboarding through first job readiness",
    userJourney: "Provider applies → completes org details → sets coverage → selects service categories → submits compliance docs → signs agreement → review & submit",
    expectedStates: ["application pending review", "application rejected", "compliance docs expired", "probation status", "suspended status", "incomplete onboarding resume"],
    prefixes: ["provider-apply", "provider-organization", "provider-work-setup"],
    priority: 4,
  },
  {
    id: "provider-jobs",
    name: "Provider Day-of-Work / Job Execution",
    description: "Provider daily workflow: jobs, earnings, payouts, quality",
    userJourney: "Provider opens app → sees today's jobs → views job details → completes checklist → uploads photos → submits completion → checks earnings",
    expectedStates: ["no jobs today", "job cancelled by customer", "missing proof photos", "issue reported on job", "payout on hold", "Stripe Connect not set up", "quality score below threshold"],
    prefixes: [
      "provider-dashboard", "provider-jobs", "provider-earnings",
      "provider-payouts", "provider-quality", "provider-availability",
    ],
    priority: 5,
  },
  {
    id: "admin-ops",
    name: "Admin Ops Mission-Critical",
    description: "Admin operational monitoring and exception triage",
    userJourney: "Admin opens ops cockpit → scans zone health → monitors active jobs → triages exceptions → checks billing health → reviews support queue",
    expectedStates: ["critical exceptions", "zone at capacity", "provider shortage", "billing anomalies", "support queue overflowed", "mass rescheduling event"],
    prefixes: [
      "admin-dashboard", "admin-ops-", "admin-exceptions",
      "admin-zones", "admin-providers", "admin-applications",
    ],
    priority: 6,
  },
  {
    id: "growth-referral",
    name: "Growth / Referral Surfaces",
    description: "Viral loops, BYOC invite creation, referral programs",
    userJourney: "Provider creates BYOC invite link → tracks conversions → customer shares referral code → new user arrives via referral → attribution tracked",
    expectedStates: ["no referrals yet", "referral reward pending", "invite link expired", "customer already on platform", "attribution ambiguity"],
    prefixes: [
      "customer-referrals", "provider-byoc-", "provider-referrals",
      "public-auth",
    ],
    priority: 7,
  },
  {
    id: "reporting-analytics",
    name: "Reporting / Analytics",
    description: "Growth dashboards, feedback, insights, admin config",
    userJourney: "Admin reviews growth metrics → checks feedback → configures plans/SKUs → provider views insights and trends",
    expectedStates: ["no data yet (new zone)", "data loading", "stale data warning", "no feedback received"],
    prefixes: [
      "admin-growth", "admin-feedback", "admin-skus", "admin-plans",
      "provider-insights", "provider-coverage", "provider-skus",
    ],
    priority: 8,
  },
];

// ── Types ──

interface MilestoneMetadata {
  filename: string;
  flow: string;
  step: string;
  stepNumber: number;
  route: string;
  userGoal: string;
  screenType: string;
}

interface ScreenInfo {
  filename: string;
  label: string;
  filepath: string;
  flow?: string;
  step?: string;
  route?: string;
  userGoal?: string;
  screenType?: string;
}

interface FlowScreens {
  flow: FlowDefinition;
  screens: ScreenInfo[];
}

interface TypedFinding {
  finding: string;
  riskType: RiskType;
}

interface ProductRuleViolation {
  rule: string;
  screen: string;
  detail: string;
  riskType: RiskType;
  severity: string;
}

interface StatesCoverage {
  loadingState: string;
  loadingNotes: string;
  emptyState: string;
  emptyNotes: string;
  errorState: string;
  errorNotes: string;
  lockedState: string;
  lockedNotes: string;
  pendingState: string;
  pendingNotes: string;
  partialState: string;
  partialNotes: string;
}

interface RedesignTarget {
  screen: string;
  problem: string;
  recommendation: string;
  componentRule: string;
  priority: string;
  impact: string;
  riskType: RiskType;
}

interface CopyRecommendation {
  screen: string;
  current: string;
  recommended: string;
  reason: string;
  riskType: RiskType;
}

interface FlowEvaluation {
  flowSummary: string;
  overallGrade: string;
  strengthsTopThree: string[];
  frictionScore: number;
  frictionFindings: TypedFinding[];
  trustScore: number;
  trustFindings: TypedFinding[];
  storytellingScore: number;
  storytellingFindings: TypedFinding[];
  hierarchyScore: number;
  hierarchyFindings: TypedFinding[];
  consistencyScore: number;
  consistencyFindings: TypedFinding[];
  conversionScore: number;
  conversionFindings: TypedFinding[];
  stateHandlingScore: number;
  stateHandlingFindings: TypedFinding[];
  productRuleCompliance: {
    score: number;
    violations: ProductRuleViolation[];
    commentary: string;
  };
  statesCoverage: StatesCoverage;
  missingScreens: string[];
  unnecessaryScreens: string[];
  topRedesignTargets: RedesignTarget[];
  copyRecommendations: CopyRecommendation[];
}

interface FlowResult {
  flow: FlowDefinition;
  screens: ScreenInfo[];
  evaluation: FlowEvaluation;
}

interface FlowScores {
  flowId: string;
  flowName: string;
  grade: string;
  friction: number;
  trust: number;
  storytelling: number;
  hierarchy: number;
  consistency: number;
  conversion: number;
  stateHandling: number;
  productRuleCompliance: number;
  composite: number;
}

// ── Helpers ──

function loadManifest(): Map<string, MilestoneMetadata> {
  const map = new Map<string, MilestoneMetadata>();
  if (!fs.existsSync(MANIFEST_FILE)) return map;
  try {
    const data: MilestoneMetadata[] = JSON.parse(
      fs.readFileSync(MANIFEST_FILE, "utf-8")
    );
    for (const entry of data) map.set(entry.filename, entry);
  } catch {
    // graceful
  }
  return map;
}

function getScreenshots(): ScreenInfo[] {
  if (!fs.existsSync(MILESTONES_DIR)) {
    console.warn(`No milestones directory found at ${MILESTONES_DIR}`);
    return [];
  }
  const manifest = loadManifest();
  return fs
    .readdirSync(MILESTONES_DIR)
    .filter((f) => f.endsWith(".png"))
    .sort()
    .map((f) => {
      const meta = manifest.get(f);
      return {
        filename: f,
        filepath: path.join(MILESTONES_DIR, f),
        label: f
          .replace(".png", "")
          .replace(/-/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase()),
        flow: meta?.flow,
        step: meta?.step,
        route: meta?.route,
        userGoal: meta?.userGoal,
        screenType: meta?.screenType,
      };
    });
}

function groupScreensByFlow(screenshots: ScreenInfo[]): FlowScreens[] {
  const result: FlowScreens[] = [];
  const assigned = new Set<string>();

  for (const flow of AUDIT_FLOWS) {
    const screens = screenshots.filter((s) =>
      flow.prefixes.some((prefix) => s.filename.startsWith(prefix))
    );
    if (screens.length > 0) {
      result.push({ flow, screens });
      for (const s of screens) assigned.add(s.filename);
    }
  }

  const unassigned = screenshots.filter((s) => !assigned.has(s.filename));
  if (unassigned.length > 0) {
    result.push({
      flow: {
        id: "uncategorized",
        name: "Other Screens",
        description: "Screens not assigned to a primary audit flow",
        userJourney: "Various utility and settings screens",
        expectedStates: [],
        prefixes: [],
        priority: 99,
      },
      screens: unassigned,
    });
  }

  return result.sort((a, b) => a.flow.priority - b.flow.priority);
}

function getSystemPrompt(): string {
  if (!fs.existsSync(SYSTEM_PROMPT_FILE)) {
    throw new Error(`System prompt not found: ${SYSTEM_PROMPT_FILE}`);
  }
  return fs.readFileSync(SYSTEM_PROMPT_FILE, "utf-8");
}

// ── Concurrency ──

async function runWithConcurrency<T>(
  tasks: (() => Promise<T>)[],
  concurrency: number
): Promise<T[]> {
  const results: T[] = [];
  let index = 0;
  async function worker() {
    while (index < tasks.length) {
      const i = index++;
      results[i] = await tasks[i]();
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(concurrency, tasks.length) }, () => worker())
  );
  return results;
}

// ── Rate-limit retry ──

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withRetry<T>(fn: () => Promise<T>, label: string): Promise<T> {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (error: unknown) {
      const isRateLimit =
        error instanceof Error &&
        (error.message.includes("429") ||
          error.message.includes("rate_limit") ||
          (error as { status?: number }).status === 429);

      if (!isRateLimit || attempt === MAX_RETRIES) {
        throw error;
      }

      let waitMs: number;
      const retryAfter = (error as { headers?: { "retry-after"?: string } })
        .headers?.["retry-after"];
      if (retryAfter) {
        waitMs = (parseFloat(retryAfter) + 1) * 1000;
      } else {
        waitMs = Math.min(2000 * Math.pow(2, attempt), 120000);
      }

      console.log(
        `  Rate limited on "${label}" (attempt ${attempt + 1}/${MAX_RETRIES}), waiting ${Math.round(waitMs / 1000)}s...`
      );
      await sleep(waitMs);
    }
  }
  throw new Error("Unreachable");
}

// ── AI Evaluation ──

async function evaluateFlow(
  client: Anthropic,
  systemPrompt: string,
  flowScreens: FlowScreens,
): Promise<FlowEvaluation> {
  const { flow, screens } = flowScreens;

  const screenList = screens
    .map((s, i) => {
      const parts = [`Screen ${i + 1}: "${s.label}"`];
      if (s.route) parts.push(`Route: ${s.route.replace(/\/[a-f0-9-]{20,}/g, "/:token")}`);
      if (s.userGoal) parts.push(`User goal: ${s.userGoal}`);
      if (s.screenType) parts.push(`Type: ${s.screenType}`);
      return parts.join(" | ");
    })
    .join("\n");

  const stateContext = flow.expectedStates.length > 0
    ? `\n**Known system states this flow must handle**: ${flow.expectedStates.join(", ")}`
    : "";

  const content: Anthropic.Messages.ContentBlockParam[] = [
    {
      type: "text",
      text: `## Flow: ${flow.name}

${flow.description}

**User Journey**: ${flow.userJourney}
${stateContext}

**Screens in this flow** (${screens.length} total):
${screenList}

Analyze ALL ${screens.length} screenshots below as a complete flow. Evaluate the journey holistically — how screens connect, whether momentum is maintained, where users would drop off.

IMPORTANT: You MUST evaluate product-rule compliance, state coverage, and assign a riskType to every finding. Every redesign target MUST include a componentRule.

Respond with a JSON object matching the schema defined in the system prompt. Do not include any text outside the JSON.`,
    },
  ];

  for (const screen of screens) {
    const imageData = fs.readFileSync(screen.filepath);
    const base64Image = imageData.toString("base64");

    content.push({
      type: "text",
      text: `\n--- Screenshot: "${screen.label}" ---`,
    });
    content.push({
      type: "image",
      source: {
        type: "base64",
        media_type: "image/png",
        data: base64Image,
      },
    });
  }

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 6000,
    system: systemPrompt,
    messages: [{ role: "user", content }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") throw new Error("No text response");

  let jsonText = textBlock.text.trim();
  const jsonMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) jsonText = jsonMatch[1].trim();

  return JSON.parse(jsonText) as FlowEvaluation;
}

// ── Strategic Summary (Part A) ──

async function generateStrategicSummary(
  client: Anthropic,
  results: FlowResult[],
  scores: FlowScores[],
): Promise<string> {
  // Aggregate findings by risk type
  const findingsByRisk: Record<string, { flow: string; finding: string }[]> = {};
  for (const r of results) {
    const allFindings = [
      ...r.evaluation.frictionFindings,
      ...r.evaluation.trustFindings,
      ...r.evaluation.conversionFindings,
      ...r.evaluation.stateHandlingFindings,
    ];
    for (const f of allFindings) {
      if (!findingsByRisk[f.riskType]) findingsByRisk[f.riskType] = [];
      findingsByRisk[f.riskType].push({ flow: r.flow.name, finding: f.finding });
    }
  }

  const flowData = results.map((r) => ({
    flow: r.flow.name,
    grade: r.evaluation.overallGrade,
    screens: r.screens.length,
    strengths: r.evaluation.strengthsTopThree,
    friction: r.evaluation.frictionScore,
    trust: r.evaluation.trustScore,
    conversion: r.evaluation.conversionScore,
    productRuleCompliance: r.evaluation.productRuleCompliance.score,
    stateHandling: r.evaluation.stateHandlingScore,
    policyViolationCount: r.evaluation.productRuleCompliance.violations.length,
    topRedesigns: r.evaluation.topRedesignTargets.slice(0, 3),
    missingScreens: r.evaluation.missingScreens,
  }));

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 3500,
    messages: [
      {
        role: "user",
        content: `You are a creative director writing the executive summary of a UI/UX audit for Handled Home, a mobile home-services marketplace.

Below are flow-by-flow audit results across ${results.length} user journeys, with findings categorized by risk type.

Product rules: mobile-only, calm/competent/kind voice, one clear primary CTA, no calendar creep, no marketplace feel, consistent proof/status UI, screens explain what happens next, accessible and non-blaming, next-cycle language, proof before narrative, guided provider flows, bounded issue reporting, structured support.

Produce the strategic audit summary in this exact markdown format:

## Executive Summary

[3-4 sentences on overall design health]

### Biggest Cross-Product UX Problems

1. [Problem + which flows it affects + risk type + severity]
2. ...
3. ...
4. ...
5. ...

### Trust & Friction Assessment

| Flow | Grade | Friction | Trust | Conversion | Product Rules | States |
|------|-------|----------|-------|------------|---------------|--------|
${scores.map((s) => `| ${s.flowName} | ${s.grade} | ${s.friction}/10 | ${s.trust}/10 | ${s.conversion}/10 | ${s.productRuleCompliance}/10 | ${s.stateHandling}/10 |`).join("\n")}

### Risk Type Distribution

| Risk Type | Count | Most Affected Flows |
|-----------|-------|---------------------|
${Object.entries(findingsByRisk).map(([type, findings]) => {
  const flows = [...new Set(findings.map((f) => f.flow))].join(", ");
  return `| ${type} | ${findings.length} | ${flows} |`;
}).join("\n")}

### Design System Drift

[2-3 sentences identifying where the design system is inconsistent]

### Top Conversion Blockers

1. [Blocker + flow + estimated impact]
2. ...
3. ...

### Top Retention Blockers

1. [Blocker + flow + estimated impact]
2. ...
3. ...

### Ops/Support Burden Risks

1. [UI gap that will generate support tickets + flow]
2. ...
3. ...

### Product-Rule Compliance Summary

[2-3 sentences on how well the product adheres to its own philosophy. Call out the most egregious violations.]

Flow audit data:
${JSON.stringify(flowData, null, 2)}

Findings by risk type:
${JSON.stringify(findingsByRisk, null, 2)}`,
      },
    ],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") throw new Error("No summary response");
  return textBlock.text.trim();
}

// ── Cross-Product State Pattern Audit ──

async function generateCrossProductStateAudit(
  client: Anthropic,
  results: FlowResult[],
): Promise<string> {
  const stateData = results.map((r) => ({
    flow: r.flow.name,
    statesCoverage: r.evaluation.statesCoverage,
    stateHandlingScore: r.evaluation.stateHandlingScore,
    stateFindings: r.evaluation.stateHandlingFindings,
    expectedStates: r.flow.expectedStates,
  }));

  const allViolations = results.flatMap((r) =>
    r.evaluation.productRuleCompliance.violations.map((v) => ({ ...v, flow: r.flow.name }))
  );

  const allComponentRules = results.flatMap((r) =>
    r.evaluation.topRedesignTargets
      .filter((t) => t.componentRule)
      .map((t) => ({ rule: t.componentRule, screen: t.screen, flow: r.flow.name }))
  );

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 4000,
    messages: [
      {
        role: "user",
        content: `You are a creative director codifying global pattern rules and a cross-product state audit for Handled Home, a mobile home-services marketplace.

The product uses calm, competent, kind truth-telling across all states. Key recurring system states include: loading, pending review, en route, issue under review, payment failed, plan updates effective next cycle, under review, on hold, delayed, unavailable.

Based on the audit findings below, produce TWO sections in this exact markdown format:

## Cross-Product State Pattern Audit

Review each state type horizontally across ALL flows:

### Loading States
- **Current coverage**: [which flows showed loading states, which didn't]
- **Consistency**: [are loading states consistent across flows?]
- **Standard**: [prescriptive rule, e.g. "All loading states must show brand wordmark + one-line context sentence + skeleton of expected content"]

### Empty/Zero-Data States
- **Current coverage**: ...
- **Consistency**: ...
- **Standard**: [prescriptive rule]

### Error/Failure States
- **Current coverage**: ...
- **Consistency**: ...
- **Standard**: [prescriptive rule — must align with non-blaming product rule]

### Pending/Review States
- **Current coverage**: ...
- **Consistency**: ...
- **Standard**: [prescriptive rule — critical for provider onboarding and admin ops]

### Locked/Disabled States
- **Current coverage**: ...
- **Consistency**: ...
- **Standard**: [prescriptive rule]

### Truth Banner / Status Communication Standards
- **Current patterns**: [how the app currently communicates status changes like "Updated", "Under review", "Action required"]
- **Standard**: [prescriptive severity/tone model for all status communications]

## Component Implementation Rules

These are reusable, testable rules that can be directly enforced in the component library:

### Loading State Component
- [Rule 1]
- [Rule 2]

### Error State Component
- [Rule 1]
- [Rule 2]

### Empty State Component
- [Rule 1]
- [Rule 2]

### CTA Hierarchy Rules
- [Primary: rule]
- [Secondary: rule]
- [Tertiary: rule]

### Truth Banner Component
- [Severity levels and when to use each]
- [Tone rules]

### Form Pattern Rules
- [Rule 1: mobile-first, thumb-zone]
- [Rule 2: minimal fields]

### Progress/Wizard Pattern Rules
- [Rule 1]
- [Rule 2]

### Card & List Pattern Rules
- [Rule 1]
- [Rule 2]

### Receipt/Proof Display Rules
- [Rule 1: proof before narrative]
- [Rule 2]

### Dashboard Scanning Rules
- [Rule 1: especially admin]
- [Rule 2]

Each rule must be specific, testable, and directly implementable. Not vague. Reference the product rules and actual audit findings.

State coverage data by flow:
${JSON.stringify(stateData, null, 2)}

Product-rule violations found:
${JSON.stringify(allViolations, null, 2)}

Component rules suggested by flow audits:
${JSON.stringify(allComponentRules, null, 2)}`,
      },
    ],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") throw new Error("No state audit response");
  return textBlock.text.trim();
}

// ── Scoring ──

function computeFlowScores(results: FlowResult[]): FlowScores[] {
  return results
    .map((r) => {
      const e = r.evaluation;
      const invertedFriction = 11 - e.frictionScore;
      const composite =
        (invertedFriction + e.trustScore + e.storytellingScore +
          e.hierarchyScore + e.consistencyScore + e.conversionScore +
          e.stateHandlingScore + e.productRuleCompliance.score) / 8;
      return {
        flowId: r.flow.id,
        flowName: r.flow.name,
        grade: e.overallGrade,
        friction: e.frictionScore,
        trust: e.trustScore,
        storytelling: e.storytellingScore,
        hierarchy: e.hierarchyScore,
        consistency: e.consistencyScore,
        conversion: e.conversionScore,
        stateHandling: e.stateHandlingScore,
        productRuleCompliance: e.productRuleCompliance.score,
        composite: Math.round(composite * 10) / 10,
      };
    })
    .sort((a, b) => a.composite - b.composite);
}

// ── Report Formatting ──

function formatFinding(f: TypedFinding): string {
  return `${f.finding} \`[${f.riskType}]\``;
}

function generateAIReport(
  results: FlowResult[],
  scores: FlowScores[],
  strategicSummary: string,
  stateAuditAndRules: string,
): string {
  const lines: string[] = [];

  lines.push("# Handled Home — Creative Director UI/UX Audit");
  lines.push("");
  lines.push(`**Generated**: ${new Date().toISOString()}`);
  lines.push(`**Model**: ${MODEL}`);
  lines.push(`**Flows evaluated**: ${results.length}`);
  const totalScreens = results.reduce((sum, r) => sum + r.screens.length, 0);
  lines.push(`**Total screens**: ${totalScreens}`);
  lines.push("");
  lines.push("---");
  lines.push("");

  // ── Part A: Strategic Audit ──
  lines.push("# Part A — Strategic Audit");
  lines.push("");
  lines.push(strategicSummary);
  lines.push("");
  lines.push("---");
  lines.push("");

  // ── Part B: Flow-by-Flow Redesign Spec ──
  lines.push("# Part B — Flow-by-Flow Redesign Spec");
  lines.push("");

  for (const r of results) {
    const e = r.evaluation;
    lines.push(`## ${r.flow.priority}. ${r.flow.name} (Grade: ${e.overallGrade})`);
    lines.push("");
    lines.push(`**Journey**: ${r.flow.userJourney}`);
    lines.push("");
    lines.push(`**Screens**: ${r.screens.map((s) => s.label).join(", ")}`);
    lines.push("");
    lines.push(`> ${e.flowSummary}`);
    lines.push("");

    // Strengths
    lines.push("**Strengths**");
    for (const s of e.strengthsTopThree) {
      lines.push(`- ${s}`);
    }
    lines.push("");

    // Scores table
    lines.push("| Dimension | Score | Key Finding |");
    lines.push("|-----------|-------|-------------|");
    lines.push(`| Friction | ${e.frictionScore}/10 | ${e.frictionFindings[0] ? formatFinding(e.frictionFindings[0]) : "—"} |`);
    lines.push(`| Trust | ${e.trustScore}/10 | ${e.trustFindings[0] ? formatFinding(e.trustFindings[0]) : "—"} |`);
    lines.push(`| Storytelling | ${e.storytellingScore}/10 | ${e.storytellingFindings[0] ? formatFinding(e.storytellingFindings[0]) : "—"} |`);
    lines.push(`| Hierarchy | ${e.hierarchyScore}/10 | ${e.hierarchyFindings[0] ? formatFinding(e.hierarchyFindings[0]) : "—"} |`);
    lines.push(`| Consistency | ${e.consistencyScore}/10 | ${e.consistencyFindings[0] ? formatFinding(e.consistencyFindings[0]) : "—"} |`);
    lines.push(`| Conversion | ${e.conversionScore}/10 | ${e.conversionFindings[0] ? formatFinding(e.conversionFindings[0]) : "—"} |`);
    lines.push(`| State Handling | ${e.stateHandlingScore}/10 | ${e.stateHandlingFindings[0] ? formatFinding(e.stateHandlingFindings[0]) : "—"} |`);
    lines.push(`| **Product Rules** | **${e.productRuleCompliance.score}/10** | ${e.productRuleCompliance.commentary.slice(0, 120)}${e.productRuleCompliance.commentary.length > 120 ? "..." : ""} |`);
    lines.push("");

    // Product-rule compliance (first-class section)
    if (e.productRuleCompliance.violations.length > 0) {
      lines.push("### Product-Rule Violations");
      lines.push("");
      lines.push("| Severity | Rule | Screen | Detail |");
      lines.push("|----------|------|--------|--------|");
      for (const v of e.productRuleCompliance.violations) {
        lines.push(`| ${v.severity} | ${v.rule} | ${v.screen} | ${v.detail} |`);
      }
      lines.push("");
    }

    // State coverage
    const sc = e.statesCoverage;
    const stateEntries = [
      { label: "Loading", status: sc.loadingState, notes: sc.loadingNotes },
      { label: "Empty", status: sc.emptyState, notes: sc.emptyNotes },
      { label: "Error", status: sc.errorState, notes: sc.errorNotes },
      { label: "Locked", status: sc.lockedState, notes: sc.lockedNotes },
      { label: "Pending", status: sc.pendingState, notes: sc.pendingNotes },
      { label: "Partial", status: sc.partialState, notes: sc.partialNotes },
    ];
    const needsAudit = stateEntries.filter((s) => s.status === "needs-audit" || s.status === "not-visible");
    if (needsAudit.length > 0) {
      lines.push("### State Coverage Gaps");
      lines.push("");
      lines.push("| State | Status | Notes |");
      lines.push("|-------|--------|-------|");
      for (const s of needsAudit) {
        lines.push(`| ${s.label} | ${s.status} | ${s.notes} |`);
      }
      lines.push("");
    }

    // Missing / unnecessary screens
    if (e.missingScreens.length > 0) {
      lines.push("**Missing screens**: " + e.missingScreens.join("; "));
      lines.push("");
    }
    if (e.unnecessaryScreens.length > 0) {
      lines.push("**Unnecessary screens**: " + e.unnecessaryScreens.join("; "));
      lines.push("");
    }

    // Redesign targets with component rules
    if (e.topRedesignTargets.length > 0) {
      lines.push("### Redesign Targets");
      lines.push("");
      for (const t of e.topRedesignTargets) {
        lines.push(`**${t.screen}** — \`${t.priority}\` / \`${t.impact}\` / \`${t.riskType}\``);
        lines.push(`- **Problem**: ${t.problem}`);
        lines.push(`- **Recommendation**: ${t.recommendation}`);
        lines.push(`- **Component Rule**: ${t.componentRule}`);
        lines.push("");
      }
    }

    // Copy recommendations
    if (e.copyRecommendations.length > 0) {
      lines.push("### Copy Recommendations");
      lines.push("");
      lines.push("| Screen | Current | Recommended | Reason | Risk |");
      lines.push("|--------|---------|-------------|--------|------|");
      for (const c of e.copyRecommendations) {
        lines.push(`| ${c.screen} | ${c.current} | ${c.recommended} | ${c.reason} | \`${c.riskType}\` |`);
      }
      lines.push("");
    }

    lines.push("---");
    lines.push("");
  }

  // ── Part C: Cross-Product State Audit + Component Rules ──
  lines.push("# Part C — Cross-Product State Audit & Component Rules");
  lines.push("");
  lines.push(stateAuditAndRules);
  lines.push("");
  lines.push("---");
  lines.push("");

  // ── Part D: Priority Roadmap ──
  lines.push("# Part D — Priority Roadmap");
  lines.push("");

  // Collect all redesign targets
  const allTargets = results.flatMap((r) =>
    r.evaluation.topRedesignTargets.map((t) => ({
      ...t,
      flow: r.flow.name,
    }))
  );

  // Group by risk type first, then priority
  const riskGroups: Record<string, typeof allTargets> = {};
  for (const t of allTargets) {
    if (!riskGroups[t.riskType]) riskGroups[t.riskType] = [];
    riskGroups[t.riskType].push(t);
  }

  const quickWins = allTargets.filter((t) => t.priority === "now" && t.impact === "high");
  const mediumLift = allTargets.filter(
    (t) => (t.priority === "now" && t.impact !== "high") || (t.priority === "soon" && t.impact === "high")
  );
  const biggerRedesigns = allTargets.filter(
    (t) => t.priority === "later" || (t.priority === "soon" && t.impact !== "high")
  );

  lines.push("## Quick Wins (Now / High Impact)");
  lines.push("");
  if (quickWins.length === 0) {
    lines.push("_No quick wins identified._");
  } else {
    for (let i = 0; i < quickWins.length; i++) {
      const t = quickWins[i];
      lines.push(`${i + 1}. **${t.screen}** (${t.flow}) \`${t.riskType}\`: ${t.recommendation}`);
      lines.push(`   - _Component rule_: ${t.componentRule}`);
    }
  }
  lines.push("");

  lines.push("## Medium-Lift / High-Impact");
  lines.push("");
  if (mediumLift.length === 0) {
    lines.push("_None identified._");
  } else {
    for (let i = 0; i < mediumLift.length; i++) {
      const t = mediumLift[i];
      lines.push(`${i + 1}. **${t.screen}** (${t.flow}) \`${t.riskType}\`: ${t.recommendation}`);
      lines.push(`   - _Component rule_: ${t.componentRule}`);
    }
  }
  lines.push("");

  lines.push("## Bigger Redesigns (Later)");
  lines.push("");
  if (biggerRedesigns.length === 0) {
    lines.push("_None identified._");
  } else {
    for (let i = 0; i < biggerRedesigns.length; i++) {
      const t = biggerRedesigns[i];
      lines.push(`${i + 1}. **${t.screen}** (${t.flow}) \`${t.riskType}\`: ${t.recommendation}`);
      lines.push(`   - _Component rule_: ${t.componentRule}`);
    }
  }
  lines.push("");

  // Risk type breakdown
  lines.push("## Findings by Risk Type");
  lines.push("");
  lines.push("| Risk Type | Targets | Flows |");
  lines.push("|-----------|---------|-------|");
  for (const [riskType, targets] of Object.entries(riskGroups)) {
    const flows = [...new Set(targets.map((t) => t.flow))].join(", ");
    lines.push(`| \`${riskType}\` | ${targets.length} | ${flows} |`);
  }
  lines.push("");

  // Flow scorecard
  lines.push("## Flow Scorecard");
  lines.push("");
  lines.push("| Rank | Flow | Grade | Friction | Trust | Story | Hierarchy | Consistency | Conversion | States | Product Rules | Composite |");
  lines.push("|------|------|-------|----------|-------|-------|-----------|-------------|------------|--------|---------------|-----------|");
  scores.forEach((s, i) => {
    lines.push(
      `| ${i + 1} | ${s.flowName} | ${s.grade} | ${s.friction} | ${s.trust} | ${s.storytelling} | ${s.hierarchy} | ${s.consistency} | ${s.conversion} | ${s.stateHandling} | ${s.productRuleCompliance} | **${s.composite}** |`
    );
  });
  lines.push("");

  lines.push("---");
  lines.push("");
  lines.push("_This audit was generated by AI creative director review using Claude._");
  return lines.join("\n");
}

function generateScaffoldReport(flowGroups: FlowScreens[]): string {
  const lines: string[] = [];
  lines.push("# Handled Home — Creative Director UI/UX Audit");
  lines.push("");
  lines.push(`**Generated**: ${new Date().toISOString()}`);
  lines.push(`**Mode**: Scaffold (dry run)`);
  const totalScreens = flowGroups.reduce((sum, g) => sum + g.screens.length, 0);
  lines.push(`**Flows**: ${flowGroups.length}`);
  lines.push(`**Total screens**: ${totalScreens}`);
  lines.push("");

  if (totalScreens === 0) {
    lines.push("> No screenshots found. Run `npm run test:catalog` first.");
    return lines.join("\n");
  }

  lines.push("## Flow Inventory");
  lines.push("");
  lines.push("| Priority | Flow | Screens | Expected States | Description |");
  lines.push("|----------|------|---------|-----------------|-------------|");
  for (const g of flowGroups) {
    lines.push(`| ${g.flow.priority} | ${g.flow.name} | ${g.screens.length} | ${g.flow.expectedStates.length} | ${g.flow.description} |`);
  }
  lines.push("");

  for (const g of flowGroups) {
    lines.push(`## ${g.flow.priority}. ${g.flow.name}`);
    lines.push("");
    lines.push(`**Journey**: ${g.flow.userJourney}`);
    if (g.flow.expectedStates.length > 0) {
      lines.push(`**Expected states to audit**: ${g.flow.expectedStates.join(", ")}`);
    }
    lines.push("");
    lines.push("| Screen | Route | User Goal | Type |");
    lines.push("|--------|-------|-----------|------|");
    for (const s of g.screens) {
      const route = s.route?.replace(/\/[a-f0-9-]{20,}/g, "/:token") ?? "—";
      lines.push(`| ${s.label} | ${route} | ${s.userGoal ?? "—"} | ${s.screenType ?? "—"} |`);
    }
    lines.push("");
  }

  lines.push("_Set ANTHROPIC_API_KEY to run the full creative director audit._");
  return lines.join("\n");
}

// ── Main ──

async function main() {
  const screenshots = getScreenshots();
  console.log(`Found ${screenshots.length} screenshots`);

  const flowGroups = groupScreensByFlow(screenshots);
  console.log(`Grouped into ${flowGroups.length} audit flows:`);
  for (const g of flowGroups) {
    console.log(`  ${g.flow.priority}. ${g.flow.name} (${g.screens.length} screens, ${g.flow.expectedStates.length} expected states)`);
  }

  if (screenshots.length === 0) {
    console.log("\nNo screenshots found. Run tests first:");
    console.log("  npm run test:catalog    (full catalog)");
    console.log("  npm run test:e2e        (BYOC flow only)");
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  const useAI = !DRY_RUN && !!apiKey && screenshots.length > 0;

  if (DRY_RUN) {
    console.log("\n--dry-run flag set. Generating scaffold report.");
  } else if (!apiKey) {
    console.log("\nNo ANTHROPIC_API_KEY. Generating scaffold report.");
  }

  let report: string;

  if (useAI) {
    try {
      const client = new Anthropic({ apiKey });
      const systemPrompt = getSystemPrompt();

      console.log(`\nEvaluating ${flowGroups.length} flows`);
      console.log(`Model: ${MODEL}, Concurrency: ${CONCURRENCY}\n`);

      // Evaluate each flow
      let completed = 0;
      const tasks = flowGroups.map(
        (flowScreens) => async (): Promise<FlowResult> => {
          const num = ++completed;
          console.log(
            `[${num}/${flowGroups.length}] Auditing "${flowScreens.flow.name}" (${flowScreens.screens.length} screens)...`
          );
          const evaluation = await withRetry(
            () => evaluateFlow(client, systemPrompt, flowScreens),
            flowScreens.flow.name,
          );
          return { flow: flowScreens.flow, screens: flowScreens.screens, evaluation };
        }
      );

      const results = await runWithConcurrency(tasks, CONCURRENCY);
      console.log(`\nAll ${results.length} flow evaluations complete.`);

      const scores = computeFlowScores(results);

      console.log("Generating strategic summary (Part A)...");
      const strategicSummary = await withRetry(
        () => generateStrategicSummary(client, results, scores),
        "Strategic Summary",
      );

      console.log("Generating cross-product state audit + component rules (Part C)...");
      const stateAuditAndRules = await withRetry(
        () => generateCrossProductStateAudit(client, results),
        "State Audit & Rules",
      );

      report = generateAIReport(results, scores, strategicSummary, stateAuditAndRules);

      // Write machine-readable scores
      fs.writeFileSync(
        SCORES_FILE,
        JSON.stringify({
          timestamp: new Date().toISOString(),
          model: MODEL,
          flows: scores,
          riskDistribution: (() => {
            const dist: Record<string, number> = {};
            for (const r of results) {
              for (const t of r.evaluation.topRedesignTargets) {
                dist[t.riskType] = (dist[t.riskType] ?? 0) + 1;
              }
            }
            return dist;
          })(),
        }, null, 2),
        "utf-8"
      );
      console.log(`Scores written to ${SCORES_FILE}`);
    } catch (aiError: unknown) {
      const msg = aiError instanceof Error ? aiError.message : String(aiError);
      console.error(`\nAI evaluation failed: ${msg}`);
      console.error("Falling back to scaffold report.\n");
      report = generateScaffoldReport(flowGroups);
    }
  } else {
    report = generateScaffoldReport(flowGroups);
  }

  const outputDir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  fs.writeFileSync(OUTPUT_FILE, report, "utf-8");
  console.log(`\nReport written to ${OUTPUT_FILE}`);
}

main().catch((error) => {
  console.error("Fatal error:", error.message ?? error);
  process.exit(1);
});
