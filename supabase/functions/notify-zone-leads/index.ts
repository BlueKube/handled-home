import { requireAdminOrCron } from "../_shared/auth.ts";
import { corsHeaders, handleCors } from "../_shared/cors.ts";

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const { supabase } = await requireAdminOrCron(req);

    const { zone_id } = await req.json();
    if (!zone_id) {
      return new Response(
        JSON.stringify({ error: "zone_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Fetch zone's ZIP codes
    const { data: zone, error: zoneError } = await supabase
      .from("zones")
      .select("id, name, zip_codes")
      .eq("id", zone_id)
      .single();

    if (zoneError || !zone) {
      return new Response(
        JSON.stringify({ error: "Zone not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const zipCodes = zone.zip_codes as string[];
    if (!zipCodes || zipCodes.length === 0) {
      return new Response(
        JSON.stringify({ notified_count: 0, lead_emails: [], message: "Zone has no ZIP codes" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Find matching leads that haven't been notified yet
    const { data: matchingLeads, error: leadsError } = await supabase
      .from("provider_leads")
      .select("id, email")
      .in("zip_code", zipCodes)
      .eq("status", "new");

    if (leadsError) {
      return new Response(
        JSON.stringify({ error: "Failed to query leads" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!matchingLeads || matchingLeads.length === 0) {
      return new Response(
        JSON.stringify({ notified_count: 0, lead_emails: [], message: "No matching leads for this zone" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Update matching leads to "notified" status
    const leadIds = matchingLeads.map((l: { id: string }) => l.id);
    const { error: updateError } = await supabase
      .from("provider_leads")
      .update({ status: "notified" })
      .in("id", leadIds);

    if (updateError) {
      return new Response(
        JSON.stringify({ error: "Failed to update lead statuses" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const leadEmails = matchingLeads.map((l: { email: string }) => l.email);

    // TODO: Send actual notification emails via send-email edge function
    // For now, we just mark leads as notified. When email integration is ready,
    // iterate over leadEmails and send "Zone launching" template.

    return new Response(
      JSON.stringify({
        notified_count: leadEmails.length,
        lead_emails: leadEmails,
        zone_name: zone.name,
        message: `Marked ${leadEmails.length} leads as notified for zone "${zone.name}"`,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    const status = message.includes("required") || message.includes("access") ? 401 : 500;
    return new Response(
      JSON.stringify({ error: message }),
      { status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
