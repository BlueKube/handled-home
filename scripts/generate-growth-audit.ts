/**
 * Business Model Growth Audit Report Generator
 *
 * Evaluates every screenshot through a growth strategist lens,
 * producing a Business Model Health Report that identifies:
 * - Viral loop strengths and gaps
 * - Missing growth surfaces
 * - Network effect signals
 * - Platform lock-in / switching cost analysis
 *
 * Usage:
 *   ANTHROPIC_API_KEY=sk-... npx tsx scripts/generate-growth-audit.ts
 *   npx tsx scripts/generate-growth-audit.ts --dry-run
 *
 * Environment:
 *   ANTHROPIC_API_KEY  — Required (falls back to scaffold mode)
 *   UX_CONCURRENCY     — Max parallel API calls (default: 3)
 *   UX_MODEL           — Claude model (default: claude-sonnet-4-20250514)
 */

import Anthropic from "@anthropic-ai/sdk";
import fs from "fs";
import path from "path";

const MILESTONES_DIR = path.resolve("test-results/milestones");
const MANIFEST_FILE = path.join(MILESTONES_DIR, "manifest.json");
const SYSTEM_PROMPT_FILE = path.resolve("e2e/prompts/growth-audit-system.md");
const OUTPUT_FILE = path.resolve("test-results/growth-audit-report.md");
const SCORES_FILE = path.resolve("test-results/growth-audit-scores.json");

const DRY_RUN = process.argv.includes("--dry-run");
const CONCURRENCY = parseInt(process.env.UX_CONCURRENCY ?? "3", 10);
const MODEL = process.env.UX_MODEL ?? "claude-sonnet-4-20250514";
const MAX_RETRIES = parseInt(process.env.UX_MAX_RETRIES ?? "5", 10);

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
  role?: string; // customer | provider | admin | public
}

interface GrowthEvaluation {
  viralTrigger: number;
  viralTriggerNotes: string;
  valueClarity: number;
  valueClarityNotes: string;
  networkEffectSignal: number;
  networkEffectNotes: string;
  providerMotivation: number;
  providerMotivationNotes: string;
  switchingCost: number;
  switchingCostNotes: string;
  monopolyMoat: string;
  missingGrowthSurface: string;
  topGrowthFix: string;
}

interface EvaluationResult {
  screen: ScreenInfo;
  evaluation: GrowthEvaluation;
}

interface GrowthScores {
  screen: string;
  role: string;
  viralTrigger: number;
  valueClarity: number;
  networkEffectSignal: number;
  providerMotivation: number;
  switchingCost: number;
  growthScore: number; // composite
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

function inferRole(filename: string, route?: string): string {
  if (filename.startsWith("customer-") || route?.startsWith("/customer")) return "customer";
  if (filename.startsWith("provider-") || route?.startsWith("/provider")) return "provider";
  if (filename.startsWith("admin-") || route?.startsWith("/admin")) return "admin";
  if (filename.startsWith("public-") || filename.startsWith("byoc-")) return "public";
  return "unknown";
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
      const role = inferRole(f, meta?.route);
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
        role,
      };
    });
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

      // Parse retry-after header if available, otherwise use exponential backoff
      let waitMs: number;
      const retryAfter = (error as { headers?: { "retry-after"?: string } })
        .headers?.["retry-after"];
      if (retryAfter) {
        waitMs = (parseFloat(retryAfter) + 1) * 1000;
      } else {
        waitMs = Math.min(2000 * Math.pow(2, attempt), 120000);
      }

      console.log(
        `  ⏳ Rate limited on "${label}" (attempt ${attempt + 1}/${MAX_RETRIES}), waiting ${Math.round(waitMs / 1000)}s...`
      );
      await sleep(waitMs);
    }
  }
  throw new Error("Unreachable");
}

// ── AI Evaluation ──

