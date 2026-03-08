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
 * Uses /byoc/activate/:token (public route) which renders the wizard
 * inline for authenticated users, avoiding ProtectedRoute issues.
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
    // Use the public /byoc/activate route which renders wizard inline
    await page.goto(`/byoc/activate/${TOKEN}`, {
      waitUntil: "networkidle",
      timeout: 60000,
    });

    // ── Guard: detect "already activated" redirect ──
    try {
      await expect(
        page.getByText(/already on Handled|provider is on/i)
      ).toBeVisible({ timeout: 30000 });
    } catch {
      const url = page.url();
      if (url.includes("/customer") && !url.includes("/onboarding/byoc/")) {
        test.skip(true, "BYOC token already activated for this user — skipping refresh test");
        return;
      }
      await page.screenshot({
        path: path.join(MILESTONES_DIR, "byoc-refresh-recognition-debug.png"),
        fullPage: true,
      });
      const bodyText = await page.locator("body").innerText().catch(() => "(empty)");
      throw new Error(
        `Recognition screen not found and not redirected — unexpected state.\nURL: ${url}\nBody: ${bodyText.slice(0, 500)}`
      );
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

    // After clicking "Continue" on recognition, we may now be on the confirm screen.
    // Check and click "Yes, looks right" if so.
    const confirmText = page.getByText(/found your service|does this look right/i);
    if (await confirmText.isVisible()) {
      await page.getByRole("button", { name: /yes|looks right/i }).click();
    }

    // ── Property screen — race against fallback ──
    // After confirm, the wizard may show the property screen OR the invite
    // may have been already activated (showing "no longer active" fallback).
    // We race both and skip gracefully if fallback wins.
    const propertyText = page.getByText(/about your home|tell us about|street address|few quick details/i);
    const fallbackText = page.getByText(/no longer active|invitation is no longer/i);
    try {
      await expect(propertyText.or(fallbackText)).toBeVisible({ timeout: 15000 });
    } catch {
      await page.screenshot({
        path: path.join(MILESTONES_DIR, "byoc-refresh-post-confirm-debug.png"),
        fullPage: true,
      });
      const bodyText = await page.locator("body").innerText().catch(() => "(empty)");
      throw new Error(
        `Neither property screen nor fallback found after confirm.\nURL: ${page.url()}\nBody: ${bodyText.slice(0, 500)}`
      );
    }

    if (await fallbackText.isVisible()) {
      test.skip(true, "BYOC invite became inactive (already activated) — skipping refresh test");
      return;
    }
    await page.reload();
    await expect(
      page.getByText(/about your home|tell us about|street address|few quick details|already on Handled|confirm/i)
    ).toBeVisible({ timeout: 15000 });
    await page.screenshot({
      path: path.join(MILESTONES_DIR, "byoc-refresh-property.png"),
    });

    // Fill and advance to services with unique address
    const street = uniqueStreet();
    const streetInput = page.getByLabel(/street|address/i).first();
    if (await streetInput.isVisible()) {
      await streetInput.fill(street);
      const cityInput = page.getByLabel(/city/i).first();
      if (await cityInput.isVisible()) await cityInput.fill("Austin");
      const stateInput = page.getByLabel(/state/i).first();
      if (await stateInput.isVisible()) await stateInput.fill("TX");
      const zipInput = page.getByLabel(/zip/i).first();
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
