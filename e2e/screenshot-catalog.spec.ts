/**
 * Screenshot Catalog — captures every major screen for visual QA and AI review.
 *
 * This is NOT a functional test. It navigates to each route, waits for content
 * to render, and captures a labeled screenshot with manifest metadata.
 *
 * Run with: npm run test:catalog
 */

import { test, expect } from "@playwright/test";
import path from "path";
import { fileURLToPath } from "url";
import {
  ensureMilestonesDir,
  MILESTONES_DIR,
  MilestoneTracker,
} from "./milestone";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

interface ScreenDef {
  /** Unique filename prefix (no extension) */
  id: string;
  /** Route to navigate to */
  route: string;
  /** Flow grouping */
  flow: string;
  /** Human description for manifest */
  userGoal: string;
  /** Screen type for manifest */
  screenType: "dashboard" | "catalog" | "form" | "list" | "detail" | "wizard-step" | "settings" | "landing" | "error";
  /** Optional: text to wait for before capture (regex) */
  waitFor?: RegExp;
  /** Optional: if true, capture fullPage */
  fullPage?: boolean;
}

// ── Screen Definitions ──

const CUSTOMER_SCREENS: ScreenDef[] = [
  {
    id: "customer-dashboard",
    route: "/customer",
    flow: "customer-app",
    userGoal: "See personalized dashboard with next visit, health score, and alerts",
    screenType: "dashboard",
    waitFor: /home|dashboard|health|next visit|welcome/i,
  },
  {
    id: "customer-services",
    route: "/customer/services",
    flow: "customer-app",
    userGoal: "Browse available services and add them to routine",
    screenType: "catalog",
    waitFor: /service|catalog|browse/i,
  },
  {
    id: "customer-plans",
    route: "/customer/plans",
    flow: "customer-app",
    userGoal: "Compare subscription plans and choose the right one",
    screenType: "catalog",
    waitFor: /plan|subscription|pricing/i,
  },
  {
    id: "customer-routine",
    route: "/customer/routine",
    flow: "customer-app",
    userGoal: "View and edit service routine — add, remove, change cadence",
    screenType: "form",
    waitFor: /routine|service|schedule/i,
  },
  {
    id: "customer-subscription",
    route: "/customer/subscription",
    flow: "customer-app",
    userGoal: "Manage subscription — upgrade, downgrade, pause, or cancel",
    screenType: "detail",
    waitFor: /subscription|plan|billing/i,
  },
  {
    id: "customer-billing",
    route: "/customer/billing",
    flow: "customer-app",
    userGoal: "View billing overview, balance, and next charge date",
    screenType: "detail",
    waitFor: /billing|balance|payment/i,
  },
  {
    id: "customer-billing-methods",
    route: "/customer/billing/methods",
    flow: "customer-app",
    userGoal: "Add or manage payment methods",
    screenType: "form",
    waitFor: /payment|method|card/i,
  },
  {
    id: "customer-billing-history",
    route: "/customer/billing/history",
    flow: "customer-app",
    userGoal: "View complete invoice history with line-item detail",
    screenType: "list",
    waitFor: /history|invoice|receipt/i,
  },
  {
    id: "customer-referrals",
    route: "/customer/referrals",
    flow: "customer-viral",
    userGoal: "Get referral code, share link, and track referral earnings",
    screenType: "detail",
    waitFor: /refer|share|invite|earn/i,
  },
  {
    id: "customer-property",
    route: "/customer/property",
    flow: "customer-app",
    userGoal: "View and edit property address and details",
    screenType: "form",
    waitFor: /property|address|home/i,
  },
  {
    id: "customer-coverage-map",
    route: "/customer/coverage-map",
    flow: "customer-app",
    userGoal: "See if property is in a covered service zone",
    screenType: "detail",
    waitFor: /coverage|zone|map|area/i,
  },
  {
    id: "customer-property-sizing",
    route: "/customer/property-sizing",
    flow: "customer-app",
    userGoal: "Set property size for accurate service pricing",
    screenType: "form",
    waitFor: /size|lot|sqft|property/i,
  },
  {
    id: "customer-support",
    route: "/customer/support",
    flow: "customer-app",
    userGoal: "Access support options and submit tickets",
    screenType: "dashboard",
    waitFor: /support|help|contact/i,
  },
  {
    id: "customer-history",
    route: "/customer/history",
    flow: "customer-app",
    userGoal: "Browse complete service history with filters",
    screenType: "list",
    waitFor: /history|visit|past/i,
  },
  {
    id: "customer-upcoming",
    route: "/customer/upcoming",
    flow: "customer-app",
    userGoal: "View all upcoming scheduled visits",
    screenType: "list",
    waitFor: /upcoming|scheduled|next/i,
  },
  {
    id: "customer-photos",
    route: "/customer/photos",
    flow: "customer-app",
    userGoal: "Browse before/after photo timeline from past visits",
    screenType: "list",
    waitFor: /photo|before|after|timeline/i,
  },
  {
    id: "customer-home-assistant",
    route: "/customer/home-assistant",
    flow: "customer-app",
    userGoal: "Get AI-powered service recommendations for home",
    screenType: "detail",
    waitFor: /assistant|suggest|recommend/i,
  },
  {
    id: "customer-settings",
    route: "/customer/settings",
    flow: "customer-app",
    userGoal: "Manage account settings — name, phone, avatar",
    screenType: "settings",
    waitFor: /setting|account|profile/i,
  },
  {
    id: "customer-more",
    route: "/customer/more",
    flow: "customer-app",
    userGoal: "Access less-frequent actions from the More menu",
    screenType: "settings",
  },
  {
    id: "customer-notifications",
    route: "/customer/notifications",
    flow: "customer-app",
    userGoal: "View all notifications in inbox",
    screenType: "list",
    waitFor: /notification|inbox/i,
  },
];

