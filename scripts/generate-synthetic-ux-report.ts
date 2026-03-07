/**
 * Synthetic UX Review Report Generator — Phase 1 Scaffold
 *
 * This script reads milestone screenshots from test-results/milestones/
 * and persona prompts from e2e/prompts/personas/, then generates
 * (or stubs) a UX review report at test-results/ux-review-report.md.
 *
 * Phase 1: Generates the report template with placeholders.
 * Phase 2: Will integrate with an LLM API (OpenAI/Claude) to fill in
 *          actual persona evaluations from the screenshots.
 *
 * Usage:
 *   npx tsx scripts/generate-synthetic-ux-report.ts
 */

import fs from "fs";
import path from "path";

const MILESTONES_DIR = path.resolve("test-results/milestones");
const PERSONAS_DIR = path.resolve("e2e/prompts/personas");
const SYSTEM_PROMPT = path.resolve("e2e/prompts/ux-review-system.md");
const OUTPUT_FILE = path.resolve("test-results/ux-review-report.md");

interface ScreenInfo {
  filename: string;
  label: string;
}

interface PersonaInfo {
  filename: string;
  name: string;
  content: string;
}

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

function generateReport(
  screenshots: ScreenInfo[],
  personas: PersonaInfo[]
): string {
  const lines: string[] = [];

  lines.push("# Synthetic UX Review Report");
  lines.push("");
  lines.push(`**Generated**: ${new Date().toISOString()}`);
  lines.push(`**Flow**: BYOC Onboarding`);
  lines.push(`**Screenshots evaluated**: ${screenshots.length}`);
  lines.push(`**Personas**: ${personas.length}`);
  lines.push("");
  lines.push("---");
  lines.push("");

  if (screenshots.length === 0) {
    lines.push(
      "> ⚠️ No milestone screenshots found in `test-results/milestones/`."
    );
    lines.push("> Run Playwright tests first: `npm run test:e2e`");
    lines.push("");
    return lines.join("\n");
  }

  // Per-screen, per-persona sections
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

  // Summary section
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
    "_This report was generated as a scaffold. To fill in actual evaluations,_"
  );
  lines.push(
    "_run persona prompts against the screenshots using an LLM API (Phase 2)._"
  );

  return lines.join("\n");
}

// ── Main ──
const screenshots = getScreenshots();
const personas = getPersonas();

console.log(`Found ${screenshots.length} milestone screenshots`);
console.log(`Found ${personas.length} persona definitions`);

const report = generateReport(screenshots, personas);

// Ensure output directory exists
const outputDir = path.dirname(OUTPUT_FILE);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

fs.writeFileSync(OUTPUT_FILE, report, "utf-8");
console.log(`Report written to ${OUTPUT_FILE}`);

if (screenshots.length === 0) {
  console.log("\nℹ️  No screenshots yet. Run Playwright tests first:");
  console.log("   npm run test:e2e");
}

console.log("\nℹ️  To fill evaluations with AI, integrate an LLM API in Phase 2.");
console.log("   System prompt: e2e/prompts/ux-review-system.md");
console.log("   Persona prompts: e2e/prompts/personas/*.md");
