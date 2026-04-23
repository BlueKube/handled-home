import { defineConfig, devices } from "@playwright/test";

const BASE_URL =
  process.env.BASE_URL || "http://invalid-base-url-set-BASE_URL-secret";

// Vercel Preview deployments are protected by default; the bypass secret is
// forwarded as a header so Playwright can reach the preview URL. Local runs
// against prod (`handledhome.app`) or the dev server skip the header.
const bypassSecret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
// Vercel's documented values for x-vercel-set-bypass-cookie are "samesitenone"
// or "true"; the integer string "1" is not specified. Using "samesitenone"
// lets the cookie apply to cross-site navigations (Playwright context) and is
// the form used by Vercel's own automation examples.
const extraHTTPHeaders = bypassSecret
  ? { "x-vercel-protection-bypass": bypassSecret, "x-vercel-set-bypass-cookie": "samesitenone" }
  : undefined;

export default defineConfig({
  testDir: "./e2e",
  outputDir: "test-results",
  timeout: 120_000,
  expect: { timeout: 30_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["html"], ["list"]],

  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    video: "retain-on-failure",
    screenshot: "only-on-failure",
    navigationTimeout: 60_000,
    actionTimeout: 15_000,
    extraHTTPHeaders,
  },

  projects: [
    // ── Auth setup (logs in all three role users) ──
    {
      name: "auth-setup",
      testMatch: /auth\.setup\.ts/,
      use: { ...devices["iPhone 15"] },
    },

    // ── Pre-authenticated tests (customer role) ──
    {
      name: "chromium-mobile",
      use: {
        ...devices["iPhone 15"],
        storageState: "e2e/.auth/customer.json",
      },
      testIgnore: [/byoc-happy-path\.spec\.ts/, /screenshot-catalog\.spec\.ts/, /academy-screenshots\.spec\.ts/],
      dependencies: ["auth-setup"],
    },

    // ── No-auth tests (BYOC happy path starts unauthenticated) ──
    {
      name: "chromium-mobile-no-auth",
      testMatch: /byoc-happy-path\.spec\.ts/,
      use: { ...devices["iPhone 15"] },
    },

    // ── Screenshot catalog (uses per-role auth internally) ──
    {
      name: "screenshot-catalog",
      testMatch: /screenshot-catalog\.spec\.ts/,
      use: { ...devices["iPhone 15"] },
      dependencies: ["auth-setup"],
    },

    // ── Academy screenshots (admin-only, desktop viewport) ──
    {
      name: "academy-screenshots",
      testMatch: /academy-screenshots\.spec\.ts/,
      use: { viewport: { width: 1440, height: 900 } },
      dependencies: ["auth-setup"],
    },
  ],
});
