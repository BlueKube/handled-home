import { test, expect } from "@playwright/test";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const MILESTONES_DIR = path.join("test-results", "milestones");

test.describe("BYOC Invalid Invite", () => {
  test.use({ storageState: path.join(__dirname, ".auth", "user.json") });

  test.beforeAll(() => {
    if (!fs.existsSync(MILESTONES_DIR)) {
      fs.mkdirSync(MILESTONES_DIR, { recursive: true });
    }
  });

  test("shows fallback screen for invalid BYOC token", async ({ page }) => {
    // Use the public /byoc/activate route (avoids ProtectedRoute 404 issues)
    await page.goto("/byoc/activate/invalid-token-xyz-playwright", {
      waitUntil: "networkidle",
      timeout: 60000,
    });

    // Expect a fallback / error state.
    // ByocActivate shows "This invitation is no longer active" for invalid tokens.
    // The wizard's InviteFallbackScreen shows "This invitation is no longer active".
    try {
      await expect(
        page.getByText(/no longer active|invalid|not found|expired|something went wrong/i)
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

    // User should have a safe way to continue
    await expect(
      page.getByRole("button", { name: /dashboard|continue|set up|home/i })
    ).toBeVisible();

    await page.screenshot({
      path: path.join(MILESTONES_DIR, "byoc-invalid-fallback.png"),
    });
  });
});
