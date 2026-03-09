/**
 * Synthetic UX Review Report Generator — Phase 2.1
 *
 * Reads milestone screenshots from test-results/milestones/
 * and persona prompts from e2e/prompts/personas/, then uses
 * the Anthropic Claude API (vision) to generate persona-based
 * UX evaluations for each screenshot.
 *
 * New in 2.1:
 * - Reads manifest.json for structured screen context (flow, route, user goal)
 * - Enriches evaluation prompts with screen metadata
 * - Adds three scorecards: Screen Risk, Persona Sensitivity, Delta vs Previous
 * - Writes machine-readable ux-review-scores.json for run-over-run comparison
 *
 * Usage:
 *   ANTHROPIC_API_KEY=sk-... npx tsx scripts/generate-synthetic-ux-report.ts
 *   npx tsx scripts/generate-synthetic-ux-report.ts --dry-run
 *
 * Environment:
 *   ANTHROPIC_API_KEY  — Required for AI evaluations (falls back to scaffold mode)
 *   UX_CONCURRENCY     — Max parallel API calls (default: 3)
 *   UX_MODEL           — Claude model to use (default: claude-sonnet-4-20250514)
 */

import Anthropic from "@anthropic-ai/sdk";
import fs from "fs";
import path from "path";

const MILESTONES_DIR = path.resolve("test-results/milestones");
const PERSONAS_DIR = path.resolve("e2e/prompts/personas");
const SYSTEM_PROMPT_FILE = path.resolve("e2e/prompts/ux-review-system.md");
const ROLE_SUFFIX = process.env.UX_ROLE_FILTER
  ? `-${process.env.UX_ROLE_FILTER.replace(/,/g, "-")}`
  : "";
const OUTPUT_FILE = path.resolve(`test-results/ux-review-report${ROLE_SUFFIX}.md`);
const SCORES_FILE = path.resolve(`test-results/ux-review-scores${ROLE_SUFFIX}.json`);
const MANIFEST_FILE = path.join(MILESTONES_DIR, "manifest.json");

const DRY_RUN = process.argv.includes("--dry-run");
const CONCURRENCY = parseInt(process.env.UX_CONCURRENCY ?? "1", 10);
const MODEL = process.env.UX_MODEL ?? "claude-sonnet-4-20250514";
const MAX_RETRIES = parseInt(process.env.UX_MAX_RETRIES ?? "5", 10);
const REQUEST_DELAY_MS = parseInt(process.env.UX_REQUEST_DELAY_MS ?? "15000", 10);
/** Comma-separated prefixes to include, e.g. "customer,byoc" or "admin". Empty = all. */
const ROLE_FILTER = process.env.UX_ROLE_FILTER ?? "";

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
  stepNumber?: number;
  route?: string;
  userGoal?: string;
  screenType?: string;
}

interface PersonaInfo {
  filename: string;
  name: string;
  content: string;
}

interface Evaluation {
  screenPurpose: string;
  firstTap: string;
  confusingElements: string[];
  hesitationTriggers: string[];
  quitTriggers: string[];
  clarity: number;
  trust: number;
  friction: number;
  topImprovement: string;
}

interface EvaluationResult {
  screen: ScreenInfo;
  persona: PersonaInfo;
  evaluation: Evaluation;
}

interface ScreenScores {
  screen: string;
  avgClarity: number;
  avgTrust: number;
  avgFriction: number;
  quitMentions: number;
}

interface PersonaScores {
  persona: string;
  avgClarity: number;
  avgTrust: number;
  avgFriction: number;
  screensFlagged: number;
}

interface ScoresSnapshot {
  timestamp: string;
  model: string;
  screens: ScreenScores[];
  personas: PersonaScores[];
}

// ── Helpers ──

function loadManifest(): Map<string, MilestoneMetadata> {
  const map = new Map<string, MilestoneMetadata>();
  if (!fs.existsSync(MANIFEST_FILE)) {
    return map;
  }
  try {
    const data: MilestoneMetadata[] = JSON.parse(
      fs.readFileSync(MANIFEST_FILE, "utf-8")
    );
    for (const entry of data) {
      map.set(entry.filename, entry);
    }
  } catch {
    // Graceful: if manifest is malformed, proceed without context
  }
  return map;
}

