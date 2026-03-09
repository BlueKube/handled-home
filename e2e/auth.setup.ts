import { test as setup, expect } from "@playwright/test";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Shared login helper — navigates to /auth, fills credentials, waits for
 * redirect, then persists the authenticated storage state to `outPath`.
 */
async function loginAndSave(
  page: import("@playwright/test").Page,
  email: string,
  password: string,
  outPath: string,
  label: string
) {
  await page.goto("/auth", { waitUntil: "networkidle", timeout: 60000 });

  try {
    await page.getByLabel(/email/i).waitFor({ state: "visible", timeout: 60000 });
  } catch {
    await page.screenshot({ path: `test-results/auth-setup-${label}-debug.png`, fullPage: true });
    const bodyText = await page.locator("body").innerText().catch(() => "(empty)");
    throw new Error(
      `Auth form not found after 60s (${label}). URL: ${page.url()}\nBody: ${bodyText.slice(0, 500)}`
    );
  }

  // Ensure form is fully interactive after hydration
  await page.waitForTimeout(1000);

  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole("button", { name: /sign in|log in/i }).click();

  // Wait for auth to complete — expect redirect away from /auth
  await expect(page).not.toHaveURL(/\/auth/, { timeout: 30000 });

  await page.context().storageState({ path: outPath });
}

/**
 * Helper to read a pair of env vars and throw if either is missing.
 */
function requireCredentials(emailVar: string, passwordVar: string) {
  const email = process.env[emailVar];
  const password = process.env[passwordVar];
  if (!email || !password) {
    throw new Error(`${emailVar} and ${passwordVar} must be set as environment variables`);
  }
  return { email, password };
}

// ── Customer auth ──
setup("authenticate customer user", async ({ page }) => {
  const { email, password } = requireCredentials(
    "TEST_CUSTOMER_EMAIL",
    "TEST_CUSTOMER_PASSWORD"
  );
  await loginAndSave(
    page,
    email,
    password,
    path.join(__dirname, ".auth", "customer.json"),
    "customer"
  );
});

// ── Provider auth ──
setup("authenticate provider user", async ({ page }) => {
  const { email, password } = requireCredentials(
    "TEST_PROVIDER_EMAIL",
    "TEST_PROVIDER_PASSWORD"
  );
  await loginAndSave(
    page,
    email,
    password,
    path.join(__dirname, ".auth", "provider.json"),
    "provider"
  );
});

// ── Admin auth ──
setup("authenticate admin user", async ({ page }) => {
  const { email, password } = requireCredentials(
    "TEST_ADMIN_EMAIL",
    "TEST_ADMIN_PASSWORD"
  );
  await loginAndSave(
    page,
    email,
    password,
    path.join(__dirname, ".auth", "admin.json"),
    "admin"
  );
});
