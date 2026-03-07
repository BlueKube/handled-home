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

  // Wait for the auth form to render — capture screenshot on failure for diagnostics
  try {
    await Promise.race([
      page.waitForSelector('input[placeholder*="mail" i]', { timeout: 45000 }),
      page.waitForSelector('input[type="email"]', { timeout: 45000 }),
    ]);
  } catch {
    await page.screenshot({ path: "test-results/auth-setup-debug.png", fullPage: true });
    const bodyText = await page.locator("body").innerText().catch(() => "(empty)");
    throw new Error(`Auth form not found after 45s. URL: ${page.url()}\nBody: ${bodyText.slice(0, 500)}`);
  }

  // Ensure form is fully interactive
  await page.waitForTimeout(500);

  await page.getByPlaceholder(/email/i).fill(email);
  await page.getByPlaceholder(/password/i).fill(password);
  await page.getByRole("button", { name: /sign in|log in/i }).click();

  // Wait for auth to complete — expect redirect away from /auth
  await expect(page).not.toHaveURL(/\/auth/, { timeout: 15000 });

  await page.context().storageState({ path: authFile });
});