const GROWTH_SCHEMA = {
  type: "object" as const,
  properties: {
    viralTrigger: { type: "number" as const, description: "Score 1-10" },
    viralTriggerNotes: { type: "string" as const },
    valueClarity: { type: "number" as const, description: "Score 1-10" },
    valueClarityNotes: { type: "string" as const },
    networkEffectSignal: { type: "number" as const, description: "Score 1-10" },
    networkEffectNotes: { type: "string" as const },
    providerMotivation: { type: "number" as const, description: "Score 1-10" },
    providerMotivationNotes: { type: "string" as const },
    switchingCost: { type: "number" as const, description: "Score 1-10" },
    switchingCostNotes: { type: "string" as const },
    monopolyMoat: { type: "string" as const },
    missingGrowthSurface: { type: "string" as const },
    topGrowthFix: { type: "string" as const },
  },
  required: [
    "viralTrigger", "viralTriggerNotes",
    "valueClarity", "valueClarityNotes",
    "networkEffectSignal", "networkEffectNotes",
    "providerMotivation", "providerMotivationNotes",
    "switchingCost", "switchingCostNotes",
    "monopolyMoat", "missingGrowthSurface", "topGrowthFix",
  ],
};

async function evaluateScreen(
  client: Anthropic,
  systemPrompt: string,
  screen: ScreenInfo,
): Promise<GrowthEvaluation> {
  const imageData = fs.readFileSync(screen.filepath);
  const base64Image = imageData.toString("base64");

  const contextLines: string[] = [`Screen: "${screen.label}"`];
  if (screen.role) contextLines.push(`Role: ${screen.role}`);
  if (screen.flow) contextLines.push(`Flow: ${screen.flow}`);
  if (screen.route) contextLines.push(`Route: ${screen.route.replace(/\/[a-f0-9-]{20,}/g, "/:token")}`);
  if (screen.userGoal) contextLines.push(`User goal: ${screen.userGoal}`);
  if (screen.screenType) contextLines.push(`Screen type: ${screen.screenType}`);

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1200,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `${contextLines.join("\n")}\n\nAnalyze this screenshot and respond with a JSON object matching this schema. Do not include any text outside the JSON.\n\n${JSON.stringify(GROWTH_SCHEMA, null, 2)}`,
          },
          {
            type: "image",
            source: {
              type: "base64",
              media_type: "image/png",
              data: base64Image,
            },
          },
        ],
      },
    ],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") throw new Error("No text response");

  let jsonText = textBlock.text.trim();
  const jsonMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) jsonText = jsonMatch[1].trim();

  return JSON.parse(jsonText) as GrowthEvaluation;
}

// ── Summary Generation ──

async function generateExecutiveSummary(
  client: Anthropic,
  results: EvaluationResult[],
  scoresByRole: Map<string, GrowthScores[]>,
): Promise<string> {
  const summaryData = results.map((r) => ({
    screen: r.screen.label,
    role: r.screen.role,
    viralTrigger: r.evaluation.viralTrigger,
    valueClarity: r.evaluation.valueClarity,
    networkEffect: r.evaluation.networkEffectSignal,
    providerMotivation: r.evaluation.providerMotivation,
    switchingCost: r.evaluation.switchingCost,
    missingGrowth: r.evaluation.missingGrowthSurface,
    topFix: r.evaluation.topGrowthFix,
  }));

  const roleAverages: Record<string, Record<string, number>> = {};
  for (const [role, scores] of scoresByRole.entries()) {
    roleAverages[role] = {
      viralTrigger: avg(scores.map((s) => s.viralTrigger)),
      valueClarity: avg(scores.map((s) => s.valueClarity)),
      networkEffect: avg(scores.map((s) => s.networkEffectSignal)),
      providerMotivation: avg(scores.map((s) => s.providerMotivation)),
      switchingCost: avg(scores.map((s) => s.switchingCost)),
    };
  }

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 2000,
    messages: [
      {
        role: "user",
        content: `You are a growth strategist auditing a two-sided home-services marketplace called Handled Home.

Below are growth audit results from ${results.length} screens across customer, provider, and admin views.

The business model depends on:
1. Providers bringing their existing customers via BYOC invite links
2. Customers adding more services (cross-sell)
3. Referral loops bringing new customers
4. Network effects making the platform indispensable

Produce an executive summary in this exact markdown format:

## Executive Summary

[2-3 sentences on overall growth health of the platform]

### Viral Loop Health

| Loop | Entry Point | Conversion Screen | Friction Level | Verdict |
|------|------------|-------------------|----------------|---------|
| BYOC | [screen] | [screen] | [high/medium/low] | [working/needs-work/broken] |
| Customer Referral | [screen] | [screen] | [high/medium/low] | [working/needs-work/broken] |
| Provider Referral | [screen] | [screen] | [high/medium/low] | [working/needs-work/broken] |

### Role Parity

| Dimension | Customer | Provider | Gap |
|-----------|----------|----------|-----|
| Value Clarity | [score] | [score] | [analysis] |
| Platform Lock-in | [score] | [score] | [analysis] |
| Growth Contribution | [score] | [score] | [analysis] |

### Missing Growth Surfaces (Top 5)

1. [Screen + what should exist there]
2. ...

### Top 10 Growth Fixes (Priority Order)

1. [Specific, actionable fix with expected impact]
2. ...

### Monopoly Moat Assessment

[3-4 sentences on whether the platform creates genuine lock-in and how to strengthen it]

Role averages:
${JSON.stringify(roleAverages, null, 2)}

Screen-level data:
${JSON.stringify(summaryData, null, 2)}`,
      },
    ],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") throw new Error("No summary response");
  return textBlock.text.trim();
}

