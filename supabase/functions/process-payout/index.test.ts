import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";

/**
 * Integration tests for process-payout edge function.
 *
 * Tests auth guards, input validation, and response shape.
 * Requires a running Supabase instance with edge functions deployed.
 *
 * Run: deno test --allow-net --allow-env supabase/functions/process-payout/index.test.ts
 */

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? Deno.env.get("VITE_SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;
const BASE = `${SUPABASE_URL}/functions/v1/process-payout`;

Deno.test("CORS preflight returns 200", async () => {
  const res = await fetch(BASE, { method: "OPTIONS" });
  assertEquals(res.status, 200);
  await res.text();
});

Deno.test("rejects request without auth header", async () => {
  const res = await fetch(BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ payout_id: "test" }),
  });
  assertEquals(res.status, 500);
  const body = await res.json();
  assertExists(body.error);
  assertEquals(body.error.toLowerCase().includes("authorization") || body.error.toLowerCase().includes("unauthorized"), true);
});

Deno.test("rejects anon key as admin token", async () => {
  const res = await fetch(BASE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ payout_id: "test" }),
  });
  const status = res.status;
  const body = await res.json();
  assertEquals(status, 500);
  assertExists(body.error);
});

Deno.test("rejects invalid token with empty body", async () => {
  // Note: auth fails before payout_id validation runs.
  // payout_id validation is tested at staging level with valid admin credentials.
  const res = await fetch(BASE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer invalid-token",
    },
    body: JSON.stringify({}),
  });
  assertEquals(res.status, 500);
  const body = await res.json();
  assertExists(body.error);
});

Deno.test("rejects invalid token with payout_id in body", async () => {
  // Note: auth fails before payout_id lookup runs.
  // Payout lookup and Stripe transfer are tested at staging level.
  const res = await fetch(BASE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer invalid-token",
    },
    body: JSON.stringify({ payout_id: "00000000-0000-0000-0000-000000000000" }),
  });
  assertEquals(res.status, 500);
  const body = await res.json();
  assertExists(body.error);
});
