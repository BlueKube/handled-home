import { test, expect } from "@playwright/test";
import path from "path";
import { fileURLToPath } from "url";
import {
  ensureMilestonesDir,
  MILESTONES_DIR,
  MilestoneTracker,
} from "./milestone";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

test.describe("BYOC Invalid Invite", () => {
  test.use({ storageState: path.join(__dirname, ".auth", "customer.json") });

  test.beforeAll(() => {
    ensureMilestonesDir();
  });

  test("shows fallback screen for invalid BYOC token", async ({ page }) => {
    const tracker = new MilestoneTracker();

    // Use the public /byoc/activate route (avoids ProtectedRoute 404 issues)
    await page.goto("/byoc/activate/invalid-token-xyz-playwright", {
      waitUntil: "networkidle",
      timeout: 60000,
    });

    // Expect a fallback / error state.
    // ByocActivate shows "This invitation is no longer active" for invalid tokens.
    // The wizard's InviteFallbackScreen shows "This invitation is no longer active".
    try {
      // The fallback screen renders multiple copies of matching text
      // ("no longer active" heading + "expired" in body). `.first()` avoids
      // Playwright's strict-mode multi-match failure.
      await expect(
        page.getByText(/no longer active|invalid|not found|expired|something went wrong/i).first()
      ).toBeVisible({ timeout: 30000 });
    } catch {
      await page.screenshot({
        path: path.join(MILESTONES_DIR, "byoc-invalid-debug.png"),
        fullPage: true,
      });
      const bodyText = await page.locator("body").innerText().catch(() => "(empty)");
      throw new Error(
        `Invalid invite fallback not found after 30s.\nURL: ${page.url()}\nBody: ${bodyText.slice(0, 500)}`
      );
    }

    // User should have a safe way to continue (multiple buttons may exist)
    await expect(
      page.getByRole("button", { name: /dashboard|continue|set up|home/i }).first()
    ).toBeVisible();

    await page.screenshot({
      path: path.join(MILESTONES_DIR, "byoc-invalid-fallback.png"),
    });
    tracker.capture({
      filename: "byoc-invalid-fallback.png",
      flow: "byoc-invalid-invite",
      step: "fallback",
      stepNumber: 0,
      route: page.url(),
      userGoal: "Understand why the invite failed and find a safe way to continue",
      screenType: "error",
      sourceFiles: [
        "src/pages/ByocActivate.tsx",
        "src/pages/customer/ByocOnboardingWizard.tsx",
        "src/pages/customer/byoc-onboarding/InviteFallbackScreen.tsx",
      ],
    });

    tracker.writeManifest();
  });
});
