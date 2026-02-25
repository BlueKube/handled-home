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
    const { email, full_name, zip_code, source, referral_code } = await req.json();

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: "Valid email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate zip code format (US 5-digit)
    if (!zip_code || !/^\d{5}$/.test(zip_code)) {
      return new Response(
        JSON.stringify({ error: "Valid 5-digit zip code is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Rate limit: max 5 entries from same email in last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count: recentCount } = await supabase
      .from("waitlist_entries")
      .select("id", { count: "exact", head: true })
      .eq("email", email)
      .gte("created_at", oneHourAgo);

    if ((recentCount ?? 0) >= 5) {
      return new Response(
        JSON.stringify({ error: "Too many requests. Please try again later." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Server-side zone lookup — no zone data leaked to client
    let zoneId: string | null = null;
    const { data: zones } = await supabase
      .from("zones")
      .select("id, zip_codes")
      .eq("status", "active");

    for (const zone of zones || []) {
      if ((zone.zip_codes as string[])?.includes(zip_code)) {
        zoneId = zone.id;
        break;
      }
    }

    // Insert waitlist entry
    const { error: insertError } = await supabase
      .from("waitlist_entries")
      .insert({
        email,
        full_name: full_name || null,
        zip_code,
        zone_id: zoneId,
        source: source || "website",
        referral_code: referral_code || null,
      });

    if (insertError) {
      if (insertError.message.includes("duplicate") || insertError.code === "23505") {
        return new Response(
          JSON.stringify({ error: "You're already on the waitlist for this area!" }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw insertError;
    }

    return new Response(
      JSON.stringify({ status: "ok" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("join-waitlist error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
