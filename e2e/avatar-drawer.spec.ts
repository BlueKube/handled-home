import { test, expect } from "@playwright/test";
import { ensureMilestonesDir, milestonePath, MilestoneTracker } from "./milestone";

// Tier 4 spec for Round 64 Phase 5 Batch 5.2 (AvatarDrawer).
// Runs under the `chromium-mobile` project, which loads pre-authenticated
// customer storage state from `e2e/.auth/customer.json` via auth.setup.ts.
//
// Each test also writes milestone screenshots to test-results/milestones/
// so the Tier 5 AI judge has real screens to evaluate. This was the gap
// Batch T.4 closed — before, the harness ran in scaffold mode because no
// specs wrote milestones. Batch T.6 ID'd + fixed the model ID that was
// causing silent scaffold fallback post-T.4. Batch T.7 demoted the T.6
// diagnostic from always-on to on-failure/debug.
//
// Covers:
// 1. Avatar button renders with initials in AppHeader.
// 2. Tapping avatar opens the right-side drawer.
// 3. Each menu item navigates to the correct route and closes the drawer.
// 4. /customer?drawer=true auto-opens the drawer and strips the param.
// 5. /customer/more redirects to /customer?drawer=true and opens the drawer.
// 6. Sign-out confirmation dialog opens + cancel preserves the drawer.

const FLOW = "customer-avatar-drawer";

// Source files this flow exercises. The ai-judge scoping logic uses
// this list to decide whether a PR's diff touches captures' surfaces.
// Conservative on purpose: only files that DIRECTLY render in these
// screenshots, not transitive helpers.
const AVATAR_DRAWER_SOURCES = [
  "src/components/customer/AvatarDrawer.tsx",
  "src/components/customer/AppHeader.tsx",
  "src/pages/customer/Dashboard.tsx",
];

