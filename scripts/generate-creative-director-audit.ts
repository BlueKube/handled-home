/**
 * Creative Director UI/UX Audit Report Generator
 *
 * Evaluates screenshots grouped by user flows (not individual screens).
 * Produces a structured 4-part audit document:
 *   Part A — Strategic Audit (cross-flow insights)
 *   Part B — Flow-by-Flow Redesign Spec
 *   Part C — Global Pattern Rules
 *   Part D — Priority Roadmap
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

// ── Flow Definitions ──
// Maps screenshot filename prefixes to the 8 audit flows recommended by the
// design review framework. Flows are evaluated in priority order.

interface FlowDefinition {
  id: string;
  name: string;
  description: string;
  /** What the user is trying to accomplish in this flow */
  userJourney: string;
  /** Screenshot filename prefixes that belong to this flow */
  prefixes: string[];
  /** Review priority (1 = highest) */
  priority: number;
}

const AUDIT_FLOWS: FlowDefinition[] = [
  {
    id: "customer-onboarding",
    name: "Customer Onboarding",
    description: "First-time customer experience from BYOC invite link through property setup",
    userJourney: "Customer receives invite link from provider → lands on BYOC page → signs up → enters property details → sees dashboard for first time",
    prefixes: ["byoc-", "customer-property", "customer-coverage-map", "customer-property-sizing"],
    priority: 1,
  },
  {
    id: "plans-subscribe-routine",
    name: "Plans / Subscribe / Routine",
    description: "Service selection, subscription, and routine configuration",
    userJourney: "Customer browses plans → selects a plan → configures service routine (SKUs + cadences) → reviews schedule → confirms subscription",
    prefixes: ["customer-plans", "customer-subscription", "customer-routine", "customer-services"],
    priority: 2,
  },
  {
    id: "customer-dashboard-receipts",
    name: "Customer Dashboard / Receipts / Issues",
    description: "Day-to-day customer experience: dashboard, visit history, billing, support",
    userJourney: "Customer opens app → checks dashboard → views upcoming visits → reviews past visits with photos → manages billing → reports issues if needed",
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
    prefixes: ["provider-apply", "provider-organization", "provider-work-setup"],
    priority: 4,
  },
  {
    id: "provider-jobs",
    name: "Provider Day-of-Work / Job Execution",
    description: "Provider daily workflow: jobs, earnings, payouts, quality",
    userJourney: "Provider opens app → sees today's jobs → views job details → completes checklist → uploads photos → submits completion → checks earnings",
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

interface RedesignTarget {
  screen: string;
  problem: string;
  recommendation: string;
  priority: string;
  impact: string;
}

interface CopyRecommendation {
  screen: string;
  current: string;
  recommended: string;
  reason: string;
}

interface PatternViolation {
  rule: string;
  screen: string;
  detail: string;
}

interface FlowEvaluation {
  flowSummary: string;
  overallGrade: string;
  strengthsTopThree: string[];
  frictionScore: number;
  frictionFindings: string[];
  trustScore: number;
  trustFindings: string[];
  storytellingScore: number;
  storytellingFindings: string[];
  hierarchyScore: number;
  hierarchyFindings: string[];
  consistencyScore: number;
  consistencyFindings: string[];
  conversionScore: number;
  conversionFindings: string[];
  stateHandlingScore: number;
  stateHandlingFindings: string[];
  missingScreens: string[];
  unnecessaryScreens: string[];
  topRedesignTargets: RedesignTarget[];
  copyRecommendations: CopyRecommendation[];
  patternViolations: PatternViolation[];
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

  // Collect any screenshots not assigned to a flow
  const unassigned = screenshots.filter((s) => !assigned.has(s.filename));
  if (unassigned.length > 0) {
    result.push({
      flow: {
        id: "uncategorized",
        name: "Other Screens",
        description: "Screens not assigned to a primary audit flow",
        userJourney: "Various utility and settings screens",
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

const FLOW_EVAL_SCHEMA = {
  type: "object" as const,
  properties: {
    flowSummary: { type: "string" as const },
    overallGrade: { type: "string" as const, description: "A/B/C/D/F" },
    strengthsTopThree: { type: "array" as const, items: { type: "string" as const } },
    frictionScore: { type: "number" as const, description: "1-10" },
    frictionFindings: { type: "array" as const, items: { type: "string" as const } },
    trustScore: { type: "number" as const, description: "1-10" },
    trustFindings: { type: "array" as const, items: { type: "string" as const } },
    storytellingScore: { type: "number" as const, description: "1-10" },
    storytellingFindings: { type: "array" as const, items: { type: "string" as const } },
    hierarchyScore: { type: "number" as const, description: "1-10" },
    hierarchyFindings: { type: "array" as const, items: { type: "string" as const } },
    consistencyScore: { type: "number" as const, description: "1-10" },
    consistencyFindings: { type: "array" as const, items: { type: "string" as const } },
    conversionScore: { type: "number" as const, description: "1-10" },
    conversionFindings: { type: "array" as const, items: { type: "string" as const } },
    stateHandlingScore: { type: "number" as const, description: "1-10" },
    stateHandlingFindings: { type: "array" as const, items: { type: "string" as const } },
    missingScreens: { type: "array" as const, items: { type: "string" as const } },
    unnecessaryScreens: { type: "array" as const, items: { type: "string" as const } },
    topRedesignTargets: {
      type: "array" as const,
      items: {
        type: "object" as const,
        properties: {
          screen: { type: "string" as const },
          problem: { type: "string" as const },
          recommendation: { type: "string" as const },
          priority: { type: "string" as const, description: "now | soon | later" },
          impact: { type: "string" as const, description: "high | medium | low" },
        },
      },
    },
    copyRecommendations: {
      type: "array" as const,
      items: {
        type: "object" as const,
        properties: {
          screen: { type: "string" as const },
          current: { type: "string" as const },
          recommended: { type: "string" as const },
          reason: { type: "string" as const },
        },
      },
    },
    patternViolations: {
      type: "array" as const,
      items: {
        type: "object" as const,
        properties: {
          rule: { type: "string" as const },
          screen: { type: "string" as const },
          detail: { type: "string" as const },
        },
      },
    },
  },
  required: [
    "flowSummary", "overallGrade", "strengthsTopThree",
    "frictionScore", "frictionFindings", "trustScore", "trustFindings",
    "storytellingScore", "storytellingFindings", "hierarchyScore", "hierarchyFindings",
    "consistencyScore", "consistencyFindings", "conversionScore", "conversionFindings",
    "stateHandlingScore", "stateHandlingFindings",
    "missingScreens", "unnecessaryScreens",
    "topRedesignTargets", "copyRecommendations", "patternViolations",
  ],
};

async function evaluateFlow(
  client: Anthropic,
  systemPrompt: string,
  flowScreens: FlowScreens,
): Promise<FlowEvaluation> {
  const { flow, screens } = flowScreens;

  // Build screen context
  const screenList = screens
    .map((s, i) => {
      const parts = [`Screen ${i + 1}: "${s.label}"`];
      if (s.route) parts.push(`Route: ${s.route.replace(/\/[a-f0-9-]{20,}/g, "/:token")}`);
      if (s.userGoal) parts.push(`User goal: ${s.userGoal}`);
      if (s.screenType) parts.push(`Type: ${s.screenType}`);
      return parts.join(" | ");
    })
    .join("\n");

  // Build message content with all screenshots
  const content: Anthropic.Messages.ContentBlockParam[] = [
    {
      type: "text",
      text: `## Flow: ${flow.name}

${flow.description}

**User Journey**: ${flow.userJourney}

**Screens in this flow** (${screens.length} total):
${screenList}

Analyze ALL ${screens.length} screenshots below as a complete flow. Evaluate the journey holistically — how screens connect, whether momentum is maintained, where users would drop off.

Respond with a JSON object matching this schema. Do not include any text outside the JSON.

${JSON.stringify(FLOW_EVAL_SCHEMA, null, 2)}`,
    },
  ];

  // Add all screenshots as images
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
    max_tokens: 4096,
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
  const flowData = results.map((r) => ({
    flow: r.flow.name,
    grade: r.evaluation.overallGrade,
    screens: r.screens.length,
    strengths: r.evaluation.strengthsTopThree,
    friction: r.evaluation.frictionScore,
    trust: r.evaluation.trustScore,
    storytelling: r.evaluation.storytellingScore,
    hierarchy: r.evaluation.hierarchyScore,
    consistency: r.evaluation.consistencyScore,
    conversion: r.evaluation.conversionScore,
    stateHandling: r.evaluation.stateHandlingScore,
    topRedesigns: r.evaluation.topRedesignTargets.slice(0, 3),
    patternViolations: r.evaluation.patternViolations.length,
    missingScreens: r.evaluation.missingScreens,
  }));

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 3000,
    messages: [
      {
        role: "user",
        content: `You are a creative director writing the executive summary of a UI/UX audit for Handled Home, a mobile home-services marketplace.

Below are flow-by-flow audit results across ${results.length} user journeys.

The product rules are: mobile-only, calm/competent/kind voice, one clear primary CTA, no calendar creep, no marketplace feel, consistent proof/status UI, screens explain what happens next, accessible and non-blaming.

Produce the strategic audit summary in this exact markdown format:

## Executive Summary

[3-4 sentences on overall design health]

### Biggest Cross-Product UX Problems

1. [Problem + which flows it affects + severity]
2. [Problem + which flows it affects + severity]
3. [Problem + which flows it affects + severity]
4. [Problem + which flows it affects + severity]
5. [Problem + which flows it affects + severity]

### Trust & Friction Assessment

| Flow | Grade | Friction | Trust | Storytelling | Consistency |
|------|-------|----------|-------|-------------|-------------|
${scores.map((s) => `| ${s.flowName} | ${s.grade} | ${s.friction}/10 | ${s.trust}/10 | ${s.storytelling}/10 | ${s.consistency}/10 |`).join("\n")}

### Design System Drift

[2-3 sentences identifying where the design system is inconsistent and which flows show the most drift]

### Top Conversion Blockers

1. [Blocker + flow + estimated impact]
2. [Blocker + flow + estimated impact]
3. [Blocker + flow + estimated impact]

### Top Retention Blockers

1. [Blocker + flow + estimated impact]
2. [Blocker + flow + estimated impact]
3. [Blocker + flow + estimated impact]

### Ops/Support Burden Risks

[2-3 items where UI gaps will generate support tickets]

Flow audit data:
${JSON.stringify(flowData, null, 2)}`,
      },
    ],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") throw new Error("No summary response");
  return textBlock.text.trim();
}

// ── Global Pattern Rules (Part C) ──

async function generatePatternRules(
  client: Anthropic,
  results: FlowResult[],
): Promise<string> {
  const allViolations = results.flatMap((r) =>
    r.evaluation.patternViolations.map((v) => ({ ...v, flow: r.flow.name }))
  );
  const allStateFindings = results.flatMap((r) =>
    r.evaluation.stateHandlingFindings.map((f) => ({ finding: f, flow: r.flow.name }))
  );
  const allHierarchyFindings = results.flatMap((r) =>
    r.evaluation.hierarchyFindings.map((f) => ({ finding: f, flow: r.flow.name }))
  );

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 2500,
    messages: [
      {
        role: "user",
        content: `You are a creative director codifying global pattern rules for a mobile home-services app. Based on the audit findings below, produce pattern standards in this exact markdown format:

## Part C — Global Pattern Rules

### Loading State Standards
[2-3 rules for how loading states should behave across all flows]

### Error State Standards
[2-3 rules for error presentation — must be accessible and non-blaming per product rules]

### Empty State Standards
[2-3 rules for empty/zero-data states]

### CTA Hierarchy Rules
[3-4 rules for primary/secondary/tertiary action button usage]

### Form Simplification Rules
[2-3 rules for form design — mobile-first, thumb-zone, minimal fields]

### Progress Indicator Rules
[2-3 rules for multi-step flows]

### Card & List Pattern Rules
[2-3 rules for card-based UI consistency]

### Dashboard Scanning Rules
[2-3 rules for dashboard/overview screens — especially admin]

Each rule should be specific, testable, and actionable (not vague). Reference the product rules: mobile-only, calm/competent/kind voice, one CTA, no marketplace feel.

Pattern violations found:
${JSON.stringify(allViolations, null, 2)}

State handling findings:
${JSON.stringify(allStateFindings, null, 2)}

Hierarchy findings:
${JSON.stringify(allHierarchyFindings, null, 2)}`,
      },
    ],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") throw new Error("No pattern rules response");
  return textBlock.text.trim();
}

// ── Scoring ──

function computeFlowScores(results: FlowResult[]): FlowScores[] {
  return results
    .map((r) => {
      const e = r.evaluation;
      // Invert friction (high friction = low score)
      const invertedFriction = 11 - e.frictionScore;
      const composite =
        (invertedFriction + e.trustScore + e.storytellingScore +
          e.hierarchyScore + e.consistencyScore + e.conversionScore +
          e.stateHandlingScore) / 7;
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
        composite: Math.round(composite * 10) / 10,
      };
    })
    .sort((a, b) => a.composite - b.composite); // weakest first
}

// ── Report Formatting ──

function generateAIReport(
  results: FlowResult[],
  scores: FlowScores[],
  strategicSummary: string,
  patternRules: string,
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
    lines.push(`| Friction | ${e.frictionScore}/10 | ${e.frictionFindings[0] ?? "—"} |`);
    lines.push(`| Trust | ${e.trustScore}/10 | ${e.trustFindings[0] ?? "—"} |`);
    lines.push(`| Storytelling | ${e.storytellingScore}/10 | ${e.storytellingFindings[0] ?? "—"} |`);
    lines.push(`| Hierarchy | ${e.hierarchyScore}/10 | ${e.hierarchyFindings[0] ?? "—"} |`);
    lines.push(`| Consistency | ${e.consistencyScore}/10 | ${e.consistencyFindings[0] ?? "—"} |`);
    lines.push(`| Conversion | ${e.conversionScore}/10 | ${e.conversionFindings[0] ?? "—"} |`);
    lines.push(`| State Handling | ${e.stateHandlingScore}/10 | ${e.stateHandlingFindings[0] ?? "—"} |`);
    lines.push("");

    // Missing / unnecessary screens
    if (e.missingScreens.length > 0) {
      lines.push("**Missing screens**: " + e.missingScreens.join("; "));
      lines.push("");
    }
    if (e.unnecessaryScreens.length > 0) {
      lines.push("**Unnecessary screens**: " + e.unnecessaryScreens.join("; "));
      lines.push("");
    }

    // Redesign targets
    if (e.topRedesignTargets.length > 0) {
      lines.push("### Redesign Targets");
      lines.push("");
      lines.push("| Screen | Problem | Recommendation | Priority | Impact |");
      lines.push("|--------|---------|----------------|----------|--------|");
      for (const t of e.topRedesignTargets) {
        lines.push(`| ${t.screen} | ${t.problem} | ${t.recommendation} | ${t.priority} | ${t.impact} |`);
      }
      lines.push("");
    }

    // Copy recommendations
    if (e.copyRecommendations.length > 0) {
      lines.push("### Copy Recommendations");
      lines.push("");
      lines.push("| Screen | Current | Recommended | Reason |");
      lines.push("|--------|---------|-------------|--------|");
      for (const c of e.copyRecommendations) {
        lines.push(`| ${c.screen} | ${c.current} | ${c.recommended} | ${c.reason} |`);
      }
      lines.push("");
    }

    // Pattern violations
    if (e.patternViolations.length > 0) {
      lines.push("### Product Rule Violations");
      lines.push("");
      for (const v of e.patternViolations) {
        lines.push(`- **${v.rule}** on ${v.screen}: ${v.detail}`);
      }
      lines.push("");
    }

    lines.push("---");
    lines.push("");
  }

  // ── Part C: Global Pattern Rules ──
  lines.push(patternRules);
  lines.push("");
  lines.push("---");
  lines.push("");

  // ── Part D: Priority Roadmap ──
  lines.push("# Part D — Priority Roadmap");
  lines.push("");

  // Collect all redesign targets and sort by priority
  const allTargets = results.flatMap((r) =>
    r.evaluation.topRedesignTargets.map((t) => ({
      ...t,
      flow: r.flow.name,
    }))
  );

  const quickWins = allTargets.filter((t) => t.priority === "now" && t.impact === "high");
  const mediumLift = allTargets.filter(
    (t) => t.priority === "now" && t.impact !== "high" || t.priority === "soon" && t.impact === "high"
  );
  const biggerRedesigns = allTargets.filter(
    (t) => t.priority === "later" || t.priority === "soon" && t.impact !== "high"
  );

  lines.push("## Quick Wins (Now / High Impact)");
  lines.push("");
  if (quickWins.length === 0) {
    lines.push("_No quick wins identified._");
  } else {
    for (let i = 0; i < quickWins.length; i++) {
      const t = quickWins[i];
      lines.push(`${i + 1}. **${t.screen}** (${t.flow}): ${t.recommendation}`);
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
      lines.push(`${i + 1}. **${t.screen}** (${t.flow}): ${t.recommendation}`);
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
      lines.push(`${i + 1}. **${t.screen}** (${t.flow}): ${t.recommendation}`);
    }
  }
  lines.push("");

  // Flow scorecard summary
  lines.push("## Flow Scorecard");
  lines.push("");
  lines.push("| Rank | Flow | Grade | Friction | Trust | Story | Hierarchy | Consistency | Conversion | States | Composite |");
  lines.push("|------|------|-------|----------|-------|-------|-----------|-------------|------------|--------|-----------|");
  scores.forEach((s, i) => {
    lines.push(
      `| ${i + 1} | ${s.flowName} | ${s.grade} | ${s.friction} | ${s.trust} | ${s.storytelling} | ${s.hierarchy} | ${s.consistency} | ${s.conversion} | ${s.stateHandling} | **${s.composite}** |`
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
  lines.push("| Priority | Flow | Screens | Description |");
  lines.push("|----------|------|---------|-------------|");
  for (const g of flowGroups) {
    lines.push(`| ${g.flow.priority} | ${g.flow.name} | ${g.screens.length} | ${g.flow.description} |`);
  }
  lines.push("");

  for (const g of flowGroups) {
    lines.push(`## ${g.flow.priority}. ${g.flow.name}`);
    lines.push("");
    lines.push(`**Journey**: ${g.flow.userJourney}`);
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
    console.log(`  ${g.flow.priority}. ${g.flow.name} (${g.screens.length} screens)`);
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

      console.log("Generating global pattern rules (Part C)...");
      const patternRules = await withRetry(
        () => generatePatternRules(client, results),
        "Pattern Rules",
      );

      report = generateAIReport(results, scores, strategicSummary, patternRules);

      // Write machine-readable scores
      fs.writeFileSync(
        SCORES_FILE,
        JSON.stringify({
          timestamp: new Date().toISOString(),
          model: MODEL,
          flows: scores,
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