function getScreenshots(): ScreenInfo[] {
  if (!fs.existsSync(MILESTONES_DIR)) {
    console.warn(`No milestones directory found at ${MILESTONES_DIR}`);
    return [];
  }

  const manifest = loadManifest();

  const prefixes = ROLE_FILTER
    ? ROLE_FILTER.split(",").map((p) => p.trim().toLowerCase())
    : [];

  return fs
    .readdirSync(MILESTONES_DIR)
    .filter((f) => f.endsWith(".png"))
    .filter((f) => prefixes.length === 0 || prefixes.some((p) => f.startsWith(p)))
    .sort()
    .map((f) => {
      const meta = manifest.get(f);
      return {
        filename: f,
        filepath: path.join(MILESTONES_DIR, f),
        label: f
          .replace(".png", "")
          .replace(/^byoc-\d+-/, "")
          .replace(/-/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase()),
        flow: meta?.flow,
        step: meta?.step,
        stepNumber: meta?.stepNumber,
        route: meta?.route,
        userGoal: meta?.userGoal,
        screenType: meta?.screenType,
      };
    });
}

function getPersonas(): PersonaInfo[] {
  if (!fs.existsSync(PERSONAS_DIR)) {
    console.warn(`No personas directory found at ${PERSONAS_DIR}`);
    return [];
  }
  return fs
    .readdirSync(PERSONAS_DIR)
    .filter((f) => f.endsWith(".md"))
    .sort()
    .map((f) => {
      const content = fs.readFileSync(path.join(PERSONAS_DIR, f), "utf-8");
      const nameMatch = content.match(/^# Persona: (.+)$/m);
      return {
        filename: f,
        name: nameMatch?.[1] ?? f.replace(".md", ""),
        content,
      };
    });
}

function getSystemPrompt(): string {
  if (!fs.existsSync(SYSTEM_PROMPT_FILE)) {
    throw new Error(`System prompt not found: ${SYSTEM_PROMPT_FILE}`);
  }
  return fs.readFileSync(SYSTEM_PROMPT_FILE, "utf-8");
}

function loadPreviousScores(): ScoresSnapshot | null {
  if (!fs.existsSync(SCORES_FILE)) {
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(SCORES_FILE, "utf-8"));
  } catch {
    return null;
  }
}

// ── Concurrency control ──

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

  const workers = Array.from(
    { length: Math.min(concurrency, tasks.length) },
    () => worker()
  );
  await Promise.all(workers);
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

const EVALUATION_SCHEMA = {
  type: "object" as const,
  properties: {
    screenPurpose: {
      type: "string" as const,
      description: "One sentence describing what this screen is for",
    },
    firstTap: {
      type: "string" as const,
      description: "What the user would tap first",
    },
    confusingElements: {
      type: "array" as const,
      items: { type: "string" as const },
      description: "List of confusing or unclear elements",
    },
    hesitationTriggers: {
      type: "array" as const,
      items: { type: "string" as const },
      description: "List of things that make the user hesitate",
    },
    quitTriggers: {
      type: "array" as const,
      items: { type: "string" as const },
      description: "List of things that would make the user quit",
    },
    clarity: {
      type: "number" as const,
      description: "Clarity score 1-10: how obvious is the purpose and next action",
    },
    trust: {
      type: "number" as const,
      description: "Trust score 1-10: how confident does the user feel",
    },
    friction: {
      type: "number" as const,
      description:
        "Friction score 1-10: how much effort/annoyance (1=none, 10=max)",
    },
    topImprovement: {
      type: "string" as const,
      description: "One actionable improvement suggestion",
    },
  },
  required: [
    "screenPurpose",
    "firstTap",
    "confusingElements",
    "hesitationTriggers",
    "quitTriggers",
    "clarity",
    "trust",
    "friction",
    "topImprovement",
  ],
};

