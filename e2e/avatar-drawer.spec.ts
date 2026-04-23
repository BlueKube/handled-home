import { test, expect } from "@playwright/test";

// Tier 4 spec for Round 64 Phase 5 Batch 5.2 (AvatarDrawer).
// Runs under the `chromium-mobile` project, which loads pre-authenticated
// customer storage state from `e2e/.auth/customer.json` via auth.setup.ts.
//
// Covers:
// 1. Avatar button renders with initials in AppHeader.
// 2. Tapping avatar opens the right-side drawer.
// 3. Each menu item navigates to the correct route and closes the drawer.
// 4. /customer?drawer=true auto-opens the drawer and strips the param.
// 5. /customer/more redirects to /customer?drawer=true and opens the drawer.
// 6. Sign-out confirmation dialog opens + cancel preserves the drawer.

test.describe("Avatar drawer (Batch 5.2)", () => {
  test("avatar opens drawer with menu items and user header", async ({ page }) => {
    await page.goto("/customer");

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
  });

  test("menu item navigation closes drawer and lands on the target route", async ({ page }) => {
    await page.goto("/customer");
    await page.getByRole("button", { name: /account menu/i }).click();

    await page.getByRole("button", { name: /^credits$/i }).click();

    await expect(page).toHaveURL(/\/customer\/credits$/);
    await expect(page.getByRole("dialog").first()).not.toBeVisible();
  });

  test("?drawer=true auto-opens the drawer and strips the param", async ({ page }) => {
    await page.goto("/customer?drawer=true");

    await expect(page.getByRole("dialog").first()).toBeVisible({ timeout: 10_000 });

    // URL has been cleaned — drawer param removed via replace.
    await expect(page).toHaveURL(/\/customer$/);
    expect(page.url()).not.toContain("drawer=true");
  });

  test("/customer/more redirects and the drawer opens", async ({ page }) => {
    await page.goto("/customer/more");

    await expect(page).toHaveURL(/\/customer(\?.*)?$/, { timeout: 10_000 });
    await expect(page.getByRole("dialog").first()).toBeVisible();
  });

  test("sign-out confirmation opens and cancels without closing the drawer", async ({ page }) => {
    await page.goto("/customer");
    await page.getByRole("button", { name: /account menu/i }).click();

    const drawer = page.getByRole("dialog").first();
    await drawer.getByRole("button", { name: /^sign out$/i }).click();

    // AlertDialog appears on top of the drawer.
    const confirm = page.getByRole("alertdialog");
    await expect(confirm).toBeVisible();
    await expect(confirm.getByText(/sign out\?/i)).toBeVisible();

    await confirm.getByRole("button", { name: /^cancel$/i }).click();
    await expect(confirm).not.toBeVisible();

    // Drawer still open (F3 fix — Escape/cancel don't bubble to close the Sheet).
    await expect(drawer).toBeVisible();
  });
});
