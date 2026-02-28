import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Parse which job(s) to run — supports targeted invocation or "all"
    let body: { job?: string } = {};
    try {
      body = await req.json();
    } catch {
      // No body = run all daily jobs
    }

    const job = body.job || "all";
    const results: Record<string, unknown> = {};
    const errors: string[] = [];

    // Determine current day of week (0=Sun, 1=Mon, ..., 6=Sat)
    const now = new Date();
    const dayOfWeek = now.getUTCDay();
    const isMonday = dayOfWeek === 1;

    // ── Daily: BYOC lifecycle transitions ──
    if (job === "all" || job === "byoc_lifecycle") {
      console.log("Running BYOC lifecycle transitions...");
      const { data, error } = await supabase.rpc("run_byoc_lifecycle_transitions");
      if (error) {
        console.error("BYOC lifecycle failed:", error);
        errors.push(`byoc_lifecycle: ${error.message}`);
      } else {
        results.byoc_lifecycle = data;
        console.log("BYOC lifecycle result:", data);
      }
    }

    // ── Weekly (Monday): BYOC bonus computation ──
    if (job === "compute_byoc_bonuses" || (job === "all" && isMonday)) {
      console.log("Running BYOC bonus computation...");
      // Previous week's Monday
      const prevMonday = new Date(now);
      prevMonday.setUTCDate(now.getUTCDate() - 7);
      // Align to Monday
      const mondayOffset = prevMonday.getUTCDay() === 0 ? 6 : prevMonday.getUTCDay() - 1;
      prevMonday.setUTCDate(prevMonday.getUTCDate() - mondayOffset);
      const weekStart = prevMonday.toISOString().split("T")[0];

      const { data, error } = await supabase.rpc("compute_byoc_bonuses", {
        p_week_start: weekStart,
      });
      if (error) {
        console.error("BYOC bonuses failed:", error);
        errors.push(`compute_byoc_bonuses: ${error.message}`);
      } else {
        results.compute_byoc_bonuses = data;
        console.log("BYOC bonuses result:", data);
      }
    }

    // ── Weekly (Monday): Provider weekly rollups ──
    if (job === "provider_weekly_rollups" || (job === "all" && isMonday)) {
      console.log("Running provider weekly rollups...");
      const { data, error } = await supabase.rpc("compute_provider_weekly_rollups");
      if (error) {
        console.error("Weekly rollups failed:", error);
        errors.push(`provider_weekly_rollups: ${error.message}`);
      } else {
        results.provider_weekly_rollups = data;
        console.log("Weekly rollups result:", data);
      }
    }

    const success = errors.length === 0;

    return new Response(
      JSON.stringify({ success, results, errors: errors.length > 0 ? errors : undefined }),
      {
        status: success ? 200 : 207,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