function buildScreenContext(screen: ScreenInfo, totalScreens: number): string {
  const lines: string[] = [`Screen name: "${screen.label}"`];

  if (screen.flow) {
    const flowLabel = screen.flow
      .replace(/-/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
    lines.push(`Flow: ${flowLabel}`);
  }
  if (screen.stepNumber !== undefined) {
    lines.push(`Step ${screen.stepNumber} of ${totalScreens}`);
  }
  if (screen.route) {
    // Strip query params and tokens for privacy
    const route = screen.route.replace(/\/[a-f0-9-]{20,}/g, "/:token");
    lines.push(`Route: ${route}`);
  }
  if (screen.userGoal) {
    lines.push(`User's goal at this step: ${screen.userGoal}`);
  }
  if (screen.screenType) {
    lines.push(`Screen type: ${screen.screenType}`);
  }

  return lines.join("\n");
}

async function evaluateScreen(
  client: Anthropic,
  systemPrompt: string,
  screen: ScreenInfo,
  persona: PersonaInfo,
  totalScreens: number
): Promise<Evaluation> {
  const imageData = fs.readFileSync(screen.filepath);
  const base64Image = imageData.toString("base64");

  const screenContext = buildScreenContext(screen, totalScreens);

  const response = await withRetry(
    () =>
      client.messages.create({
        model: MODEL,
        max_tokens: 1024,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `You are evaluating this screen as the following persona:\n\n${persona.content}\n\n${screenContext}\n\nAnalyze this screenshot and respond with a JSON object matching this schema. Do not include any text outside the JSON.\n\n${JSON.stringify(EVALUATION_SCHEMA, null, 2)}`,
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
      }),
    `${screen.label} / ${persona.name}`
  );

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text response from Claude");
  }

  // Extract JSON from the response (handle potential markdown code blocks)
  let jsonText = textBlock.text.trim();
  const jsonMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonText = jsonMatch[1].trim();
  }

  return JSON.parse(jsonText) as Evaluation;
}

// ── Scorecards ──

function computeScreenScores(results: EvaluationResult[]): ScreenScores[] {
  const byScreen = new Map<string, EvaluationResult[]>();
  for (const r of results) {
    const key = r.screen.filename;
    if (!byScreen.has(key)) byScreen.set(key, []);
    byScreen.get(key)!.push(r);
  }

  return Array.from(byScreen.entries())
    .map(([, screenResults]) => {
      const evals = screenResults.map((r) => r.evaluation);
      const quitMentions = evals.reduce(
        (sum, e) => sum + e.quitTriggers.length,
        0
      );
      return {
        screen: screenResults[0].screen.label,
        avgClarity: avg(evals.map((e) => e.clarity)),
        avgTrust: avg(evals.map((e) => e.trust)),
        avgFriction: avg(evals.map((e) => e.friction)),
        quitMentions,
      };
    })
    .sort((a, b) => a.avgClarity - b.avgClarity); // worst clarity first
}

function computePersonaScores(results: EvaluationResult[]): PersonaScores[] {
  const byPersona = new Map<string, EvaluationResult[]>();
  for (const r of results) {
    const key = r.persona.filename;
    if (!byPersona.has(key)) byPersona.set(key, []);
    byPersona.get(key)!.push(r);
  }

  return Array.from(byPersona.entries())
    .map(([, personaResults]) => {
      const evals = personaResults.map((r) => r.evaluation);
      // Count screens where friction > 6 or clarity < 5
      const flagged = evals.filter(
        (e) => e.friction > 6 || e.clarity < 5
      ).length;
      return {
        persona: personaResults[0].persona.name,
        avgClarity: avg(evals.map((e) => e.clarity)),
        avgTrust: avg(evals.map((e) => e.trust)),
        avgFriction: avg(evals.map((e) => e.friction)),
        screensFlagged: flagged,
      };
    })
    .sort((a, b) => a.avgClarity - b.avgClarity); // most struggling first
}

