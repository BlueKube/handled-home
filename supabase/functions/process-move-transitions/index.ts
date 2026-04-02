import { requireCronSecret, createServiceClient } from "../_shared/auth.ts";
import { corsHeaders, handleCors } from "../_shared/cors.ts";

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    requireCronSecret(req);
    const supabase = createServiceClient();

    const { data, error } = await supabase.rpc("process_move_date_transitions");

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({
        processed_count: data ?? 0,
        message: `Processed ${data ?? 0} move date transitions`,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    const isAuth = message === "Cron secret or service role key required";
    return new Response(
      JSON.stringify({ error: message }),
      { status: isAuth ? 401 : 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
