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
 *
 * Flow: /byoc/activate/:token (landing page) → auth → /byoc/activate/:token (wizard inline)
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
    await page.goto(`/byoc/activate/${TOKEN}`, { waitUntil: "networkidle", timeout: 60000 });

    // Wait for ANY expected screen to appear. We use waitForFunction on raw DOM
    // text because Playwright's .or() chain with many getByText locators has proven
    // unreliable — it fails to match text that is visually present on the page.
    const screenKeywords = [
      "sign up to activate",
      "invited you",
      "already on handled",
      "provider is on",
      "your home team",
      "no longer active",
    ];
    try {
      await page.waitForFunction(
        (keywords: string[]) => {
          const text = document.body?.innerText?.toLowerCase() ?? "";
          return keywords.some((kw) => text.includes(kw));
        },
        screenKeywords,
        { timeout: 60000 }
      );
    } catch {
      await page.screenshot({ path: milestonePath("byoc-00-stuck-debug"), fullPage: true });
      const bodyText = await page.locator("body").innerText().catch(() => "(empty)");
      throw new Error(
        `BYOC happy-path: no expected screen after 60s.\nURL: ${page.url()}\nBody: ${bodyText.slice(0, 500)}`
      );
    }

    // Now determine which screen we landed on using simple locators
    const signUpBtn = page.locator("button", { hasText: /sign up to activate/i });
    const authEmail = page.getByLabel(/email/i);
    const recognitionScreen = page.getByText(/already on Handled|provider is on/i).first();
    const dashboardScreen = page.getByText(/your home team|dashboard/i).first();
    const inviteExpired = page.getByText(/no longer active/i).first();
    const inviteLanding = page.getByText(/invited you/i).first();

    await page.screenshot({ path: milestonePath("byoc-00-landing"), fullPage: true });

    // If invite is expired/inactive, fail with a clear message
    if (await inviteExpired.isVisible() && !(await signUpBtn.isVisible())) {
      throw new Error(
        "BYOC invite token appears expired or the public invite query failed. " +
        "Verify TEST_BYOC_TOKEN is a valid, active invite link token."
      );
    }

    // ── Already activated? ──
    const currentUrl = page.url();
    if (currentUrl.includes("/customer") && !currentUrl.includes("/onboarding/byoc/") && !currentUrl.includes("/byoc/activate/")) {
      test.skip(true, "BYOC token already activated for this user — skipping happy path");
      return;
    }

    // ── If we see the BYOC landing page, click "Sign Up to Activate" ──
    if (await inviteLanding.isVisible() || await signUpBtn.isVisible()) {
      await signUpBtn.first().click({ timeout: 10000 });
      await expect(authEmail).toBeVisible({ timeout: 30000 });
    }

    // ── If we're on the auth page, log in ──
    if (await authEmail.isVisible()) {
      const loginTab = page.getByRole("tab", { name: /log in/i });
      if (await loginTab.isVisible()) {
        await loginTab.click();
        await page.waitForTimeout(500);
      }

      await page.getByLabel(/email/i).fill(email);
      await page.getByLabel(/password/i).fill(password);
      await page.getByRole("button", { name: /sign in|log in/i }).click();

      // After login, should redirect back to /byoc/activate/:token
      // where the wizard renders inline for authenticated users.
      // Wait for either the redirect URL or the wizard content to appear.
      await expect(page).toHaveURL(
        new RegExp(`/byoc/activate/${TOKEN}`),
        { timeout: 30000 }
      );
    }

    // ── Wait for recognition screen (wizard renders inline at /byoc/activate) ──
    try {
      await expect(recognitionScreen).toBeVisible({ timeout: 15000 });
    } catch {
      const url = page.url();
      if (url.includes("/customer") && !url.includes("/byoc/activate/")) {
        test.skip(true, "BYOC token already activated for this user — skipping happy path");
        return;
      }
      await page.screenshot({ path: milestonePath("byoc-01-recognition-debug"), fullPage: true });
      const bodyText = await page.locator("body").innerText().catch(() => "(empty)");
      throw new Error(
        `Recognition screen not found — unexpected state.\nURL: ${url}\nBody: ${bodyText.slice(0, 500)}`
      );
    }

    // ── Screen 1: Provider Recognition ──
    await page.screenshot({ path: milestonePath("byoc-01-recognition") });
    await page.getByRole("button", { name: /continue/i }).first().click();

    // ── Screen 2: Confirm Service ──
    await expect(
      page.getByText(/found your service|confirm.*service/i).first()
    ).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: milestonePath("byoc-02-confirm") });
    await page.getByRole("button", { name: /yes|looks right|continue/i }).first().click();

    // ── Screen 3: Property / Your Home ──
    // After confirm, wizard may show property screen OR fallback if invite was
    // already activated by a previous test run.
    const propertyScreen = page.getByText(/about your home|your home|tell us about/i).first();
    const inviteFallback = page.getByText(/no longer active|invitation is no longer/i).first();
    await expect(propertyScreen.or(inviteFallback)).toBeVisible({ timeout: 15000 });
    if (await inviteFallback.isVisible()) {
      test.skip(true, "BYOC invite became inactive after confirm (already activated) — skipping");
      return;
    }
    await page.screenshot({ path: milestonePath("byoc-03-property") });

    const street = uniqueStreet();
    const streetInput = page.getByLabel(/street/i).first();
    if (await streetInput.isVisible()) await streetInput.fill(street);
    const cityInput = page.getByLabel(/city/i).first();
    if (await cityInput.isVisible()) await cityInput.fill("Austin");
    const stateInput = page.getByLabel(/state/i).first();
    if (await stateInput.isVisible()) await stateInput.fill("TX");
    const zipInput = page.getByLabel(/zip/i).first();
    if (await zipInput.isVisible()) await zipInput.fill("78701");

    await page.getByRole("button", { name: /continue|next/i }).first().click();

    // ── Screens 4–4b: Home Setup + Activating ──
    // Home setup has phases (coverage, sizing). "Skip for now" triggers an async
    // activation API call. If activation fails, wizard reverts to home_setup.
    // The skip button gets disabled (pointer-events:none) during the async call,
    // so we wrap clicks in try/catch and wait longer for transitions.
    const postSetupKeywords = [
      "many homes also need", "connecting your provider", "your home is ready",
      "no longer active", "simplest way to handle",
    ];
    let reachedPostSetup = false;
    for (let attempt = 0; attempt < 6; attempt++) {
      const bodyText = await page.locator("body").innerText().catch(() => "");
      const lower = bodyText.toLowerCase();
      if (postSetupKeywords.some((kw) => lower.includes(kw))) {
        reachedPostSetup = true;
        break;
      }

      if (attempt === 0) {
        await page.screenshot({ path: milestonePath("byoc-04-home-setup") });
      }

      // Try skip first, then continue — wrapped in try/catch because buttons
      // may be disabled (pointer-events:none) during async activation calls
      try {
        const skip = page.getByRole("button", { name: /skip/i }).first();
        if (await skip.isVisible()) {
          await skip.click({ timeout: 5000 });
          await page.waitForTimeout(3000);
          continue;
        }
      } catch {
        // Button was visible but disabled/loading — wait for transition
        await page.waitForTimeout(3000);
        continue;
      }
      try {
        const cont = page.getByRole("button", { name: /continue|next/i }).first();
        if (await cont.isVisible()) {
          await cont.click({ timeout: 5000 });
          await page.waitForTimeout(3000);
          continue;
        }
      } catch {
        await page.waitForTimeout(3000);
        continue;
      }
      await page.waitForTimeout(3000);
    }

    if (!reachedPostSetup) {
      // Final check — maybe we arrived during the last wait
      await expect(
        page.getByText(/many homes also need|connecting your provider|your home is ready|no longer active|simplest way to handle/i).first()
      ).toBeVisible({ timeout: 15000 });
    }

    // If on activating spinner, wait for it to pass
    const activatingText = page.getByText(/connecting your provider/i).first();
    if (await activatingText.isVisible()) {
      await expect(
        page.getByText(/many homes also need|your home is ready|no longer active|simplest way to handle/i).first()
      ).toBeVisible({ timeout: 30000 });
    }

    // ── Screen 5: Services ──
    const servicesHeading = page.getByText(/many homes also need|also need help/i).first();
    if (await servicesHeading.isVisible()) {
      await page.screenshot({ path: milestonePath("byoc-05-services") });
      const skipServices = page.getByRole("button", { name: /skip|continue|next|done/i }).first();
      if (await skipServices.isVisible()) await skipServices.click();
    }

    // ── Screen 5b: Plan (may appear after services) ──
    const planHeading = page.getByText(/simplest way to handle|estimated monthly/i).first();
    if (await planHeading.isVisible()) {
      await page.screenshot({ path: milestonePath("byoc-05b-plan") });
      const planContinue = page.getByRole("button", { name: /continue|skip|next|done|looks good/i }).first();
      if (await planContinue.isVisible()) await planContinue.click();
    }

    // ── Screen 6: Success ──
    await expect(
      page.getByText(/your home is ready|success|all set/i).first()
    ).toBeVisible({ timeout: 15000 });
    await page.screenshot({ path: milestonePath("byoc-06-success") });

    const dashBtn = page.getByRole("button", { name: /dashboard|go to dashboard|get started/i }).first();
    if (await dashBtn.isVisible()) await dashBtn.click();

    // ── Screen 7: Dashboard ──
    await expect(
      page.getByText(/your home team|dashboard|home/i).first()
    ).toBeVisible({ timeout: 15000 });
    await page.screenshot({ path: milestonePath("byoc-07-dashboard") });
  });
});