function avg(nums: number[]): number {
  if (nums.length === 0) return 0;
  return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10;
}

function deltaArrow(current: number, previous: number): string {
  const diff = Math.round((current - previous) * 10) / 10;
  if (diff > 0.2) return `${current} (${diff > 0 ? "+" : ""}${diff})`;
  if (diff < -0.2) return `${current} (${diff})`;
  return `${current}`;
}

function formatScreenRiskTable(scores: ScreenScores[]): string {
  const lines: string[] = [];
  lines.push("### A. Screen Risk Ranking");
  lines.push("");
  lines.push("_Sorted by clarity (lowest first) — screens needing the most attention._");
  lines.push("");
  lines.push("| Rank | Screen | Avg Clarity | Avg Trust | Avg Friction | Quit Mentions |");
  lines.push("|------|--------|-------------|-----------|-------------|---------------|");
  scores.forEach((s, i) => {
    lines.push(
      `| ${i + 1} | ${s.screen} | ${s.avgClarity} | ${s.avgTrust} | ${s.avgFriction} | ${s.quitMentions} |`
    );
  });
  lines.push("");
  return lines.join("\n");
}

function formatPersonaSensitivityTable(scores: PersonaScores[]): string {
  const lines: string[] = [];
  lines.push("### B. Persona Sensitivity Ranking");
  lines.push("");
  lines.push("_Which personas struggled most? Reveals whether friction is broad or persona-specific._");
  lines.push("");
  lines.push("| Persona | Avg Clarity | Avg Trust | Avg Friction | Screens Flagged |");
  lines.push("|---------|-------------|-----------|-------------|-----------------|");
  scores.forEach((s) => {
    lines.push(
      `| ${s.persona} | ${s.avgClarity} | ${s.avgTrust} | ${s.avgFriction} | ${s.screensFlagged} |`
    );
  });
  lines.push("");
  return lines.join("\n");
}

function formatDeltaTable(
  current: ScreenScores[],
  previous: ScoresSnapshot | null
): string {
  if (!previous) {
    return "### C. Delta vs Previous Run\n\n_No previous run data found. Deltas will appear after the next run._\n";
  }

  const prevByScreen = new Map(previous.screens.map((s) => [s.screen, s]));
  const lines: string[] = [];
  lines.push("### C. Delta vs Previous Run");
  lines.push("");
  lines.push(`_Compared to run from ${previous.timestamp}_`);
  lines.push("");
  lines.push("| Screen | Clarity | Trust | Friction |");
  lines.push("|--------|---------|-------|----------|");

  for (const s of current) {
    const prev = prevByScreen.get(s.screen);
    if (!prev) {
      lines.push(`| ${s.screen} | ${s.avgClarity} (new) | ${s.avgTrust} (new) | ${s.avgFriction} (new) |`);
    } else {
      lines.push(
        `| ${s.screen} | ${deltaArrow(s.avgClarity, prev.avgClarity)} | ${deltaArrow(s.avgTrust, prev.avgTrust)} | ${deltaArrow(s.avgFriction, prev.avgFriction)} |`
      );
    }
  }
  lines.push("");
  return lines.join("\n");
}

// ── Summary Generation ──

