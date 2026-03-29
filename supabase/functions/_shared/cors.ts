/**
 * Shared CORS headers for Edge Functions.
 *
 * - `corsHeaders` — for browser-callable endpoints (user-facing: checkout, portal, etc.)
 *   Uses wildcard origin because Supabase Edge Functions are cross-origin by nature
 *   and the app may be served from localhost, preview URLs, or production domains.
 *   Auth is enforced via JWT/service-role checks, not CORS origin restriction.
 *
 * - `noCorsHeaders` — for server-to-server endpoints (webhooks, cron, internal)
 *   No CORS headers at all. These endpoints should never be called from a browser.
 */

export const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/** Use for webhooks and cron endpoints that should never be called from a browser. */
export const noCorsHeaders: Record<string, string> = {
  "Content-Type": "application/json",
};

/** Standard OPTIONS preflight response. */
export function handleCors(req: Request): Response | null {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  return null;
}
