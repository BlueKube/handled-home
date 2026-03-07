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
    {
      name: "auth-setup",
      testMatch: /auth\.setup\.ts/,
      use: { ...devices["iPhone 15"] },
    },
    {
      name: "chromium-mobile",
      use: { ...devices["iPhone 15"] },
      testIgnore: /byoc-happy-path\.spec\.ts/,
      dependencies: ["auth-setup"],
    },
    {
      name: "chromium-mobile-no-auth",
      testMatch: /byoc-happy-path\.spec\.ts/,
      use: { ...devices["iPhone 15"] },
    },
  ],
});