const PROVIDER_SCREENS: ScreenDef[] = [
  {
    id: "provider-dashboard",
    route: "/provider",
    flow: "provider-app",
    userGoal: "See today's jobs, earnings summary, and quality score at a glance",
    screenType: "dashboard",
    waitFor: /dashboard|today|jobs|earning|welcome/i,
  },
  {
    id: "provider-byoc-center",
    route: "/provider/byoc",
    flow: "provider-viral",
    userGoal: "Manage BYOC invite links and track customer conversions",
    screenType: "dashboard",
    waitFor: /byoc|invite|customer|bring/i,
  },
  {
    id: "provider-byoc-create",
    route: "/provider/byoc/create-link",
    flow: "provider-viral",
    userGoal: "Create a new branded invite link for an existing customer",
    screenType: "form",
    waitFor: /create|invite|link|customer/i,
  },
  {
    id: "provider-jobs",
    route: "/provider/jobs",
    flow: "provider-app",
    userGoal: "View today's job list with addresses and service details",
    screenType: "list",
    waitFor: /job|today|schedule/i,
  },
  {
    id: "provider-earnings",
    route: "/provider/earnings",
    flow: "provider-app",
    userGoal: "View total earnings with breakdown by period",
    screenType: "detail",
    waitFor: /earning|income|revenue/i,
  },
  {
    id: "provider-payouts",
    route: "/provider/payouts",
    flow: "provider-app",
    userGoal: "Track payout status and next deposit date",
    screenType: "detail",
    waitFor: /payout|deposit|bank/i,
  },
  {
    id: "provider-quality",
    route: "/provider/quality",
    flow: "provider-app",
    userGoal: "View quality score and performance metrics",
    screenType: "detail",
    waitFor: /quality|score|performance|rating/i,
  },
  {
    id: "provider-insights",
    route: "/provider/insights",
    flow: "provider-app",
    userGoal: "See growth insights and trend analysis",
    screenType: "detail",
    waitFor: /insight|growth|trend|performance/i,
  },
  {
    id: "provider-apply",
    route: "/provider/apply",
    flow: "provider-onboarding",
    userGoal: "Apply as a service provider with category and coverage",
    screenType: "form",
    waitFor: /apply|application|join|provider/i,
  },
  {
    id: "provider-referrals",
    route: "/provider/referrals",
    flow: "provider-viral",
    userGoal: "Refer other providers and invite customers to the platform",
    screenType: "detail",
    waitFor: /refer|invite|share/i,
  },
  {
    id: "provider-organization",
    route: "/provider/organization",
    flow: "provider-app",
    userGoal: "Manage organization profile and business details",
    screenType: "form",
    waitFor: /organization|business|company/i,
  },
  {
    id: "provider-coverage",
    route: "/provider/coverage",
    flow: "provider-app",
    userGoal: "View and update service coverage areas",
    screenType: "detail",
    waitFor: /coverage|zone|area|map/i,
  },
  {
    id: "provider-skus",
    route: "/provider/skus",
    flow: "provider-app",
    userGoal: "View authorized service categories",
    screenType: "list",
    waitFor: /service|sku|category|authorized/i,
  },
  {
    id: "provider-work-setup",
    route: "/provider/work-setup",
    flow: "provider-app",
    userGoal: "Configure work preferences and setup",
    screenType: "form",
    waitFor: /work|setup|preference/i,
  },
  {
    id: "provider-availability",
    route: "/provider/availability",
    flow: "provider-app",
    userGoal: "Set availability calendar for scheduling",
    screenType: "form",
    waitFor: /availability|schedule|calendar/i,
  },
  {
    id: "provider-support",
    route: "/provider/support",
    flow: "provider-app",
    userGoal: "Access support and submit operational tickets",
    screenType: "dashboard",
    waitFor: /support|help|ticket/i,
  },
  {
    id: "provider-settings",
    route: "/provider/settings",
    flow: "provider-app",
    userGoal: "Manage account settings and preferences",
    screenType: "settings",
    waitFor: /setting|account|profile/i,
  },
  {
    id: "provider-more",
    route: "/provider/more",
    flow: "provider-app",
    userGoal: "Access less-frequent actions from the More menu",
    screenType: "settings",
  },
  {
    id: "provider-notifications",
    route: "/provider/notifications",
    flow: "provider-app",
    userGoal: "View all notifications in inbox",
    screenType: "list",
    waitFor: /notification|inbox/i,
  },
];

