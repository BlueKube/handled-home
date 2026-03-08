/**
 * Synthetic UX Review Report Generator — Phase 2
 *
 * Reads milestone screenshots from test-results/milestones/
 * and persona prompts from e2e/prompts/personas/, then uses
 * the Anthropic Claude API (vision) to generate persona-based
 * UX evaluations for each screenshot.
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
const OUTPUT_FILE = path.resolve("test-results/ux-review-report.md");

const DRY_RUN = process.argv.includes("--dry-run");
const CONCURRENCY = parseInt(process.env.UX_CONCURRENCY ?? "3", 10);
const MODEL = process.env.UX_MODEL ?? "claude-sonnet-4-20250514";

// ── Types ──

interface ScreenInfo {
  filename: string;
  label: string;
  filepath: string;
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

// ── Helpers ──

function getScreenshots(): ScreenInfo[] {
  if (!fs.existsSync(MILESTONES_DIR)) {
    console.warn(`No milestones directory found at ${MILESTONES_DIR}`);
    return [];
  }
  return fs
    .readdirSync(MILESTONES_DIR)
    .filter((f) => f.endsWith(".png"))
    .sort()
    .map((f) => ({
      filename: f,
      filepath: path.join(MILESTONES_DIR, f),
      label: f
        .replace(".png", "")
        .replace(/^byoc-\d+-/, "")
        .replace(/-/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase()),
    }));
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

async function evaluateScreen(
  client: Anthropic,
  systemPrompt: string,
  screen: ScreenInfo,
  persona: PersonaInfo
): Promise<Evaluation> {
  const imageData = fs.readFileSync(screen.filepath);
  const base64Image = imageData.toString("base64");

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `You are evaluating this screen as the following persona:\n\n${persona.content}\n\nScreen name: "${screen.label}"\n\nAnalyze this screenshot and respond with a JSON object matching this schema. Do not include any text outside the JSON.\n\n${JSON.stringify(EVALUATION_SCHEMA, null, 2)}`,
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

// ── Summary Generation ──

async function generateSummary(
  client: Anthropic,
  results: EvaluationResult[]
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

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1500,
    messages: [
      {
        role: "user",
        content: `You are a UX research analyst. Below are evaluation results from ${results.length} synthetic user tests across multiple screens and personas for a mobile home-services app called Handled Home.

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

Data:
${JSON.stringify(summaryData, null, 2)}`,
      },
    ],
  });

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
  summaryMarkdown: string
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

  // Per-screen, per-persona sections
  for (const screen of screenshots) {
    lines.push(`## Screen: ${screen.label}`);
    lines.push(`**File**: \`${screen.filename}\``);
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
      lines.push("| Metric | Score (1–10) |");
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
      lines.push("| Metric | Score (1–10) |");
      lines.push("|--------|-------------|");
      lines.push("| Clarity | _—_ |");
      lines.push("| Trust | _—_ |");
      lines.push("| Friction | _—_ |");
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
          persona
        );

        return { screen, persona, evaluation };
      })
    );

    // Run with concurrency control
    const results = await runWithConcurrency(tasks, CONCURRENCY);

    console.log(`\nAll ${results.length} evaluations complete. Generating summary...`);

    // Generate summary
    const summaryMarkdown = await generateSummary(client, results);

    report = generateAIReport(screenshots, personas, results, summaryMarkdown);
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