async function generateSummary(
  client: Anthropic,
  results: EvaluationResult[],
  screenScores: ScreenScores[],
  personaScores: PersonaScores[]
): Promise<string> {
  const summaryData = results.map((r) => ({
    screen: r.screen.label,
    persona: r.persona.name,
    clarity: r.evaluation.clarity,
    trust: r.evaluation.trust,
    friction: r.evaluation.friction,
    confusing: r.evaluation.confusingElements,
    topImprovement: r.evaluation.topImprovement,
  }));

  const response = await withRetry(
    () =>
      client.messages.create({
        model: MODEL,
        max_tokens: 1500,
        messages: [
          {
            role: "user",
            content: `You are a UX research analyst. Below are evaluation results from ${results.length} synthetic user tests across multiple screens and personas for a mobile home-services app called Handled Home.

Also provided: aggregated screen risk rankings and persona sensitivity rankings for additional context.

Analyze these results and produce a summary in this exact markdown format (no other text):

| Insight | Finding |
|---------|---------|
| **Most confusing screen** | [screen name + why] |
| **Most frequent hesitation** | [pattern across personas] |
| **Lowest trust screen** | [screen name + avg score] |
| **Highest friction screen** | [screen name + avg score] |

### Top 5 UX Fixes

1. [Specific, actionable fix]
2. [Specific, actionable fix]
3. [Specific, actionable fix]
4. [Specific, actionable fix]
5. [Specific, actionable fix]

Screen Risk Rankings:
${JSON.stringify(screenScores, null, 2)}

Persona Sensitivity Rankings:
${JSON.stringify(personaScores, null, 2)}

Evaluation Data:
${JSON.stringify(summaryData, null, 2)}`,
          },
        ],
      }),
    "Summary generation"
  );

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text response from Claude for summary");
  }

  return textBlock.text.trim();
}

// ── Report Generation ──

function formatBulletList(items: string[]): string {
  if (items.length === 0) return "None identified";
  return items.map((item) => `• ${item}`).join("<br>");
}

function generateAIReport(
  screenshots: ScreenInfo[],
  personas: PersonaInfo[],
  results: EvaluationResult[],
  summaryMarkdown: string,
  screenScores: ScreenScores[],
  personaScores: PersonaScores[],
  previousScores: ScoresSnapshot | null
): string {
  const lines: string[] = [];

  lines.push("# Synthetic UX Review Report");
  lines.push("");
  lines.push(`**Generated**: ${new Date().toISOString()}`);
  lines.push(`**Flow**: BYOC Onboarding`);
  lines.push(`**Model**: ${MODEL}`);
  lines.push(`**Screenshots evaluated**: ${screenshots.length}`);
  lines.push(`**Personas**: ${personas.length}`);
  lines.push(
    `**Total evaluations**: ${results.length}`
  );
  lines.push("");
  lines.push("---");
  lines.push("");

  // ── Scorecards ──
  lines.push("## Scorecards");
  lines.push("");
  lines.push(formatScreenRiskTable(screenScores));
  lines.push(formatPersonaSensitivityTable(personaScores));
  lines.push(formatDeltaTable(screenScores, previousScores));
  lines.push("---");
  lines.push("");

  // Per-screen, per-persona sections
  for (const screen of screenshots) {
    lines.push(`## Screen: ${screen.label}`);
    lines.push(`**File**: \`${screen.filename}\``);
    if (screen.flow || screen.route || screen.userGoal) {
      const meta: string[] = [];
      if (screen.flow) meta.push(`**Flow**: ${screen.flow}`);
      if (screen.route) meta.push(`**Route**: ${screen.route.replace(/\/[a-f0-9-]{20,}/g, "/:token")}`);
      if (screen.userGoal) meta.push(`**User goal**: ${screen.userGoal}`);
      if (screen.screenType) meta.push(`**Type**: ${screen.screenType}`);
      lines.push(meta.join(" | "));
    }
    lines.push("");

    for (const persona of personas) {
      const result = results.find(
        (r) =>
          r.screen.filename === screen.filename &&
          r.persona.filename === persona.filename
      );

      lines.push(`### ${persona.name}`);
      lines.push("");

      if (!result) {
        lines.push("_Evaluation failed or skipped._");
        lines.push("");
        continue;
      }

      const e = result.evaluation;

      lines.push("| Dimension | Evaluation |");
      lines.push("|-----------|------------|");
      lines.push(`| **What is this screen for?** | ${e.screenPurpose} |`);
      lines.push(`| **First tap** | ${e.firstTap} |`);
      lines.push(
        `| **Confusing elements** | ${formatBulletList(e.confusingElements)} |`
      );
      lines.push(
        `| **Hesitation triggers** | ${formatBulletList(e.hesitationTriggers)} |`
      );
      lines.push(
        `| **Quit triggers** | ${formatBulletList(e.quitTriggers)} |`
      );
      lines.push("");
      lines.push("**Scores**");
      lines.push("| Metric | Score (1-10) |");
      lines.push("|--------|-------------|");
      lines.push(`| Clarity | ${e.clarity} |`);
      lines.push(`| Trust | ${e.trust} |`);
      lines.push(`| Friction | ${e.friction} |`);
      lines.push("");
      lines.push(`**Top improvement**: ${e.topImprovement}`);
      lines.push("");
    }

    lines.push("---");
    lines.push("");
  }

  // Summary section
  lines.push("## Summary");
  lines.push("");
  lines.push(summaryMarkdown);
  lines.push("");
  lines.push("---");
  lines.push("");
  lines.push(
    "_This report was generated by AI user simulation using Claude._"
  );

  return lines.join("\n");
}