const ADMIN_SCREENS: ScreenDef[] = [
  {
    id: "admin-dashboard",
    route: "/admin",
    flow: "admin-ops",
    userGoal: "View global KPIs and operational overview",
    screenType: "dashboard",
    waitFor: /dashboard|overview|kpi/i,
  },
  {
    id: "admin-ops-cockpit",
    route: "/admin/ops",
    flow: "admin-ops",
    userGoal: "Monitor real-time operational health across all zones",
    screenType: "dashboard",
    waitFor: /ops|cockpit|operational/i,
  },
  {
    id: "admin-ops-zones",
    route: "/admin/ops/zones",
    flow: "admin-ops",
    userGoal: "Monitor zone health with capacity and demand metrics",
    screenType: "list",
    waitFor: /zone|capacity|health/i,
  },
  {
    id: "admin-ops-jobs",
    route: "/admin/ops/jobs",
    flow: "admin-ops",
    userGoal: "Monitor active jobs across all zones",
    screenType: "list",
    waitFor: /job|active|status/i,
  },
  {
    id: "admin-ops-billing",
    route: "/admin/ops/billing",
    flow: "admin-ops",
    userGoal: "Track billing health and revenue metrics",
    screenType: "detail",
    waitFor: /billing|revenue|payment/i,
  },
  {
    id: "admin-ops-growth",
    route: "/admin/ops/growth",
    flow: "admin-ops",
    userGoal: "Monitor growth metrics and funnel analytics",
    screenType: "detail",
    waitFor: /growth|funnel|metric/i,
  },
  {
    id: "admin-ops-support",
    route: "/admin/ops/support",
    flow: "admin-ops",
    userGoal: "Monitor support queue depth and response times",
    screenType: "detail",
    waitFor: /support|queue|ticket/i,
  },
  {
    id: "admin-zones",
    route: "/admin/zones",
    flow: "admin-config",
    userGoal: "Manage service regions and zones",
    screenType: "list",
    waitFor: /zone|region|area/i,
  },
  {
    id: "admin-skus",
    route: "/admin/skus",
    flow: "admin-config",
    userGoal: "Manage the full SKU catalog — create, edit, archive services",
    screenType: "list",
    waitFor: /sku|service|catalog/i,
  },
  {
    id: "admin-plans",
    route: "/admin/plans",
    flow: "admin-config",
    userGoal: "Create and manage subscription plans with pricing",
    screenType: "list",
    waitFor: /plan|subscription|pricing/i,
  },
  {
    id: "admin-providers",
    route: "/admin/providers",
    flow: "admin-config",
    userGoal: "View all providers with status and performance data",
    screenType: "list",
    waitFor: /provider|status|performance/i,
  },
  {
    id: "admin-applications",
    route: "/admin/providers/applications",
    flow: "admin-config",
    userGoal: "Review and approve/reject provider applications",
    screenType: "list",
    waitFor: /application|review|pending/i,
  },
  {
    id: "admin-exceptions",
    route: "/admin/exceptions",
    flow: "admin-ops",
    userGoal: "View and triage the exception queue by severity",
    screenType: "list",
    waitFor: /exception|queue|severity/i,
  },
  {
    id: "admin-growth",
    route: "/admin/growth",
    flow: "admin-config",
    userGoal: "Manage growth surfaces, referral programs, and BYOC attribution",
    screenType: "dashboard",
    waitFor: /growth|referral|byoc|incentive/i,
  },
  {
    id: "admin-feedback",
    route: "/admin/feedback",
    flow: "admin-config",
    userGoal: "Review user feedback and transparency metrics",
    screenType: "list",
    waitFor: /feedback|review|transparency/i,
  },
];

