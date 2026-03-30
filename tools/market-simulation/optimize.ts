/**
 * Autoresearch-Inspired Optimization Loop
 *
 * Follows the Karpathy autoresearch pattern:
 * 1. Mutate one assumption in the model
 * 2. Run simulation
 * 3. If score improved: keep the change
 * 4. If score worsened: revert
 * 5. Log result to results.tsv
 * 6. Repeat
 *
 * ~12 experiments per minute (simulations are fast, no training needed)
 */

import { writeFileSync, appendFileSync, existsSync } from "fs";
import { assumptions, bounds, type ModelAssumptions } from "./model.ts";
import { simulate } from "./simulate.ts";

const EXPERIMENTS = parseInt(process.env.EXPERIMENTS ?? "100", 10);
const RESULTS_FILE = new URL("./results.tsv", import.meta.url).pathname;

// === MUTATION ENGINE ===

const assumptionKeys = Object.keys(assumptions) as (keyof ModelAssumptions)[];

function mutateOne(current: ModelAssumptions): {
  mutated: ModelAssumptions;
  key: string;
  oldValue: number;
  newValue: number;
} {
  const key = assumptionKeys[Math.floor(Math.random() * assumptionKeys.length)];
  const [min, max] = bounds[key];
  const oldValue = current[key];

  // Mutation strategy: either small perturbation (80%) or random jump (20%)
  let newValue: number;
  if (Math.random() < 0.8) {
    // Small perturbation: ±5-15% of current value
    const perturbation = 1 + (Math.random() * 0.2 - 0.1); // 0.9 to 1.1
    newValue = oldValue * perturbation;
  } else {
    // Random jump within bounds
    newValue = min + Math.random() * (max - min);
  }

  // Clamp to bounds
  newValue = Math.max(min, Math.min(max, newValue));

  // Round integers (counts, cents)
  if (Number.isInteger(oldValue)) {
    newValue = Math.round(newValue);
  } else {
    // Round rates to 4 decimal places
    newValue = Math.round(newValue * 10000) / 10000;
  }

  // Ensure plan mix sums to ~1.0
  const planMixKeys: (keyof ModelAssumptions)[] = [
    "plan_mix_essential",
    "plan_mix_plus",
    "plan_mix_premium",
  ];
  if (planMixKeys.includes(key)) {
    const otherKeys = planMixKeys.filter((k) => k !== key);
    const otherSum = otherKeys.reduce((s, k) => s + current[k], 0);
    if (otherSum > 0) {
      newValue = Math.min(newValue, 1 - 0.05 * otherKeys.length); // Leave room for others
    }
  }

  return {
    mutated: { ...current, [key]: newValue },
    key,
    oldValue,
    newValue,
  };
}

// === RESULTS LOGGING ===

function initResultsFile() {
  if (!existsSync(RESULTS_FILE)) {
    writeFileSync(
      RESULTS_FILE,
      "experiment_id\tassumption_changed\told_value\tnew_value\tscore\tdelta\tkept\tmargin_pct\tretention_60d\tutilization\tattach_rate\tweeks_to_15\tbreak_even\tfinal_customers\n"
    );
  }
}

function logResult(
  id: number,
  key: string,
  oldValue: number,
  newValue: number,
  score: number,
  delta: number,
  kept: boolean,
  metrics: Record<string, number | null>
) {
  const row = [
    id,
    key,
    oldValue.toFixed(4),
    newValue.toFixed(4),
    score.toFixed(2),
    delta.toFixed(2),
    kept ? "YES" : "no",
    metrics.gross_margin_pct_avg?.toFixed(1) ?? "",
    metrics.retention_60d_pct?.toFixed(1) ?? "",
    metrics.provider_utilization_avg?.toFixed(1) ?? "",
    metrics.attach_rate_90d?.toFixed(1) ?? "",
    metrics.weeks_to_15_customers ?? "",
    metrics.break_even_month ?? "never",
    metrics.final_customers ?? "",
  ].join("\t");
  appendFileSync(RESULTS_FILE, row + "\n");
}

// === MAIN LOOP ===