function generateScaffoldReport(
  screenshots: ScreenInfo[],
  personas: PersonaInfo[]
): string {
  const lines: string[] = [];

  lines.push("# Synthetic UX Review Report");
  lines.push("");
  lines.push(`**Generated**: ${new Date().toISOString()}`);
  lines.push(`**Flow**: BYOC Onboarding`);
  lines.push(`**Mode**: Scaffold (dry run)`);
  lines.push(`**Screenshots evaluated**: ${screenshots.length}`);
  lines.push(`**Personas**: ${personas.length}`);
  lines.push("");
  lines.push("---");
  lines.push("");

  if (screenshots.length === 0) {
    lines.push(
      "> No milestone screenshots found in `test-results/milestones/`."
    );
    lines.push("> Run Playwright tests first: `npm run test:e2e`");
    lines.push("");
    return lines.join("\n");
  }

  for (const screen of screenshots) {
    lines.push(`## Screen: ${screen.label}`);
    lines.push(`**File**: \`${screen.filename}\``);
    if (screen.flow || screen.route || screen.userGoal) {
      const meta: string[] = [];
      if (screen.flow) meta.push(`**Flow**: ${screen.flow}`);
      if (screen.route) meta.push(`**Route**: ${screen.route.replace(/\/[a-f0-9-]{20,}/g, "/:token")}`);
      if (screen.userGoal) meta.push(`**User goal**: ${screen.userGoal}`);
      if (screen.screenType) meta.push(`**Type**: ${screen.screenType}`);
      lines.push(meta.join(" | "));
    }
    lines.push("");

    for (const persona of personas) {
      lines.push(`### ${persona.name}`);
      lines.push("");
      lines.push("| Dimension | Evaluation |");
      lines.push("|-----------|------------|");
      lines.push("| **What is this screen for?** | _[pending AI review]_ |");
      lines.push("| **First tap** | _[pending AI review]_ |");
      lines.push("| **Confusing elements** | _[pending AI review]_ |");
      lines.push("| **Hesitation triggers** | _[pending AI review]_ |");
      lines.push("| **Quit triggers** | _[pending AI review]_ |");
      lines.push("");
      lines.push("**Scores**");
      lines.push("| Metric | Score (1-10) |");
      lines.push("|--------|-------------|");
      lines.push("| Clarity | _-_ |");
      lines.push("| Trust | _-_ |");
      lines.push("| Friction | _-_ |");
      lines.push("");
      lines.push("**Top improvement**: _[pending AI review]_");
      lines.push("");
    }

    lines.push("---");
    lines.push("");
  }

  lines.push("## Summary");
  lines.push("");
  lines.push("| Insight | Finding |");
  lines.push("|---------|---------|");
  lines.push("| **Most confusing screen** | _[pending]_ |");
  lines.push("| **Most frequent hesitation** | _[pending]_ |");
  lines.push("| **Lowest trust screen** | _[pending]_ |");
  lines.push("| **Highest friction screen** | _[pending]_ |");
  lines.push("");
  lines.push("### Top 5 UX Fixes");
  lines.push("");
  lines.push("1. _[pending AI review]_");
  lines.push("2. _[pending AI review]_");
  lines.push("3. _[pending AI review]_");
  lines.push("4. _[pending AI review]_");
  lines.push("5. _[pending AI review]_");
  lines.push("");
  lines.push("---");
  lines.push("");
  lines.push(
    "_This report was generated as a scaffold. Set ANTHROPIC_API_KEY to run AI evaluations._"
  );

  return lines.join("\n");
}

