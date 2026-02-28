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

    // Step 1: Compute quality scores
    const { data: scoreResult, error: scoreError } = await supabase.rpc(
      "compute_provider_quality_scores"
    );
    if (scoreError) {
      console.error("Quality score computation failed:", scoreError);
      return new Response(
        JSON.stringify({ error: scoreError.message, step: "quality_scores" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Quality scores computed:", scoreResult);

    // Step 2: Evaluate training gates
    const { data: gateResult, error: gateError } = await supabase.rpc(
      "evaluate_training_gates"
    );
    if (gateError) {
      console.error("Training gates evaluation failed:", gateError);
      return new Response(
        JSON.stringify({
          error: gateError.message,
          step: "training_gates",
          quality_scores: scoreResult,
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Training gates evaluated:", gateResult);

    return new Response(
      JSON.stringify({
        success: true,
        quality_scores: scoreResult,
        training_gates: gateResult,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
