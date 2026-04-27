/**
 * Milestone metadata helpers for Playwright tests.
 *
 * Each test file creates a MilestoneTracker, calls .capture() after each
 * page.screenshot(), and calls .writeManifest() at the end of the test.
 * The resulting manifest.json is consumed by the UX report generator
 * to provide structured context alongside each screenshot.
 */

import fs from "fs";
import path from "path";

export const MILESTONES_DIR = path.join("test-results", "milestones");
const MANIFEST_FILE = path.join(MILESTONES_DIR, "manifest.json");

export interface MilestoneMetadata {
  filename: string;
  flow: string;
  step: string;
  stepNumber: number;
  route: string;
  userGoal: string;
  screenType:
    | "landing"
    | "wizard-step"
    | "success"
    | "dashboard"
    | "error"
    | "debug";
  /**
   * Source files this capture exercises. Used by the ai-judge scoping
   * logic in `scripts/generate-synthetic-ux-report.ts` to filter captures
   * to those relevant to a PR's diff. Optional for backwards-compat with
   * legacy captures; new captures should always set this.
   */
  sourceFiles?: string[];
}

export function ensureMilestonesDir() {
  if (!fs.existsSync(MILESTONES_DIR)) {
    fs.mkdirSync(MILESTONES_DIR, { recursive: true });
  }
}

export function milestonePath(name: string) {
  return path.join(MILESTONES_DIR, `${name}.png`);
}

/**
 * Tracks milestone metadata for a single test run.
 * Call .capture() after each screenshot, then .writeManifest() at end.
 */
export class MilestoneTracker {
  private entries: MilestoneMetadata[] = [];

  capture(meta: MilestoneMetadata) {
    this.entries.push(meta);
  }

  /**
   * Merges current entries into the manifest file.
   * Existing entries from other test files are preserved;
   * entries with the same filename are overwritten.
   */
  writeManifest() {
    let existing: MilestoneMetadata[] = [];
    if (fs.existsSync(MANIFEST_FILE)) {
      try {
        existing = JSON.parse(fs.readFileSync(MANIFEST_FILE, "utf-8"));
      } catch {
        existing = [];
      }
    }

    // Merge: replace existing entries by filename, append new ones
    const byFilename = new Map(existing.map((e) => [e.filename, e]));
    for (const entry of this.entries) {
      byFilename.set(entry.filename, entry);
    }

    const merged = Array.from(byFilename.values()).sort((a, b) =>
      a.filename.localeCompare(b.filename)
    );

    fs.writeFileSync(MANIFEST_FILE, JSON.stringify(merged, null, 2), "utf-8");
  }
}