// ── Main ──

async function main() {
  const screenshots = getScreenshots();
  const personas = getPersonas();

  console.log(`Found ${screenshots.length} milestone screenshots`);
  console.log(`Found ${personas.length} persona definitions`);

  const hasManifest = fs.existsSync(MANIFEST_FILE);
  console.log(`Manifest: ${hasManifest ? "loaded" : "not found (using filenames only)"}`);

  if (screenshots.length === 0) {
    console.log("\nNo screenshots yet. Run Playwright tests first:");
    console.log("   npm run test:e2e");
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  const useAI = !DRY_RUN && !!apiKey && screenshots.length > 0;

  if (DRY_RUN) {
    console.log("\n--dry-run flag set. Generating scaffold report.");
  } else if (!apiKey) {
    console.log(
      "\nNo ANTHROPIC_API_KEY set. Generating scaffold report."
    );
    console.log(
      "Set ANTHROPIC_API_KEY to enable AI-powered evaluations."
    );
  }

  // Load previous scores for delta comparison
  const previousScores = loadPreviousScores();
  if (previousScores) {
    console.log(`Previous scores found (from ${previousScores.timestamp})`);
  }

  let report: string;

  if (useAI) {
    const client = new Anthropic({ apiKey });
    const systemPrompt = getSystemPrompt();
    const totalEvaluations = screenshots.length * personas.length;

    console.log(
      `\nRunning ${totalEvaluations} AI evaluations (${screenshots.length} screens x ${personas.length} personas)`
    );
    console.log(`Model: ${MODEL}`);
    console.log(`Concurrency: ${CONCURRENCY}`);
    console.log("");

    // Build tasks
    let completed = 0;
    const tasks = screenshots.flatMap((screen) =>
      personas.map((persona) => async (): Promise<EvaluationResult> => {
        const num = ++completed;
        console.log(
          `[${num}/${totalEvaluations}] Evaluating "${screen.label}" as ${persona.name}...`
        );

        const evaluation = await evaluateScreen(
          client,
          systemPrompt,
          screen,
          persona,
          screenshots.length
        );

        // Throttle to stay under rate limits
        if (REQUEST_DELAY_MS > 0) {
          await sleep(REQUEST_DELAY_MS);
        }

        return { screen, persona, evaluation };
      })
    );

    // Run with concurrency control
    const results = await runWithConcurrency(tasks, CONCURRENCY);

    console.log(`\nAll ${results.length} evaluations complete.`);

    // Compute scorecards
    const screenScores = computeScreenScores(results);
    const personaScores = computePersonaScores(results);

    console.log("Generating summary...");

    // Generate summary (with scorecard context)
    const summaryMarkdown = await generateSummary(
      client,
      results,
      screenScores,
      personaScores
    );

    report = generateAIReport(
      screenshots,
      personas,
      results,
      summaryMarkdown,
      screenScores,
      personaScores,
      previousScores
    );

    // Write machine-readable scores for next run's delta comparison
    const snapshot: ScoresSnapshot = {
      timestamp: new Date().toISOString(),
      model: MODEL,
      screens: screenScores,
      personas: personaScores,
    };
    fs.writeFileSync(SCORES_FILE, JSON.stringify(snapshot, null, 2), "utf-8");
    console.log(`Scores snapshot written to ${SCORES_FILE}`);
  } else {
    report = generateScaffoldReport(screenshots, personas);
  }

  // Write report
  const outputDir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(OUTPUT_FILE, report, "utf-8");
  console.log(`\nReport written to ${OUTPUT_FILE}`);
}

main().catch((error) => {
  console.error("Fatal error:", error.message ?? error);
  process.exit(1);
});