// ── Report Formatting ──

function avg(nums: number[]): number {
  if (nums.length === 0) return 0;
  return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10;
}

function computeGrowthScores(results: EvaluationResult[]): GrowthScores[] {
  return results
    .map((r) => {
      const e = r.evaluation;
      const composite =
        (e.viralTrigger + e.valueClarity + e.networkEffectSignal +
          e.providerMotivation + e.switchingCost) / 5;
      return {
        screen: r.screen.label,
        role: r.screen.role ?? "unknown",
        viralTrigger: e.viralTrigger,
        valueClarity: e.valueClarity,
        networkEffectSignal: e.networkEffectSignal,
        providerMotivation: e.providerMotivation,
        switchingCost: e.switchingCost,
        growthScore: Math.round(composite * 10) / 10,
      };
    })
    .sort((a, b) => a.growthScore - b.growthScore); // weakest first
}

function generateAIReport(
  results: EvaluationResult[],
  growthScores: GrowthScores[],
  executiveSummary: string,
): string {
  const lines: string[] = [];

  lines.push("# Business Model Growth Audit Report");
  lines.push("");
  lines.push(`**Generated**: ${new Date().toISOString()}`);
  lines.push(`**Model**: ${MODEL}`);
  lines.push(`**Screens evaluated**: ${results.length}`);
  const roles = [...new Set(results.map((r) => r.screen.role))];
  lines.push(`**Roles covered**: ${roles.join(", ")}`);
  lines.push("");
  lines.push("---");
  lines.push("");

  // Executive summary
  lines.push(executiveSummary);
  lines.push("");
  lines.push("---");
  lines.push("");

  // Growth scorecard
  lines.push("## Growth Scorecard — All Screens");
  lines.push("");
  lines.push("_Sorted by composite growth score (lowest first — screens with weakest growth contribution)._");
  lines.push("");
  lines.push("| Rank | Screen | Role | Viral | Value | Network | Provider | Lock-in | Composite |");
  lines.push("|------|--------|------|-------|-------|---------|----------|---------|-----------|");
  growthScores.forEach((s, i) => {
    lines.push(
      `| ${i + 1} | ${s.screen} | ${s.role} | ${s.viralTrigger} | ${s.valueClarity} | ${s.networkEffectSignal} | ${s.providerMotivation} | ${s.switchingCost} | **${s.growthScore}** |`
    );
  });
  lines.push("");
  lines.push("---");
  lines.push("");

  // Per-role breakdown
  for (const role of roles) {
    const roleResults = results.filter((r) => r.screen.role === role);
    if (roleResults.length === 0) continue;

    lines.push(`## ${role.charAt(0).toUpperCase() + role.slice(1)} Screens`);
    lines.push("");

    for (const r of roleResults) {
      const e = r.evaluation;
      lines.push(`### ${r.screen.label}`);
      if (r.screen.route) lines.push(`**Route**: ${r.screen.route.replace(/\/[a-f0-9-]{20,}/g, "/:token")}`);
      if (r.screen.userGoal) lines.push(`**User goal**: ${r.screen.userGoal}`);
      lines.push("");

      lines.push("| Dimension | Score | Notes |");
      lines.push("|-----------|-------|-------|");
      lines.push(`| Viral Trigger | ${e.viralTrigger}/10 | ${e.viralTriggerNotes} |`);
      lines.push(`| Value Clarity | ${e.valueClarity}/10 | ${e.valueClarityNotes} |`);
      lines.push(`| Network Effect | ${e.networkEffectSignal}/10 | ${e.networkEffectNotes} |`);
      lines.push(`| Provider Motivation | ${e.providerMotivation}/10 | ${e.providerMotivationNotes} |`);
      lines.push(`| Switching Cost | ${e.switchingCost}/10 | ${e.switchingCostNotes} |`);
      lines.push("");
      lines.push(`**Monopoly moat**: ${e.monopolyMoat}`);
      lines.push("");
      lines.push(`**Missing growth surface**: ${e.missingGrowthSurface}`);
      lines.push("");
      lines.push(`**Top growth fix**: ${e.topGrowthFix}`);
      lines.push("");
    }

    lines.push("---");
    lines.push("");
  }

  lines.push("_This report was generated by AI growth audit using Claude._");
  return lines.join("\n");
}

