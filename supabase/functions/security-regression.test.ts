import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;

/**
 * Security regression tests for Edge Function auth hardening (PRD-001).
 *
 * These tests verify that the CRON_SECRET / service-role auth guards
 * are working correctly on critical financial Edge Functions.
 *
 * Run with: deno test --allow-net --allow-env supabase/functions/security-regression.test.ts
 */

// ── Stripe Webhook ──

const WEBHOOK_URL = `${SUPABASE_URL}/functions/v1/stripe-webhook`;

Deno.test("stripe-webhook rejects unsigned POST", async () => {
  const res = await fetch(WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "checkout.session.completed", data: {} }),
  });
  // Should reject — no stripe-signature header
  const status = res.status;
  await res.text(); // consume body
  assertEquals(status === 401 || status === 400 || status === 500, true, `Expected 401/400/500, got ${status}`);
});

Deno.test("stripe-webhook rejects OPTIONS (server-to-server only)", async () => {
  const res = await fetch(WEBHOOK_URL, { method: "OPTIONS" });
  assertEquals(res.status, 405);
  await res.text();
});

// ── Cron-Protected Functions ──

const CRON_FUNCTIONS = [
  "run-dunning",
  "run-billing-automation",
  "run-nightly-planner",
  "run-scheduled-jobs",
  "compute-quality-scores",
  "snapshot-rollup",
  "check-weather",
  "cleanup-expired-offers",
  "send-reminders",
  "check-no-shows",
];

for (const fn of CRON_FUNCTIONS) {
  const url = `${SUPABASE_URL}/functions/v1/${fn}`;

  Deno.test(`${fn} rejects unauthenticated request`, async () => {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    const status = res.status;
    await res.text();
    // Should be 401 (auth required) or 500 (if throw is uncaught — still rejected)
    assertEquals(status === 401 || status === 500, true, `Expected 401/500, got ${status}`);
  });

  Deno.test(`${fn} rejects anon key`, async () => {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: "{}",
    });
    const status = res.status;
    await res.text();
    // Anon key should NOT be accepted by cron-protected functions
    assertEquals(status === 401 || status === 500, true, `Expected 401/500, got ${status} — anon key should be rejected`);
  });
}

// ── send-email (service-role only) ──

Deno.test("send-email rejects unauthenticated request", async () => {
  const url = `${SUPABASE_URL}/functions/v1/send-email`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ deliveries: [] }),
  });
  const status = res.status;
  await res.text();
  assertEquals(status === 401 || status === 405 || status === 500, true, `Expected rejection, got ${status}`);
});

Deno.test("send-email rejects anon key", async () => {
  const url = `${SUPABASE_URL}/functions/v1/send-email`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ deliveries: [{ delivery_id: "test", to_email: "test@test.com", subject: "test", html_body: "<p>test</p>" }] }),
  });
  const status = res.status;
  await res.text();
  assertEquals(status === 401 || status === 500, true, `Expected rejection, got ${status} — send-email should not accept anon key`);
});
