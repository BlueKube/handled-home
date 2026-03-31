import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";

/**
 * Integration tests for create-checkout-session edge function.
 *
 * Tests JWT auth guards, input validation, CORS, and response shape.
 * Requires a running Supabase instance with edge functions deployed.
 *
 * Run: deno test --allow-net --allow-env supabase/functions/create-checkout-session/index.test.ts
 */

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? Deno.env.get("VITE_SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;
const BASE = `${SUPABASE_URL}/functions/v1/create-checkout-session`;

Deno.test("CORS preflight returns 200", async () => {
  const res = await fetch(BASE, { method: "OPTIONS" });
  assertEquals(res.status, 200);
  await res.text();
});

Deno.test("rejects request without auth header", async () => {
  const res = await fetch(BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ plan_id: "test" }),
  });
  assertEquals(res.status, 401);
  const body = await res.json();
  assertEquals(body.error, "Unauthorized");
});

Deno.test("rejects request with anon key as Bearer", async () => {
  const res = await fetch(BASE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ plan_id: "test" }),
  });
  // anon key is not a valid user JWT — should get 401
  assertEquals(res.status, 401);
  const body = await res.json();
  assertEquals(body.error, "Unauthorized");
});

Deno.test("rejects request without Bearer prefix", async () => {
  const res = await fetch(BASE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Basic invalid-token",
    },
    body: JSON.stringify({ plan_id: "test" }),
  });
  assertEquals(res.status, 401);
  const body = await res.json();
  assertEquals(body.error, "Unauthorized");
});

Deno.test("rejects request with invalid JWT", async () => {
  const res = await fetch(BASE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY,
      Authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
    },
    body: JSON.stringify({ plan_id: "test" }),
  });
  // Invalid JWT should fail claims extraction — handler returns 401
  const status = res.status;
  assertEquals(status, 401);
  const body = await res.json();
  assertExists(body.error);
});

Deno.test("auth rejection returns structured error on empty body", async () => {
  // Note: auth fails before plan_id validation runs.
  // plan_id validation (400 "plan_id is required") requires valid JWT
  // and is tested at staging level.
  const res = await fetch(BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  assertEquals(res.status, 401);
  const body = await res.json();
  assertExists(body.error);
});
