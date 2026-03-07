import { test, expect } from "@playwright/test";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const MILESTONES_DIR = path.join("test-results", "milestones");

test.describe("BYOC Invalid Invite", () => {
  test.use({ storageState: path.join(import.meta.dirname, ".auth", "user.json") });

  test.beforeAll(() => {
    if (!fs.existsSync(MILESTONES_DIR)) {
      fs.mkdirSync(MILESTONES_DIR, { recursive: true });
    }
  });

  test("shows fallback screen for invalid BYOC token", async ({ page }) => {
    await page.goto("/customer/onboarding/byoc/invalid-token-xyz-playwright");

    // Expect a fallback / error state
    await expect(
      page.getByText(/no longer active|invalid|not found|expired|something went wrong/i)
    ).toBeVisible({ timeout: 10000 });

    // User should have a safe way to continue
    await expect(
      page.getByRole("button", { name: /dashboard|continue|set up|home/i })
    ).toBeVisible();

    await page.screenshot({
      path: path.join(MILESTONES_DIR, "byoc-invalid-fallback.png"),
    });
  });
});