function generateScaffoldReport(screenshots: ScreenInfo[]): string {
  const lines: string[] = [];
  lines.push("# Business Model Growth Audit Report");
  lines.push("");
  lines.push(`**Generated**: ${new Date().toISOString()}`);
  lines.push(`**Mode**: Scaffold (dry run)`);
  lines.push(`**Screens found**: ${screenshots.length}`);
  lines.push("");

  if (screenshots.length === 0) {
    lines.push("> No screenshots found. Run `npm run test:catalog` first.");
    return lines.join("\n");
  }

  lines.push("## Screens to Audit");
  lines.push("");
  lines.push("| Screen | Role | Flow | User Goal |");
  lines.push("|--------|------|------|-----------|");
  for (const s of screenshots) {
    lines.push(`| ${s.label} | ${s.role ?? "?"} | ${s.flow ?? "?"} | ${s.userGoal ?? "_pending_"} |`);
  }
  lines.push("");
  lines.push("_Set ANTHROPIC_API_KEY to run the full growth audit._");
  return lines.join("\n");
}

// ── Main ──

async function main() {
  const screenshots = getScreenshots();
  console.log(`Found ${screenshots.length} screenshots`);

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
    const client = new Anthropic({ apiKey });
    const systemPrompt = getSystemPrompt();

    console.log(`\nRunning ${screenshots.length} growth evaluations`);
    console.log(`Model: ${MODEL}, Concurrency: ${CONCURRENCY}\n`);

    let completed = 0;
    const tasks = screenshots.map(
      (screen) => async (): Promise<EvaluationResult> => {
        const num = ++completed;
        console.log(`[${num}/${screenshots.length}] Auditing "${screen.label}" (${screen.role})...`);
        const evaluation = await withRetry(
          () => evaluateScreen(client, systemPrompt, screen),
          screen.label,
        );
        return { screen, evaluation };
      }
    );

    const results = await runWithConcurrency(tasks, CONCURRENCY);

    console.log(`\nAll ${results.length} evaluations complete.`);

    const growthScores = computeGrowthScores(results);

    // Group by role for summary
    const scoresByRole = new Map<string, GrowthScores[]>();
    for (const s of growthScores) {
      if (!scoresByRole.has(s.role)) scoresByRole.set(s.role, []);
      scoresByRole.get(s.role)!.push(s);
    }

    console.log("Generating executive summary...");
    const executiveSummary = await withRetry(
      () => generateExecutiveSummary(client, results, scoresByRole),
      "Executive Summary",
    );

    report = generateAIReport(results, growthScores, executiveSummary);

    // Write machine-readable scores
    fs.writeFileSync(
      SCORES_FILE,
      JSON.stringify({ timestamp: new Date().toISOString(), model: MODEL, scores: growthScores }, null, 2),
      "utf-8"
    );
    console.log(`Growth scores written to ${SCORES_FILE}`);
  } else {
    report = generateScaffoldReport(screenshots);
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
