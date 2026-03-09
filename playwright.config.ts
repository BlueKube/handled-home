import { defineConfig, devices } from "@playwright/test";

const BASE_URL =
  process.env.BASE_URL || "http://invalid-base-url-set-BASE_URL-secret";

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
      testIgnore: [/byoc-happy-path\.spec\.ts/, /screenshot-catalog\.spec\.ts/],
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
  ],
});