const PUBLIC_SCREENS: ScreenDef[] = [
  {
    id: "public-auth",
    route: "/auth",
    flow: "public",
    userGoal: "Sign up or log in to the platform",
    screenType: "form",
    waitFor: /sign|log|email|password/i,
  },
];

// ── Test Implementation ──

test.describe("Screenshot Catalog", () => {
  test.describe("Customer Screens", () => {
    test.use({
      storageState: path.join(__dirname, ".auth", "customer.json"),
    });

    test.beforeAll(() => {
      ensureMilestonesDir();
    });

    for (const screen of CUSTOMER_SCREENS) {
      test(`capture ${screen.id}`, async ({ page }) => {
        const tracker = new MilestoneTracker();

        await page.goto(screen.route, {
          waitUntil: "networkidle",
          timeout: 60000,
        });

        // Wait for meaningful content or settle for what loaded
        if (screen.waitFor) {
          try {
            await page.waitForFunction(
              (pattern: string) => {
                const text = document.body?.innerText ?? "";
                return new RegExp(pattern, "i").test(text);
              },
              screen.waitFor.source,
              { timeout: 15000 }
            );
          } catch {
            // Screen may have loaded with different content — capture anyway
          }
        }

        // Small settle delay for animations/transitions
        await page.waitForTimeout(1000);

        const filename = `${screen.id}.png`;
        await page.screenshot({
          path: path.join(MILESTONES_DIR, filename),
          fullPage: screen.fullPage ?? false,
        });

        tracker.capture({
          filename,
          flow: screen.flow,
          step: screen.id,
          stepNumber: CUSTOMER_SCREENS.indexOf(screen),
          route: page.url(),
          userGoal: screen.userGoal,
          screenType: screen.screenType,
        });

        tracker.writeManifest();
      });
    }
  });

  test.describe("Provider Screens", () => {
    test.use({
      storageState: path.join(__dirname, ".auth", "provider.json"),
    });

    test.beforeAll(() => {
      ensureMilestonesDir();
    });

    for (const screen of PROVIDER_SCREENS) {
      test(`capture ${screen.id}`, async ({ page }) => {
        const tracker = new MilestoneTracker();

        await page.goto(screen.route, {
          waitUntil: "networkidle",
          timeout: 60000,
        });

        if (screen.waitFor) {
          try {
            await page.waitForFunction(
              (pattern: string) => {
                const text = document.body?.innerText ?? "";
                return new RegExp(pattern, "i").test(text);
              },
              screen.waitFor.source,
              { timeout: 15000 }
            );
          } catch {
            // Capture anyway
          }
        }

        await page.waitForTimeout(1000);

        const filename = `${screen.id}.png`;
        await page.screenshot({
          path: path.join(MILESTONES_DIR, filename),
          fullPage: screen.fullPage ?? false,
        });

        tracker.capture({
          filename,
          flow: screen.flow,
          step: screen.id,
          stepNumber: PROVIDER_SCREENS.indexOf(screen),
          route: page.url(),
          userGoal: screen.userGoal,
          screenType: screen.screenType,
        });

        tracker.writeManifest();
      });
    }
  });

  test.describe("Admin Screens", () => {
    test.use({
      storageState: path.join(__dirname, ".auth", "admin.json"),
    });

    test.beforeAll(() => {
      ensureMilestonesDir();
    });

    for (const screen of ADMIN_SCREENS) {
      test(`capture ${screen.id}`, async ({ page }) => {
        const tracker = new MilestoneTracker();

        await page.goto(screen.route, {
          waitUntil: "networkidle",
          timeout: 60000,
        });

        if (screen.waitFor) {
          try {
            await page.waitForFunction(
              (pattern: string) => {
                const text = document.body?.innerText ?? "";
                return new RegExp(pattern, "i").test(text);
              },
              screen.waitFor.source,
              { timeout: 15000 }
            );
          } catch {
            // Capture anyway
          }
        }

        await page.waitForTimeout(1000);

        const filename = `${screen.id}.png`;
        await page.screenshot({
          path: path.join(MILESTONES_DIR, filename),
          fullPage: screen.fullPage ?? false,
        });

        tracker.capture({
          filename,
          flow: screen.flow,
          step: screen.id,
          stepNumber: ADMIN_SCREENS.indexOf(screen),
          route: page.url(),
          userGoal: screen.userGoal,
          screenType: screen.screenType,
        });

        tracker.writeManifest();
      });
    }
  });

  test.describe("Public Screens", () => {
    test.beforeAll(() => {
      ensureMilestonesDir();
    });

    for (const screen of PUBLIC_SCREENS) {
      test(`capture ${screen.id}`, async ({ page }) => {
        const tracker = new MilestoneTracker();

        await page.goto(screen.route, {
          waitUntil: "networkidle",
          timeout: 60000,
        });

        if (screen.waitFor) {
          try {
            await page.waitForFunction(
              (pattern: string) => {
                const text = document.body?.innerText ?? "";
                return new RegExp(pattern, "i").test(text);
              },
              screen.waitFor.source,
              { timeout: 15000 }
            );
          } catch {
            // Capture anyway
          }
        }

        await page.waitForTimeout(1000);

        const filename = `${screen.id}.png`;
        await page.screenshot({
          path: path.join(MILESTONES_DIR, filename),
          fullPage: screen.fullPage ?? false,
        });

        tracker.capture({
          filename,
          flow: screen.flow,
          step: screen.id,
          stepNumber: 0,
          route: page.url(),
          userGoal: screen.userGoal,
          screenType: screen.screenType,
        });

        tracker.writeManifest();
      });
    }
  });
});
