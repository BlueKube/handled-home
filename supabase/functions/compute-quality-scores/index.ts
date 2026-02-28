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

    const today = new Date().toISOString().split("T")[0];

    // Step 1: Log + compute quality scores
    const { data: scoreRunId } = await supabase.rpc("start_cron_run", {
      p_function_name: "quality_compute_daily",
      p_idempotency_key: `quality_compute_daily:${today}`,
    });

    const { data: scoreResult, error: scoreError } = await supabase.rpc(
      "compute_provider_quality_scores"
    );

    if (scoreError) {
      console.error("Quality score computation failed:", scoreError);
      if (scoreRunId) await supabase.rpc("finish_cron_run", {
        p_run_id: scoreRunId, p_status: "failed", p_result_summary: null, p_error_message: scoreError.message,
      });
      return new Response(
        JSON.stringify({ error: scoreError.message, step: "quality_scores" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Quality scores computed:", scoreResult);
    if (scoreRunId) await supabase.rpc("finish_cron_run", {
      p_run_id: scoreRunId, p_status: "success", p_result_summary: { result: scoreResult }, p_error_message: null,
    });

    // Step 2: Log + evaluate training gates
    const { data: gateRunId } = await supabase.rpc("start_cron_run", {
      p_function_name: "training_gates_daily",
      p_idempotency_key: `training_gates_daily:${today}`,
    });

    const { data: gateResult, error: gateError } = await supabase.rpc(
      "evaluate_training_gates"
    );

    if (gateError) {
      console.error("Training gates evaluation failed:", gateError);
      if (gateRunId) await supabase.rpc("finish_cron_run", {
        p_run_id: gateRunId, p_status: "failed", p_result_summary: null, p_error_message: gateError.message,
      });
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
    if (gateRunId) await supabase.rpc("finish_cron_run", {
      p_run_id: gateRunId, p_status: "success", p_result_summary: { result: gateResult }, p_error_message: null,
    });

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
