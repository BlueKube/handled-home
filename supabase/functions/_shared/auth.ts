/**
 * Shared authentication utilities for Edge Functions.
 *
 * Four auth modes:
 * - requireServiceRole  — for internal service-to-service calls (e.g. send-email)
 * - requireCronSecret   — for scheduled/cron functions (accepts service role key OR CRON_SECRET)
 * - requireUserJwt      — for user-facing endpoints (validates JWT, returns user)
 * - requireAdminJwt     — for admin-only endpoints (validates JWT + admin role)
 */

import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

function extractToken(req: Request): string | null {
  const header = req.headers.get("authorization") ?? "";
  const token = header.replace(/^Bearer\s+/i, "").trim();
  return token || null;
}

function createServiceClient(): SupabaseClient {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );
}

/**
 * Validates that the caller is using the service role key.
 * Use for internal service-to-service calls (e.g. send-email called by process-notification-events).
 * Throws a descriptive error on failure.
 */
export function requireServiceRole(req: Request): void {
  const token = extractToken(req);
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY not configured");
  }
  if (token !== serviceRoleKey) {
    throw new Error("Service role key required");
  }
}

/**
 * Validates that the caller is either using the service role key or the CRON_SECRET.
 * Use for scheduled/cron functions that may be called by pg_cron (service role) or
 * an external scheduler (CRON_SECRET).
 *
 * Rejects anon key — pg_cron should be configured to use the service role key.
 * Throws a descriptive error on failure.
 */
export function requireCronSecret(req: Request): void {
  const token = extractToken(req);
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const cronSecret = Deno.env.get("CRON_SECRET");

  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY not configured");
  }

  const isAuthorized =
    token === serviceRoleKey ||
    (cronSecret && cronSecret.length > 0 && token === cronSecret);

  if (!isAuthorized) {
    throw new Error("Cron secret or service role key required");
  }
}

/**
 * Validates a user JWT and returns the authenticated user.
 * Use for user-facing endpoints where any authenticated user can call.
 * Throws a descriptive error on failure.
 */
export async function requireUserJwt(
  req: Request,
): Promise<{ user: { id: string; email?: string }; supabase: SupabaseClient }> {
  const token = extractToken(req);
  if (!token) {
    throw new Error("Authorization header required");
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    throw new Error("Invalid or expired token");
  }

  return { user: { id: data.user.id, email: data.user.email }, supabase };
}

/**
 * Validates a user JWT AND verifies the user has the admin role.
 * Also accepts service role key or CRON_SECRET for dual-mode endpoints
 * (callable by both admins and cron).
 * Throws a descriptive error on failure.
 *
 * Returns { user, supabase } when called with a user JWT.
 * Returns { user: null, supabase } when called with service role / cron secret.
 */
export async function requireAdminOrCron(
  req: Request,
): Promise<{ user: { id: string; email?: string } | null; supabase: SupabaseClient }> {
  const token = extractToken(req);
  if (!token) {
    throw new Error("Authorization header required");
  }

  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const cronSecret = Deno.env.get("CRON_SECRET");
  const supabase = createServiceClient();

  // Allow service role or cron secret (for pg_cron / scheduled calls)
  if (
    token === serviceRoleKey ||
    (cronSecret && cronSecret.length > 0 && token === cronSecret)
  ) {
    return { user: null, supabase };
  }

  // Otherwise, validate as admin JWT
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    throw new Error("Invalid or expired token");
  }

  const { data: adminRole } = await supabase
    .from("user_roles")
    .select("id")
    .eq("user_id", data.user.id)
    .eq("role", "admin")
    .single();

  if (!adminRole) {
    throw new Error("Admin access required");
  }

  return { user: { id: data.user.id, email: data.user.email }, supabase };
}

/**
 * Validates a user JWT AND verifies the user has the admin role.
 * Does NOT accept service role or cron secret — admin JWT only.
 * Throws a descriptive error on failure.
 */
export async function requireAdminJwt(
  req: Request,
): Promise<{ user: { id: string; email?: string }; supabase: SupabaseClient }> {
  const token = extractToken(req);
  if (!token) {
    throw new Error("Authorization header required");
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    throw new Error("Invalid or expired token");
  }

  const { data: adminRole } = await supabase
    .from("user_roles")
    .select("id")
    .eq("user_id", data.user.id)
    .eq("role", "admin")
    .single();

  if (!adminRole) {
    throw new Error("Admin access required");
  }

  return { user: { id: data.user.id, email: data.user.email }, supabase };
}

/** Re-export for convenience — functions that need a service client after auth. */
export { createServiceClient };