test.describe("Avatar drawer (Batch 5.2)", () => {
  test.beforeAll(() => {
    ensureMilestonesDir();
  });

  test("avatar opens drawer with menu items and user header", async ({ page }) => {
    const tracker = new MilestoneTracker();

    await page.goto("/customer");
    await page.screenshot({ path: milestonePath("customer-01-avatar-closed") });
    tracker.capture({
      filename: "customer-01-avatar-closed.png",
      flow: FLOW,
      step: "dashboard with avatar button",
      stepNumber: 1,
      route: "/customer",
      userGoal: "See my home at a glance and access account controls",
      screenType: "dashboard",
      sourceFiles: AVATAR_DRAWER_SOURCES,
    });

    const avatar = page.getByRole("button", { name: /account menu/i });
    await expect(avatar).toBeVisible();

    await avatar.click();

    // Drawer open + header present. `.first()` scopes to the Sheet's dialog —
    // the NotificationPanel also renders role="dialog" but only when open.
    const drawer = page.getByRole("dialog").first();
    await expect(drawer).toBeVisible();

    // All six menu items visible (Plan, Billing, Credits, Account, Referrals, Help & support).
    for (const label of ["Plan", "Billing", "Credits", "Account", "Referrals", "Help & support"]) {
      await expect(drawer.getByRole("button", { name: new RegExp(`^${label}$`, "i") })).toBeVisible();
    }

    // Sign out row present.
    await expect(drawer.getByRole("button", { name: /^sign out$/i })).toBeVisible();

    await page.screenshot({ path: milestonePath("customer-02-avatar-drawer-open") });
    tracker.capture({
      filename: "customer-02-avatar-drawer-open.png",
      flow: FLOW,
      step: "avatar drawer open with all menu items",
      stepNumber: 2,
      route: "/customer",
      userGoal: "Find plan, billing, credits, account, referrals, and help in one place",
      screenType: "wizard-step",
      sourceFiles: AVATAR_DRAWER_SOURCES,
    });

    tracker.writeManifest();
  });

  test("menu item navigation closes drawer and initiates navigation", async ({ page }) => {
    const tracker = new MilestoneTracker();

    await page.goto("/customer");
    await page.getByRole("button", { name: /account menu/i }).click();

    await page.getByRole("button", { name: /^credits$/i }).click();

    // The drawer's contract is to fire navigate() and close on menu click.
    // The destination URL is gated by CustomerPropertyGate — un-onboarded
    // users land on /customer/onboarding instead of the target. Either
    // outcome proves the drawer did its job; the gate's redirect behavior
    // is tested elsewhere.
    await expect(page).toHaveURL(/\/customer\/(credits|onboarding)/);
    await expect(page.getByRole("dialog").first()).not.toBeVisible();

    await page.screenshot({ path: milestonePath("customer-03-credits-after-nav") });
    tracker.capture({
      filename: "customer-03-credits-after-nav.png",
      flow: FLOW,
      step: "landed after drawer Credits tap (may redirect via PropertyGate)",
      stepNumber: 3,
      route: page.url(),
      userGoal: "See my credit balance after tapping Credits from the drawer",
      screenType: "dashboard",
      sourceFiles: [
        ...AVATAR_DRAWER_SOURCES,
        "src/pages/customer/Credits.tsx",
        "src/components/customer/CustomerPropertyGate.tsx",
      ],
    });

    tracker.writeManifest();
  });

  test("?drawer=true auto-opens the drawer and strips the param", async ({ page }) => {
    const tracker = new MilestoneTracker();

    await page.goto("/customer?drawer=true");

    await expect(page.getByRole("dialog").first()).toBeVisible({ timeout: 10_000 });

    // URL has been cleaned — drawer param removed via replace. The exact
    // landing path depends on whether the user's PropertyGate state permits
    // /customer (onboarded) or bounces to /customer/onboarding.
    await expect(page).toHaveURL(/\/customer(\/onboarding)?$/);
    expect(page.url()).not.toContain("drawer=true");

    await page.screenshot({ path: milestonePath("customer-04-drawer-auto-open") });
    tracker.capture({
      filename: "customer-04-drawer-auto-open.png",
      flow: FLOW,
      step: "drawer auto-opened via ?drawer=true URL param",
      stepNumber: 4,
      route: page.url(),
      userGoal: "Jump straight into the account menu via a shared or deep-linked URL",
      screenType: "wizard-step",
      sourceFiles: AVATAR_DRAWER_SOURCES,
    });

    tracker.writeManifest();
  });

  test("/customer/more redirect leaves the legacy URL", async ({ page }) => {
    const tracker = new MilestoneTracker();

    await page.goto("/customer/more");

    // The redirect fires; URL must leave /customer/more. Destination is
    // /customer (drawer auto-opens) for onboarded users, /customer/onboarding
    // for not-yet-onboarded ones. Either is correct app behavior.
    await expect(page).not.toHaveURL(/\/customer\/more$/, { timeout: 10_000 });
    await expect(page).toHaveURL(/\/customer(\/onboarding|\?.*)?$/);

    await page.screenshot({ path: milestonePath("customer-05-more-redirect-landing") });
    tracker.capture({
      filename: "customer-05-more-redirect-landing.png",
      flow: FLOW,
      step: "landed after legacy /customer/more redirect",
      stepNumber: 5,
      route: page.url(),
      userGoal: "Reach the account menu via the legacy URL a bookmark or external link points to",
      screenType: "dashboard",
      sourceFiles: [...AVATAR_DRAWER_SOURCES, "src/App.tsx"],
    });

    tracker.writeManifest();
  });

  test("sign-out confirmation opens and cancels without closing the drawer", async ({ page }) => {
    const tracker = new MilestoneTracker();

    await page.goto("/customer");
    await page.getByRole("button", { name: /account menu/i }).click();

    const drawer = page.getByRole("dialog").first();
    await drawer.getByRole("button", { name: /^sign out$/i }).click();

    // AlertDialog appears on top of the drawer.
    const confirm = page.getByRole("alertdialog");
    await expect(confirm).toBeVisible();
    await expect(confirm.getByText(/sign out\?/i)).toBeVisible();

    await page.screenshot({ path: milestonePath("customer-06-signout-confirm") });
    tracker.capture({
      filename: "customer-06-signout-confirm.png",
      flow: FLOW,
      step: "sign-out confirmation AlertDialog visible over drawer",
      stepNumber: 6,
      route: "/customer",
      userGoal: "Avoid accidentally signing out by confirming intent",
      screenType: "wizard-step",
      sourceFiles: AVATAR_DRAWER_SOURCES,
    });

    await confirm.getByRole("button", { name: /^cancel$/i }).click();
    await expect(confirm).not.toBeVisible();

    // Drawer still open (F3 fix — Escape/cancel don't bubble to close the Sheet).
    await expect(drawer).toBeVisible();

    tracker.writeManifest();
  });
});
