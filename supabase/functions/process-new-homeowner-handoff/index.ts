import { requireAdminOrCron } from "../_shared/auth.ts";
import { corsHeaders, handleCors } from "../_shared/cors.ts";

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const { supabase } = await requireAdminOrCron(req);

    // Find unprocessed transitions with new homeowner contact info
    const { data: transitions, error: fetchError } = await supabase
      .from("property_transitions")
      .select("id, property_id, new_owner_name, new_owner_email, new_owner_phone, new_zip")
      .eq("handoff_processed", false)
      .not("new_owner_email", "is", null);

    if (fetchError) {
      return new Response(
        JSON.stringify({ error: fetchError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!transitions || transitions.length === 0) {
      return new Response(
        JSON.stringify({ processed_count: 0, message: "No pending handoffs" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    let processedCount = 0;

    for (const t of transitions) {
      // Get the property's ZIP code for the customer lead
      const { data: property } = await supabase
        .from("properties")
        .select("zip_code")
        .eq("id", t.property_id)
        .single();

      const zipCode = property?.zip_code ?? t.new_zip ?? "";

      // Get the property's active subscription categories for context
      const { data: subs } = await supabase
        .from("subscriptions")
        .select("*, plans(name)")
        .eq("property_id", t.property_id)
        .in("status", ["active", "canceling"])
        .limit(1);

      const planName = subs?.[0]?.plans?.name ?? "Handled Home";

      // Create customer lead for the new homeowner
      if (t.new_owner_email) {
        const { error: leadError } = await supabase
          .from("customer_leads")
          .upsert(
            {
              email: t.new_owner_email,
              phone: t.new_owner_phone ?? null,
              zip_code: zipCode,
              source: "referral",
              notify_on_launch: true,
            },
            { onConflict: "email" }
          );

        if (leadError) {
          console.error(`Handoff lead creation failed for transition ${t.id}:`, leadError.message);
          continue;
        }
      }

      // Mark transition as handoff processed only after successful lead creation
      const { error: updateError } = await supabase
        .from("property_transitions")
        .update({ handoff_processed: true })
        .eq("id", t.id);

      if (updateError) {
        console.error(`Failed to mark transition ${t.id} as processed:`, updateError.message);
        continue;
      }

      processedCount++;

      // TODO: Send actual warm handoff email to new homeowner
      // Template: "The previous owner used [planName] at this address.
      // They had [services]. Want to keep it going?"
    }

    return new Response(
      JSON.stringify({
        processed_count: processedCount,
        message: `Processed ${processedCount} new homeowner handoffs`,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    const isAuth = message === "Authorization header required"
      || message === "Cron secret or service role key required"
      || message === "Invalid or expired token"
      || message === "Admin access required";
    return new Response(
      JSON.stringify({ error: message }),
      { status: isAuth ? 401 : 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
