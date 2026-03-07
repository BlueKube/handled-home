import { test as setup, expect } from "@playwright/test";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const authFile = path.join(__dirname, ".auth", "user.json");

setup("authenticate test user", async ({ page }) => {
  const email = process.env.TEST_USER_EMAIL;
  const password = process.env.TEST_USER_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "TEST_USER_EMAIL and TEST_USER_PASSWORD must be set as environment variables"
    );
  }

  // Navigate and wait for full page load (preview URL may cold-start)
  await page.goto("/auth", { waitUntil: "networkidle", timeout: 60000 });

  // Wait for the email input to be VISIBLE and actionable (not just in DOM).
  // This avoids the bug where waitForSelector finds a hidden input inside
  // an inactive Radix Tabs panel but getByPlaceholder can't interact with it.
  try {
    await page.getByPlaceholder(/email/i).waitFor({ state: "visible", timeout: 60000 });
  } catch {
    await page.screenshot({ path: "test-results/auth-setup-debug.png", fullPage: true });
    const bodyText = await page.locator("body").innerText().catch(() => "(empty)");
    throw new Error(`Auth form not found after 60s. URL: ${page.url()}\nBody: ${bodyText.slice(0, 500)}`);
  }

  // Ensure form is fully interactive after hydration
  await page.waitForTimeout(1000);

  await page.getByPlaceholder(/email/i).fill(email);
  await page.getByPlaceholder(/password/i).fill(password);
  await page.getByRole("button", { name: /sign in|log in/i }).click();

  // Wait for auth to complete — expect redirect away from /auth
  await expect(page).not.toHaveURL(/\/auth/, { timeout: 30000 });

  await page.context().storageState({ path: authFile });
});
