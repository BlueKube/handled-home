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
 */
function uniqueStreet() {
  return `${Date.now()} Test St`;
}

/**
 * BYOC Happy Path — starts unauthenticated.
 * This test is matched by the `chromium-mobile-no-auth` project
 * so it does NOT use the shared auth setup.
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
    // networkidle ensures the SPA fully hydrates (cold-start preview URLs)
    await page.goto(`/byoc/activate/${TOKEN}`, { waitUntil: "networkidle", timeout: 60000 });

    // The BYOC landing page should appear for unauthenticated users.
    // Wait for one of these possible states:
    // 1. The BYOC invite landing page (new flow) with "Sign Up to Activate"
    // 2. The auth page (redirect flow) with email input
    // 3. The recognition screen (already authenticated, redirected to wizard)
    // 4. The customer dashboard (already activated)
    const signUpBtn = page.getByRole("button", { name: /sign up to activate/i });
    const authEmail = page.getByLabel(/email/i);
    const recognitionScreen = page.getByText(/already on Handled|provider is on/i);
    const dashboardScreen = page.getByText(/your home team|dashboard/i);

    try {
      await expect(
        signUpBtn.or(authEmail).or(recognitionScreen).or(dashboardScreen)
      ).toBeVisible({ timeout: 60000 });
    } catch {
      await page.screenshot({ path: milestonePath("byoc-00-stuck-debug"), fullPage: true });
      const bodyText = await page.locator("body").innerText().catch(() => "(empty)");
      throw new Error(
        `BYOC happy-path: no expected screen after 60s.\nURL: ${page.url()}\nBody: ${bodyText.slice(0, 500)}`
      );
    }

    // Take a milestone screenshot of whatever we landed on
    await page.screenshot({ path: milestonePath("byoc-00-landing"), fullPage: true });

    // Determine which state we landed in
    const currentUrl = page.url();

    if (currentUrl.includes("/customer") && !currentUrl.includes("/onboarding/byoc/")) {
      test.skip(true, "BYOC token already activated for this user — skipping happy path");
      return;
    }

    // ── If we see the BYOC landing page, click "Sign Up to Activate" ──
    if (await signUpBtn.isVisible()) {
      await signUpBtn.click();
      // Should navigate to auth page
      await expect(authEmail).toBeVisible({ timeout: 30000 });
    }

    // ── If we're on the auth page, log in ──
    if (await authEmail.isVisible()) {
      // Ensure we're on the login tab (not signup)
      const loginTab = page.getByRole("tab", { name: /log in/i });
      if (await loginTab.isVisible()) {
        await loginTab.click();
        await page.waitForTimeout(500);
      }

      await page.getByLabel(/email/i).fill(email);
      await page.getByLabel(/password/i).fill(password);
      await page.getByRole("button", { name: /sign in|log in/i }).click();

      // Should redirect into the BYOC wizard
      await expect(page).toHaveURL(
        new RegExp(`/customer/onboarding/byoc/${TOKEN}`),
        { timeout: 30000 }
      );
    }

    // ── Guard: detect "already activated" redirect ──
    try {
      await expect(recognitionScreen).toBeVisible({ timeout: 15000 });
    } catch {
      const url = page.url();
      if (url.includes("/customer") && !url.includes("/onboarding/byoc/")) {
        test.skip(true, "BYOC token already activated for this user — skipping happy path");
        return;
      }
      await page.screenshot({ path: milestonePath("byoc-01-recognition-debug"), fullPage: true });
      const bodyText = await page.locator("body").innerText().catch(() => "(empty)");
      throw new Error(
        `Recognition screen not found and not redirected — unexpected state.\nURL: ${url}\nBody: ${bodyText.slice(0, 500)}`
      );
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
    const streetInput = page.getByLabel(/street/i).first();
    if (await streetInput.isVisible()) {
      await streetInput.fill(street);
    }
    const cityInput = page.getByLabel(/city/i).first();
    if (await cityInput.isVisible()) {
      await cityInput.fill("Austin");
    }
    const stateInput = page.getByLabel(/state/i).first();
    if (await stateInput.isVisible()) {
      await stateInput.fill("TX");
    }
    const zipInput = page.getByLabel(/zip/i).first();
    if (await zipInput.isVisible()) {
      await zipInput.fill("78701");
    }

    await page.getByRole("button", { name: /continue|next/i }).click();

    // ── Screen 4: Home Setup ──
    await expect(
      page.getByText(/few quick details|home setup|details/i)
    ).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: milestonePath("byoc-04-home-setup") });

    const skipBtn = page.getByRole("button", { name: /skip/i });
    const continueBtn = page.getByRole("button", { name: /continue|next/i });
    if (await skipBtn.isVisible()) {
      await skipBtn.click();
    } else {
      await continueBtn.click();
    }

    // ── Screen 4b: Activating / Connecting (transient) ──
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