function run() {
  initResultsFile();

  console.log(`\n=== AUTORESEARCH OPTIMIZATION LOOP ===`);
  console.log(`Experiments: ${EXPERIMENTS}`);
  console.log(`Results: ${RESULTS_FILE}\n`);

  // Baseline
  let current = { ...assumptions };
  let baseResult = simulate(current);
  let bestScore = baseResult.score;

  console.log(`Baseline score: ${bestScore.toFixed(2)}`);
  console.log(`  Margin: ${baseResult.metrics.gross_margin_pct_avg.toFixed(1)}%`);
  console.log(`  Retention: ${baseResult.metrics.retention_60d_pct.toFixed(1)}%`);
  console.log(`  Utilization: ${baseResult.metrics.provider_utilization_avg.toFixed(1)}%`);
  console.log(`  Attach: ${baseResult.metrics.attach_rate_90d.toFixed(1)}%`);
  console.log(`  Weeks to 15: ${baseResult.metrics.weeks_to_15_customers}`);
  console.log(`  Break-even: ${baseResult.metrics.break_even_month ?? "never"}`);
  console.log(`  Final customers: ${baseResult.metrics.final_customers}\n`);

  let kept = 0;
  let discarded = 0;
  const improvements: { key: string; delta: number; newValue: number }[] = [];

  for (let i = 1; i <= EXPERIMENTS; i++) {
    const { mutated, key, oldValue, newValue } = mutateOne(current);
    const result = simulate(mutated);
    const delta = result.score - bestScore;

    if (delta > 0) {
      // Improvement — keep it
      current = mutated;
      bestScore = result.score;
      kept++;
      improvements.push({ key, delta, newValue });
      logResult(i, key, oldValue, newValue, result.score, delta, true, result.metrics as any);

      if (i % 10 === 0 || delta > 50) {
        console.log(
          `[${i}/${EXPERIMENTS}] ✓ ${key}: ${oldValue.toFixed(4)} → ${newValue.toFixed(4)} | score: ${result.score.toFixed(2)} (+${delta.toFixed(2)})`
        );
      }
    } else {
      // No improvement — discard
      discarded++;
      logResult(i, key, oldValue, newValue, result.score, delta, false, result.metrics as any);
    }
  }

  // === FINAL REPORT ===
  const finalResult = simulate(current);

  console.log(`\n${"=".repeat(60)}`);
  console.log(`OPTIMIZATION COMPLETE`);
  console.log(`${"=".repeat(60)}\n`);

  console.log(`Experiments: ${EXPERIMENTS}`);
  console.log(`Kept: ${kept} (${((kept / EXPERIMENTS) * 100).toFixed(1)}%)`);
  console.log(`Discarded: ${discarded}`);
  console.log(`Score: ${baseResult.score.toFixed(2)} → ${finalResult.score.toFixed(2)} (+${(finalResult.score - baseResult.score).toFixed(2)})\n`);

  console.log("OPTIMIZED METRICS:");
  console.log(`  Gross Margin:        ${finalResult.metrics.gross_margin_pct_avg.toFixed(1)}%`);
  console.log(`  60-Day Retention:    ${finalResult.metrics.retention_60d_pct.toFixed(1)}%`);
  console.log(`  Provider Utilization:${finalResult.metrics.provider_utilization_avg.toFixed(1)}%`);
  console.log(`  Attach Rate (90d):   ${finalResult.metrics.attach_rate_90d.toFixed(1)}%`);
  console.log(`  Weeks to 15:         ${finalResult.metrics.weeks_to_15_customers}`);
  console.log(`  Break-Even Month:    ${finalResult.metrics.break_even_month ?? "never"}`);
  console.log(`  Peak Customers:      ${finalResult.metrics.peak_customers}`);
  console.log(`  Final Customers:     ${finalResult.metrics.final_customers}`);
  console.log(`  Total Revenue (12m): $${(finalResult.metrics.total_revenue_cents / 100).toFixed(0)}\n`);

  // Top improvements
  improvements.sort((a, b) => b.delta - a.delta);
  console.log("TOP 10 MOST IMPACTFUL CHANGES:");
  for (const imp of improvements.slice(0, 10)) {
    console.log(`  ${imp.key.padEnd(40)} +${imp.delta.toFixed(2)} → ${imp.newValue.toFixed(4)}`);
  }

  // Print optimized assumptions that differ from baseline
  console.log("\nOPTIMIZED ASSUMPTIONS (changed from baseline):");
  for (const key of assumptionKeys) {
    if (current[key] !== assumptions[key]) {
      console.log(
        `  ${key.padEnd(40)} ${assumptions[key]} → ${typeof current[key] === "number" && !Number.isInteger(current[key]) ? current[key].toFixed(4) : current[key]}`
      );
    }
  }

  console.log(`\nResults logged to: ${RESULTS_FILE}`);
}

run();
