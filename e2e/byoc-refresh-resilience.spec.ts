import { test, expect } from "@playwright/test";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const MILESTONES_DIR = path.join("test-results", "milestones");

/**
 * Generate a unique street address per run to avoid collisions.
 */
function uniqueStreet() {
  return `${Date.now()} Refresh Ave`;
}

/**
 * BYOC Refresh Resilience — verifies wizard survives page.reload().
 *
 * IDEMPOTENCY: This test uses unique addresses. If the BYOC token is
 * already activated for this user, the test detects the redirect and
 * skips gracefully. This test MUST NOT run in the same suite as the
 * happy path test against the same token+user combination.
 */
test.describe("BYOC Refresh Resilience", () => {
  const TOKEN = process.env.TEST_BYOC_TOKEN;

  test.use({ storageState: path.join(__dirname, ".auth", "user.json") });

  test.beforeAll(() => {
    if (!TOKEN) {
      throw new Error("TEST_BYOC_TOKEN must be set as an environment variable");
    }
    if (!fs.existsSync(MILESTONES_DIR)) {
      fs.mkdirSync(MILESTONES_DIR, { recursive: true });
    }
  });

  test("wizard survives refresh at confirm, property, and services screens", async ({
    page,
  }) => {
    await page.goto(`/customer/onboarding/byoc/${TOKEN}`);

    // ── Guard: detect "already activated" redirect ──
    try {
      await expect(
        page.getByText(/already on Handled|provider is on/i)
      ).toBeVisible({ timeout: 15000 });
    } catch {
      const url = page.url();
      if (url.includes("/customer") && !url.includes("/onboarding/byoc/")) {
        test.skip(true, "BYOC token already activated for this user — skipping refresh test");
        return;
      }
      throw new Error("Recognition screen not found and not redirected — unexpected state");
    }

    // ── Navigate to Recognition → Continue ──
    await page.getByRole("button", { name: /continue/i }).click();

    // ── Confirm screen — refresh ──
    await expect(
      page.getByText(/found your service|confirm.*service/i)
    ).toBeVisible({ timeout: 10000 });
    await page.reload();
    // After refresh, wizard should still be functional
    await expect(
      page.getByText(/found your service|confirm.*service|already on Handled|provider is on/i)
    ).toBeVisible({ timeout: 10000 });
    await page.screenshot({
      path: path.join(MILESTONES_DIR, "byoc-refresh-confirm.png"),
    });

    // Advance past confirm if we landed back on it
    const confirmBtn = page.getByRole("button", { name: /yes|looks right|continue/i });
    if (await confirmBtn.isVisible()) {
      await confirmBtn.click();
    }

    // May need to pass recognition again after refresh
    const recognitionText = page.getByText(/already on Handled|provider is on/i);
    if (await recognitionText.isVisible()) {
      await page.getByRole("button", { name: /continue/i }).click();
      await page.getByRole("button", { name: /yes|looks right|continue/i }).click();
    }

    // ── Property screen — refresh ──
    await expect(
      page.getByText(/about your home|your home|property/i)
    ).toBeVisible({ timeout: 10000 });
    await page.reload();
    await expect(
      page.getByText(/about your home|your home|property|already on Handled|confirm/i)
    ).toBeVisible({ timeout: 10000 });
    await page.screenshot({
      path: path.join(MILESTONES_DIR, "byoc-refresh-property.png"),
    });

    // Fill and advance to services with unique address
    const street = uniqueStreet();
    const streetInput = page.getByPlaceholder(/street|address/i).first();
    if (await streetInput.isVisible()) {
      await streetInput.fill(street);
      const cityInput = page.getByPlaceholder(/city/i).first();
      if (await cityInput.isVisible()) await cityInput.fill("Austin");
      const stateInput = page.getByPlaceholder(/state/i).first();
      if (await stateInput.isVisible()) await stateInput.fill("TX");
      const zipInput = page.getByPlaceholder(/zip/i).first();
      if (await zipInput.isVisible()) await zipInput.fill("78701");
    }
    await page.getByRole("button", { name: /continue|next/i }).click();

    // Home setup — skip
    const skipBtn = page.getByRole("button", { name: /skip/i });
    if (await skipBtn.isVisible()) {
      await skipBtn.click();
    } else {
      const continueBtn = page.getByRole("button", { name: /continue|next/i });
      if (await continueBtn.isVisible()) await continueBtn.click();
    }

    // Wait for services or success
    await expect(
      page.getByText(/services|other services|what else|success|your home is ready/i)
    ).toBeVisible({ timeout: 20000 });

    // ── Services screen — refresh ──
    const servicesText = page.getByText(/services|other services|what else/i);
    if (await servicesText.isVisible()) {
      await page.reload();
      await expect(
        page.getByText(/services|other services|what else|success|your home is ready/i)
      ).toBeVisible({ timeout: 10000 });
      await page.screenshot({
        path: path.join(MILESTONES_DIR, "byoc-refresh-services.png"),
      });
    }
  });
});
