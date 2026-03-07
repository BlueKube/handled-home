import { test, expect } from "@playwright/test";
import fs from "fs";
import path from "path";

const MILESTONES_DIR = path.join("test-results", "milestones");

function ensureMilestonesDir() {
  if (!fs.existsSync(MILESTONES_DIR)) {
    fs.mkdirSync(MILESTONES_DIR, { recursive: true });
  }
}

function milestonePath(name: string) {
  return path.join(MILESTONES_DIR, `${name}.png`);
}

/**
 * Generate a unique street address per run to avoid idempotency issues.
 * Uses timestamp so repeated runs don't collide with stale property data.
 */
function uniqueStreet() {
  return `${Date.now()} Test St`;
}

/**
 * BYOC Happy Path — starts unauthenticated.
 * This test is matched by the `chromium-mobile-no-auth` project
 * so it does NOT use the shared auth setup.
 *
 * IDEMPOTENCY: Uses unique addresses per run. However, the BYOC invite
 * token can only be activated once per user. If the test user has already
 * activated this token, the test will detect the redirect to /customer
 * and skip gracefully rather than fail.
 */
test.describe("BYOC Onboarding — Happy Path", () => {
  const TOKEN = process.env.TEST_BYOC_TOKEN;

  test.beforeAll(() => {
    if (!TOKEN) {
      throw new Error("TEST_BYOC_TOKEN must be set as an environment variable");
    }
    ensureMilestonesDir();
  });

  test("completes full BYOC onboarding flow from unauthenticated state", async ({
    page,
  }) => {
    const email = process.env.TEST_USER_EMAIL!;
    const password = process.env.TEST_USER_PASSWORD!;

    // ── Step 0: Visit invite link unauthenticated ──
    await page.goto(`/byoc/activate/${TOKEN}`);

    // Should redirect to auth with return URL
    await expect(page).toHaveURL(/\/auth\?redirect=/, { timeout: 10000 });

    // ── Step 1: Log in ──
    await page.getByPlaceholder(/email/i).fill(email);
    await page.getByPlaceholder(/password/i).fill(password);
    await page.getByRole("button", { name: /sign in|log in/i }).click();

    // Should redirect into the BYOC wizard
    await expect(page).toHaveURL(
      new RegExp(`/customer/onboarding/byoc/${TOKEN}`),
      { timeout: 15000 }
    );

    // ── Guard: detect "already activated" redirect ──
    // If the token was already used by this user, the wizard redirects to /customer.
    // Detect this and skip the rest of the test gracefully.
    try {
      await expect(
        page.getByText(/already on Handled|provider is on/i)
      ).toBeVisible({ timeout: 10000 });
    } catch {
      // Check if we were redirected away (already activated)
      const url = page.url();
      if (url.includes("/customer") && !url.includes("/onboarding/byoc/")) {
        test.skip(true, "BYOC token already activated for this user — skipping happy path");
        return;
      }
      throw new Error("Recognition screen not found and not redirected — unexpected state");
    }

    // ── Screen 1: Provider Recognition ──
    await page.screenshot({ path: milestonePath("byoc-01-recognition") });
    await page.getByRole("button", { name: /continue/i }).click();

    // ── Screen 2: Confirm Service ──
    await expect(
      page.getByText(/found your service|confirm.*service/i)
    ).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: milestonePath("byoc-02-confirm") });
    await page.getByRole("button", { name: /yes|looks right|continue/i }).click();

    // ── Screen 3: Property / Your Home ──
    await expect(
      page.getByText(/about your home|your home|property/i)
    ).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: milestonePath("byoc-03-property") });

    // Fill address fields with unique data
    const street = uniqueStreet();
    const streetInput = page.getByPlaceholder(/street|address/i).first();
    if (await streetInput.isVisible()) {
      await streetInput.fill(street);
    }
    const cityInput = page.getByPlaceholder(/city/i).first();
    if (await cityInput.isVisible()) {
      await cityInput.fill("Austin");
    }
    const stateInput = page.getByPlaceholder(/state/i).first();
    if (await stateInput.isVisible()) {
      await stateInput.fill("TX");
    }
    const zipInput = page.getByPlaceholder(/zip/i).first();
    if (await zipInput.isVisible()) {
      await zipInput.fill("78701");
    }

    await page.getByRole("button", { name: /continue|next/i }).click();

    // ── Screen 4: Home Setup ──
    await expect(
      page.getByText(/few quick details|home setup|details/i)
    ).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: milestonePath("byoc-04-home-setup") });

    // Skip or continue
    const skipBtn = page.getByRole("button", { name: /skip/i });
    const continueBtn = page.getByRole("button", { name: /continue|next/i });
    if (await skipBtn.isVisible()) {
      await skipBtn.click();
    } else {
      await continueBtn.click();
    }

    // ── Screen 4b: Activating / Connecting (transient) ──
    // Wait for it to pass — look for next screen
    await expect(
      page.getByText(/services|other services|what else|success|your home is ready/i)
    ).toBeVisible({ timeout: 20000 });

    // ── Screen 5: Services ──
    const servicesHeading = page.getByText(/services|other services|what else/i);
    if (await servicesHeading.isVisible()) {
      await page.screenshot({ path: milestonePath("byoc-05-services") });
      const skipServices = page.getByRole("button", { name: /skip|continue|next|done/i });
      if (await skipServices.isVisible()) {
        await skipServices.click();
      }
    }

    // ── Screen 6: Success ──
    await expect(
      page.getByText(/your home is ready|success|all set/i)
    ).toBeVisible({ timeout: 15000 });
    await page.screenshot({ path: milestonePath("byoc-06-success") });

    const dashBtn = page.getByRole("button", { name: /dashboard|go to dashboard|get started/i });
    if (await dashBtn.isVisible()) {
      await dashBtn.click();
    }

    // ── Screen 7: Dashboard ──
    await expect(
      page.getByText(/your home team|dashboard|home/i)
    ).toBeVisible({ timeout: 15000 });
    await page.screenshot({ path: milestonePath("byoc-07-dashboard") });
  });
});
