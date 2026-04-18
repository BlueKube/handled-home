/**
 * Academy Screenshot Capture — extends the existing screenshot catalog
 * to capture screenshots specifically referenced in academy training modules.
 *
 * Many academy screenshots map to the same admin pages already captured
 * by screenshot-catalog.spec.ts. This script captures additional detail views
 * and saves all screenshots to public/academy/ for static serving.
 *
 * Run: BASE_URL=https://your-preview.lovable.app npx playwright test e2e/academy-screenshots.spec.ts --project=screenshot-catalog
 */

import { test } from "@playwright/test";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(__dirname, "..", "public", "academy");

interface AcademyScreen {
  /** Unique filename (no extension) — matches the content file reference */
  id: string;
  /** Route to navigate to */
  route: string;
  /** Module this belongs to */
  module: string;
  /** Optional: text to wait for before capture */
  waitFor?: RegExp;
}

// ── Academy Screenshot Definitions ──
// Maps each academy module's screenshot references to actual routes.
// Some routes appear multiple times (different modules reference the same page).
// The capture script deduplicates by id.

const ACADEMY_SCREENS: AcademyScreen[] = [
  // ── ops-cockpit module ──
  { id: "ops-cron-health", route: "/admin/cron-health", module: "ops-cockpit", waitFor: /cron|health|schedule/i },
  { id: "ops-cockpit-dashboard", route: "/admin/ops", module: "ops-cockpit", waitFor: /cockpit|ops|zone/i },
  { id: "ops-dispatcher-queues", route: "/admin/ops/dispatch", module: "ops-cockpit", waitFor: /dispatch|queue|triage/i },

  // ── first-week module ──
  { id: "first-week-admin-shell", route: "/admin", module: "first-week", waitFor: /dashboard|admin|analytics/i },
  { id: "first-week-ops-cockpit", route: "/admin/ops", module: "first-week", waitFor: /cockpit|ops/i },
  { id: "first-week-dispatcher", route: "/admin/ops/dispatch", module: "first-week", waitFor: /dispatch|queue/i },
  { id: "first-week-providers", route: "/admin/providers", module: "first-week", waitFor: /provider|performance/i },

  // ── provider-lifecycle module ──
  { id: "provider-applications", route: "/admin/providers/applications", module: "provider-lifecycle", waitFor: /application|review|status/i },
  { id: "provider-list", route: "/admin/providers", module: "provider-lifecycle", waitFor: /provider|active|performance/i },
  { id: "provider-accountability", route: "/admin/accountability", module: "provider-lifecycle", waitFor: /accountability|incident|probation/i },

  // ── support-operations module ──
  { id: "support-tickets", route: "/admin/support", module: "support-operations", waitFor: /support|ticket|queue/i },
  { id: "support-macros", route: "/admin/support/macros", module: "support-operations", waitFor: /macro|template/i },

  // ── provider-payouts module ──
  { id: "payouts-dashboard", route: "/admin/payouts", module: "provider-payouts", waitFor: /payout|batch|provider/i },

  // ── growth-incentives module ──
  { id: "growth-programs", route: "/admin/incentives", module: "growth-incentives", waitFor: /incentive|program|referral/i },
  { id: "growth-dashboard", route: "/admin/growth", module: "growth-incentives", waitFor: /growth|referral|lead/i },

  // ── sku-catalog module ──
  { id: "sku-calibration", route: "/admin/sku-calibration", module: "sku-catalog", waitFor: /calibrat|sku|service/i },
  { id: "sku-list", route: "/admin/skus", module: "sku-catalog", waitFor: /sku|service|catalog/i },

  // ── market-launch module ──
  { id: "launch-readiness", route: "/admin/launch-readiness", module: "market-launch", waitFor: /launch|readiness|check/i },

  // ── jobs-scheduling module ──
  { id: "jobs-list", route: "/admin/jobs", module: "jobs-scheduling", waitFor: /job|status|schedule/i },
  { id: "scheduling-dashboard", route: "/admin/scheduling", module: "jobs-scheduling", waitFor: /schedule|capacity/i },
  { id: "scheduling-planner", route: "/admin/scheduling/planner", module: "jobs-scheduling", waitFor: /planner|run|draft/i },
  { id: "assignment-dashboard", route: "/admin/assignments", module: "jobs-scheduling", waitFor: /assign|primary|backup/i },
  { id: "assignment-config", route: "/admin/assignments/config", module: "jobs-scheduling", waitFor: /config|dial|weight/i },
  { id: "service-days", route: "/admin/service-days", module: "jobs-scheduling", waitFor: /service.day|capacity/i },

  // ── governance-health module ──
  { id: "governance-cron", route: "/admin/cron-health", module: "governance-health", waitFor: /cron|health/i },
  { id: "governance-launch", route: "/admin/launch-readiness", module: "governance-health", waitFor: /launch|readiness/i },

  // ── zones-markets module ──
  { id: "zones-list", route: "/admin/zones", module: "zones-markets", waitFor: /zone|market|area/i },
  { id: "zone-builder", route: "/admin/zones/builder", module: "zones-markets", waitFor: /builder|zone|boundary/i },
  { id: "ops-zones", route: "/admin/ops/zones", module: "zones-markets", waitFor: /zone|health|status/i },

  // ── customer-billing module ──
  { id: "billing-dashboard", route: "/admin/billing", module: "customer-billing", waitFor: /billing|revenue|mrr/i },
  { id: "billing-ops", route: "/admin/ops/billing", module: "customer-billing", waitFor: /billing|past.due|failed/i },
  { id: "subscriptions", route: "/admin/subscriptions", module: "customer-billing", waitFor: /subscription|active|plan/i },

  // ── exception-management module ──
  { id: "exceptions-list", route: "/admin/exceptions", module: "exception-management", waitFor: /exception|queue|severity/i },
  { id: "ops-exceptions", route: "/admin/ops/exceptions", module: "exception-management", waitFor: /exception|queue/i },
  { id: "exception-analytics", route: "/admin/ops/exception-analytics", module: "exception-management", waitFor: /analytics|exception|trend/i },

  // ── control-room module ──
  { id: "control-pricing", route: "/admin/control/pricing", module: "control-room", waitFor: /pricing|rate|override/i },
  { id: "control-change-log", route: "/admin/control/change-log", module: "control-room", waitFor: /change|log|audit/i },

  // ── plans-bundles module ──
  { id: "plans-list", route: "/admin/plans", module: "plans-bundles", waitFor: /plan|essential|plus|premium/i },
  { id: "bundles", route: "/admin/bundles", module: "plans-bundles", waitFor: /bundle|package/i },

  // ── sops-playbooks module ──
  { id: "playbooks", route: "/admin/playbooks", module: "sops-playbooks", waitFor: /playbook|sop|procedure/i },

  // ── Shared pages used across modules ──
  { id: "provider-leads", route: "/admin/provider-leads", module: "shared", waitFor: /lead|provider|pipeline/i },
  { id: "feedback", route: "/admin/feedback", module: "shared", waitFor: /feedback|rating|review/i },
  { id: "reports", route: "/admin/reports", module: "shared", waitFor: /report|analytics/i },
  { id: "audit-log", route: "/admin/audit", module: "shared", waitFor: /audit|log|action/i },
];

// Deduplicate by id
const seen = new Set<string>();
const UNIQUE_SCREENS = ACADEMY_SCREENS.filter((s) => {
  if (seen.has(s.id)) return false;
  seen.add(s.id);
  return true;
});

test.describe("Academy Screenshots", () => {
  test.use({
    storageState: path.join(__dirname, ".auth", "admin.json"),
    viewport: { width: 1440, height: 900 },
  });

  test.beforeAll(async () => {
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }
  });

  for (const screen of UNIQUE_SCREENS) {
    test(`capture ${screen.module}/${screen.id}`, async ({ page }) => {
      await page.addInitScript(() => {
        localStorage.setItem("handled_active_role", "admin");
      });

      await page.goto(screen.route, { waitUntil: "networkidle", timeout: 30000 });

      // Wait for content to render
      if (screen.waitFor) {
        try {
          await page.getByText(screen.waitFor).first().waitFor({ timeout: 10000 });
        } catch {
          // Content may not match regex — still capture
        }
      }

      // Extra settle time for animations
      await page.waitForTimeout(1500);

      // Capture
      await page.screenshot({
        path: path.join(OUTPUT_DIR, `${screen.id}.png`),
        fullPage: true,
      });
    });
  }
});
