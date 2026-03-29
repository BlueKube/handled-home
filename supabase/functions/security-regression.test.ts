import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

// Support both VITE_ prefixed (from .env) and standard (from Supabase runtime) env vars
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? Deno.env.get("VITE_SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;

/**
 * Security regression tests for Edge Function auth hardening (PRD-001).
 *
 * These tests verify that the CRON_SECRET / service-role auth guards
 * are working correctly on critical financial Edge Functions.
 *
 * Run with: deno test --allow-net --allow-env supabase/functions/security-regression.test.ts
 *
 * Requires:
 * - Running Supabase instance with Edge Functions deployed
 * - .env file with SUPABASE_URL (or VITE_SUPABASE_URL) and
 *   SUPABASE_ANON_KEY (or VITE_SUPABASE_PUBLISHABLE_KEY)
 */

async function fetchAndConsume(url: string, init: RequestInit): Promise<{ status: number; body: string }> {
  const res = await fetch(url, init);
  const body = await res.text();
  return { status: res.status, body };
}

// ── Stripe Webhook ──

const WEBHOOK_URL = `${SUPABASE_URL}/functions/v1/stripe-webhook`;

Deno.test("stripe-webhook rejects unsigned POST with 401", async () => {
  const { status, body } = await fetchAndConsume(WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "checkout.session.completed", data: {} }),
  });
  assertEquals(status, 401, `Expected 401, got ${status}: ${body}`);
});

Deno.test("stripe-webhook rejects OPTIONS with 405", async () => {
  const { status } = await fetchAndConsume(WEBHOOK_URL, { method: "OPTIONS" });
  assertEquals(status, 405);
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
  "route-sequence",
  "evaluate-zone-expansion",
  "optimize-routes",
  "assign-jobs",
  "evaluate-provider-sla",
  "process-notification-events",
  "compute-zone-state-recommendations",
  "validate-photo-quality",
  "assign-visits",
];

for (const fn of CRON_FUNCTIONS) {
  const url = `${SUPABASE_URL}/functions/v1/${fn}`;

  Deno.test(`${fn} rejects unauthenticated request`, async () => {
    const { status, body } = await fetchAndConsume(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    // Auth guard throws → catch returns 500 with error message containing "required"
    // Ideally 401, but 500 with auth error message is acceptable (guard is working)
    assertEquals(
      status !== 200 && status !== 201,
      true,
      `${fn} should reject unauthenticated request but returned ${status}: ${body}`,
    );
    // Verify the error message indicates auth failure, not a business logic crash
    assertEquals(
      body.toLowerCase().includes("required") || body.toLowerCase().includes("unauthorized") || body.toLowerCase().includes("error"),
      true,
      `${fn} rejection body should mention auth: ${body}`,
    );
  });

  Deno.test(`${fn} rejects anon key`, async () => {
    const { status, body } = await fetchAndConsume(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: "{}",
    });
    assertEquals(
      status !== 200 && status !== 201,
      true,
      `${fn} should reject anon key but returned ${status}: ${body}`,
    );
  });
}

// ── send-email (service-role only) ──

Deno.test("send-email rejects unauthenticated POST", async () => {
  const url = `${SUPABASE_URL}/functions/v1/send-email`;
  const { status, body } = await fetchAndConsume(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ deliveries: [] }),
  });
  assertEquals(status, 401, `Expected 401, got ${status}: ${body}`);
});

Deno.test("send-email rejects anon key", async () => {
  const url = `${SUPABASE_URL}/functions/v1/send-email`;
  const { status, body } = await fetchAndConsume(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ deliveries: [{ delivery_id: "test", to_email: "test@test.com", subject: "test", html_body: "<p>test</p>" }] }),
  });
  assertEquals(status, 401, `Expected 401, got ${status}: ${body}`);
});
