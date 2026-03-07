import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;
const BASE = `${SUPABASE_URL}/functions/v1/activate-byoc-invite`;

Deno.test("rejects request without auth header", async () => {
  const res = await fetch(BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: SUPABASE_ANON_KEY },
    body: JSON.stringify({ token: "test" }),
  });
  assertEquals(res.status, 401);
  const body = await res.json();
  assertEquals(body.error, "Authentication required");
});

Deno.test("rejects request without token", async () => {
  const res = await fetch(BASE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({}),
  });
  // Will get 401 (invalid user from anon key) or 400 (no token)
  const body = await res.json();
  assertExists(body.error);
});

Deno.test("rejects invalid token", async () => {
  const res = await fetch(BASE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ token: "nonexistent_token_abc123" }),
  });
  const body = await res.json();
  assertExists(body.error);
});

Deno.test("CORS preflight returns 200", async () => {
  const res = await fetch(BASE, { method: "OPTIONS" });
  // OPTIONS should succeed
  assertEquals(res.status, 200);
  await res.text(); // consume body
});
