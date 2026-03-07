import { test as setup, expect } from "@playwright/test";
import path from "path";

const authFile = path.join(__dirname, ".auth", "user.json");

setup("authenticate test user", async ({ page }) => {
  const email = process.env.TEST_USER_EMAIL;
  const password = process.env.TEST_USER_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "TEST_USER_EMAIL and TEST_USER_PASSWORD must be set as environment variables"
    );
  }

  await page.goto("/auth");
  await page.getByPlaceholder(/email/i).fill(email);
  await page.getByPlaceholder(/password/i).fill(password);
  await page.getByRole("button", { name: /sign in|log in/i }).click();

  // Wait for auth to complete — expect redirect away from /auth
  await expect(page).not.toHaveURL(/\/auth/, { timeout: 15000 });

  await page.context().storageState({ path: authFile });
});
