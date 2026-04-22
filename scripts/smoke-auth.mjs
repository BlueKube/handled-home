// One-off Chromium smoke: verify the three bkennington+ test users can sign
// in against production and land on their role-appropriate surface.
// Uses the Chromium binary already pre-installed at /opt/pw-browsers — the
// iPhone-15 (WebKit) device emulation used by the real auth-setup spec isn't
// available in this sandbox, so we use a plain Chromium with a mobile-ish
// viewport. Storage state is NOT saved (not needed for the smoke); if we
// want it we can re-run against the real spec once WebKit is installed.

import { chromium } from "@playwright/test";

const BASE_URL = process.env.BASE_URL || "https://handledhome.app";

const USERS = [
  {
    label: "customer",
    email: process.env.CUSTOMER_EMAIL,
    password: process.env.CUSTOMER_PASSWORD,
    expectedPathFragment: "/customer",
  },
  {
    label: "provider",
    email: process.env.PROVIDER_EMAIL,
    password: process.env.PROVIDER_PASSWORD,
    expectedPathFragment: "/provider",
  },
  {
    label: "admin",
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD,
    expectedPathFragment: "/admin",
  },
];

async function smokeRole(browser, user) {
  if (!user.email || !user.password) {
    return {
      label: user.label,
      ok: false,
      reason: "missing email or password env var",
    };
  }

  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    // Sandbox egress proxies re-sign TLS with an untrusted CA; ignore for
    // this smoke since we're validating auth flow, not TLS.
    ignoreHTTPSErrors: true,
  });
  const page = await context.newPage();
  const consoleErrors = [];
  page.on("pageerror", (err) => consoleErrors.push(`pageerror: ${err.message}`));

  try {
    await page.goto(`${BASE_URL}/auth`, {
      waitUntil: "networkidle",
      timeout: 60_000,
    });
    try {
      await page.getByLabel(/email/i).waitFor({
        state: "visible",
        timeout: 20_000,
      });
    } catch (e) {
      // Dump what we got so we can see why the form isn't rendering.
      const html = await page.content().catch(() => "");
      const title = await page.title().catch(() => "");
      const url = page.url();
      throw new Error(
        `email label not visible. url=${url} title=${title} htmlStart=${html.slice(0, 400)}`,
      );
    }
    await page.getByLabel(/email/i).fill(user.email);
    await page.getByLabel(/password/i).fill(user.password);
    await Promise.all([
      page.waitForURL((url) => !url.pathname.startsWith("/auth"), {
        timeout: 30_000,
      }),
      page.getByRole("button", { name: /sign in|log in/i }).click(),
    ]);
    const landed = new URL(page.url()).pathname;
    const matched = landed.startsWith(user.expectedPathFragment);
    return {
      label: user.label,
      ok: matched,
      landed,
      consoleErrors,
      reason: matched
        ? undefined
        : `landed at ${landed}, expected prefix ${user.expectedPathFragment}`,
    };
  } catch (err) {
    return {
      label: user.label,
      ok: false,
      reason: err.message,
      consoleErrors,
    };
  } finally {
    await context.close();
  }
}

async function main() {
  // Pin the pre-installed Chromium by absolute path — Playwright 1.58 wants
  // chromium-1208 but only 1194 ships in this sandbox, and CDP is stable
  // enough between those builds for a simple auth smoke.
  const browser = await chromium.launch({
    headless: true,
    executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
    args: ["--no-sandbox", "--disable-gpu"],
  });
  try {
    const results = [];
    for (const user of USERS) {
      const r = await smokeRole(browser, user);
      results.push(r);
      const tag = r.ok ? "PASS" : "FAIL";
      const extra =
        r.reason ??
        (r.landed ? `landed=${r.landed}` : "") +
          (r.consoleErrors?.length
            ? ` pageerrors=${r.consoleErrors.length}`
            : "");
      console.log(`[${tag}] ${r.label}: ${extra}`);
    }
    const failed = results.filter((r) => !r.ok);
    if (failed.length > 0) {
      process.exitCode = 1;
    }
  } finally {
    await browser.close();
  }
}

main();
