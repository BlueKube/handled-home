/**
 * Shared CORS headers for Edge Functions.
 *
 * - `corsHeaders` — standard headers for browser-callable endpoints
 * - `noCorsHeaders` — for server-to-server endpoints (webhooks, cron)
 */

export const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-cron-secret",
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
