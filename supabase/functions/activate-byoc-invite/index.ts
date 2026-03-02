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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // User client (to get auth user)
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid auth token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Service client for writes
    const admin = createClient(supabaseUrl, supabaseServiceKey);

    const { token, property_id, cadence } = await req.json();
    if (!token) {
      return new Response(JSON.stringify({ error: "Token is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. Validate token
    const { data: invite, error: inviteErr } = await admin
      .from("byoc_invite_links")
      .select("*")
      .eq("token", token)
      .eq("is_active", true)
      .maybeSingle();

    if (inviteErr || !invite) {
      return new Response(JSON.stringify({ error: "Invalid or expired invite link" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Check for duplicate activation
    const { data: existing } = await admin
      .from("byoc_activations")
      .select("id")
      .eq("invite_id", invite.id)
      .eq("customer_user_id", user.id)
      .maybeSingle();

    if (existing) {
      return new Response(JSON.stringify({ error: "You have already activated this invite" }), {
        status: 409,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. Create activation
    const { data: activation, error: actErr } = await admin
      .from("byoc_activations")
      .insert({
        invite_id: invite.id,
        customer_user_id: user.id,
        provider_org_id: invite.org_id,
        sku_id: invite.sku_id,
        level_id: invite.default_level_id,
        cadence: cadence || invite.default_cadence || "weekly",
        property_id: property_id || null,
        status: "active",
      })
      .select()
      .single();

    if (actErr) {
      console.error("Activation insert error:", actErr);
      return new Response(JSON.stringify({ error: "Failed to create activation" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 4. Log event
    await admin.from("byoc_invite_events").insert({
      invite_id: invite.id,
      event_type: "activated",
      actor: user.id,
      payload: {
        activation_id: activation.id,
        cadence: activation.cadence,
        sku_id: activation.sku_id,
        property_id: activation.property_id,
      },
    });

    // 5. Also log a "link_used" event for analytics
    await admin.from("byoc_invite_events").insert({
      invite_id: invite.id,
      event_type: "link_used",
      actor: user.id,
      payload: { source: "activation_page" },
    });

    return new Response(
      JSON.stringify({
        success: true,
        activation_id: activation.id,
        provider_org_id: invite.org_id,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("activate-byoc-invite error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
