import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";

/**
 * Integration tests for run-dunning edge function.
 *
 * Tests cron auth guards, CORS, and response shape.
 * Requires a running Supabase instance with edge functions deployed.
 *
 * Run: deno test --allow-net --allow-env supabase/functions/run-dunning/index.test.ts
 */

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? Deno.env.get("VITE_SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;
const BASE = `${SUPABASE_URL}/functions/v1/run-dunning`;

Deno.test("CORS preflight returns 200", async () => {
  const res = await fetch(BASE, { method: "OPTIONS" });
  assertEquals(res.status, 200);
  await res.text();
});

Deno.test("rejects unauthenticated request", async () => {
  const res = await fetch(BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  });
  const status = res.status;
  const body = await res.text();
  assertEquals(
    status !== 200 && status !== 201,
    true,
    `Should reject unauthenticated request but returned ${status}: ${body}`,
  );
});

Deno.test("rejects anon key as cron secret", async () => {
  const res = await fetch(BASE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: "{}",
  });
  const status = res.status;
  const body = await res.text();
  assertEquals(
    status !== 200 && status !== 201,
    true,
    `Should reject anon key but returned ${status}: ${body}`,
  );
});

Deno.test("rejects invalid cron secret", async () => {
  const res = await fetch(BASE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer not-a-valid-cron-secret",
    },
    body: "{}",
  });
  const status = res.status;
  const body = await res.text();
  assertEquals(
    status !== 200 && status !== 201,
    true,
    `Should reject invalid secret but returned ${status}: ${body}`,
  );
  assertExists(body);
});

Deno.test("error response contains status and message fields", async () => {
  const res = await fetch(BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  });
  const body = await res.json();
  // run-dunning error responses return { status: "error", message: String(error) }
  assertExists(body.status);
  assertExists(body.message);
});
