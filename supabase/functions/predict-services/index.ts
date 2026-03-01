import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { property_id } = await req.json();
    if (!property_id) {
      return new Response(JSON.stringify({ error: "property_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    if (!lovableApiKey) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    // Gather property context in parallel
    const [signalsRes, coverageRes, historyRes, healthRes, skusRes] = await Promise.all([
      supabase
        .from("property_signals")
        .select("home_sqft_tier, yard_tier, windows_tier, stories_tier")
        .eq("property_id", property_id)
        .maybeSingle(),
      supabase
        .from("property_coverage")
        .select("category_key, coverage_status, switch_intent")
        .eq("property_id", property_id),
      supabase
        .from("jobs")
        .select("scheduled_date, status, job_skus(sku_id, sku_name_snapshot)")
        .eq("property_id", property_id)
        .eq("status", "COMPLETED")
        .order("scheduled_date", { ascending: false })
        .limit(20),
      supabase
        .from("property_health_scores")
        .select("overall_score, regularity_score, coverage_score, seasonal_score, issue_score")
        .eq("property_id", property_id)
        .maybeSingle(),
      supabase
        .from("service_skus")
        .select("id, name, category, is_active")
        .eq("is_active", true),
    ]);

    const signals = signalsRes.data;
    const coverage = coverageRes.data ?? [];
    const history = historyRes.data ?? [];
    const health = healthRes.data;
    const allSkus = skusRes.data ?? [];

    // Build context for AI
    const currentMonth = new Date().getMonth() + 1;
    const seasonName = currentMonth >= 3 && currentMonth <= 5 ? "spring"
      : currentMonth >= 6 && currentMonth <= 8 ? "summer"
      : currentMonth >= 9 && currentMonth <= 11 ? "fall" : "winter";

    const visitedSkuIds = new Set<string>();
    const visitHistory = history.map((j: any) => {
      const skus = (j.job_skus ?? []).map((js: any) => {
        visitedSkuIds.add(js.sku_id);
        return js.sku_name_snapshot || js.sku_id;
      });
      return `${j.scheduled_date}: ${skus.join(", ")}`;
    });

    const coverageMap = coverage.map((c: any) =>
      `${c.category_key}: ${c.coverage_status}${c.switch_intent ? ` (intent: ${c.switch_intent})` : ""}`
    );

    const availableSkus = allSkus.map((s: any) => `${s.id}|${s.name}|${s.category}`);

    const prompt = `You are a predictive service recommendation engine for a home maintenance platform.

Property context:
- Sizing: ${signals ? `sqft=${signals.home_sqft_tier}, yard=${signals.yard_tier}, windows=${signals.windows_tier}, stories=${signals.stories_tier}` : "unknown"}
- Coverage map: ${coverageMap.length > 0 ? coverageMap.join("; ") : "not set"}
- Health score: ${health ? `overall=${health.overall_score}, regularity=${health.regularity_score}, coverage=${health.coverage_score}, seasonal=${health.seasonal_score}, issues=${health.issue_score}` : "not computed"}
- Current season: ${seasonName} (month ${currentMonth})
- Recent visits (last 20): ${visitHistory.length > 0 ? visitHistory.join(" | ") : "none"}

Available services (id|name|category):
${availableSkus.join("\n")}

Based on property context, visit patterns, seasonal timing, and coverage gaps, predict which services this property needs next. Consider:
1. Services never tried but relevant to property size/type
2. Seasonal services appropriate for current timing
3. Services with declining regularity
4. Coverage gaps (NONE or SELF categories)
5. Complementary services to what they already use

Return 3-6 predictions ranked by confidence.`;

    const startMs = Date.now();

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are a predictive analytics engine. Return structured predictions only." },
          { role: "user", content: prompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "predict_services",
              description: "Return ranked service predictions for a property.",
              parameters: {
                type: "object",
                properties: {
                  predictions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        sku_id: { type: "string", description: "UUID of the predicted service SKU" },
                        confidence: { type: "integer", description: "Confidence score 0-100" },
                        reason: { type: "string", description: "Brief customer-facing reason (max 80 chars)" },
                        timing_hint: {
                          type: "string",
                          enum: ["now", "next_month", "next_season"],
                          description: "When this service should ideally be scheduled",
                        },
                      },
                      required: ["sku_id", "confidence", "reason", "timing_hint"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["predictions"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "predict_services" } },
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      const errText = await aiResponse.text();
      console.error("AI gateway error:", status, errText);

      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, try again later" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ error: "AI prediction failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const latencyMs = Date.now() - startMs;

    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      return new Response(JSON.stringify({ error: "No predictions returned" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = JSON.parse(toolCall.function.arguments);
    const predictions = result.predictions ?? [];

    // Validate sku_ids exist
    const validSkuIds = new Set(allSkus.map((s: any) => s.id));
    const validPredictions = predictions.filter((p: any) =>
      validSkuIds.has(p.sku_id) && p.confidence >= 0 && p.confidence <= 100
    );

    // Upsert predictions (ON CONFLICT UPDATE)
    if (validPredictions.length > 0) {
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      const rows = validPredictions.map((p: any) => ({
        property_id,
        sku_id: p.sku_id,
        confidence: Math.min(100, Math.max(0, Math.round(p.confidence))),
        reason: (p.reason || "Recommended for your home").slice(0, 200),
        timing_hint: ["now", "next_month", "next_season"].includes(p.timing_hint) ? p.timing_hint : "now",
        predicted_at: new Date().toISOString(),
        expires_at: expiresAt,
        model_version: "v1",
      }));

      const { error: upsertErr } = await supabase
        .from("property_service_predictions")
        .upsert(rows, { onConflict: "property_id,sku_id" });

      if (upsertErr) {
        console.error("Upsert error:", upsertErr);
      }
    }

    // Log inference run
    await supabase.from("ai_inference_runs").insert({
      model_name: "google/gemini-3-flash-preview",
      input_summary: `predict-services: ${validPredictions.length} predictions for property ${property_id}`,
      output: result,
      latency_ms: latencyMs,
      entity_type: "property",
      entity_id: property_id,
    });

    return new Response(
      JSON.stringify({
        success: true,
        predictions: validPredictions,
        latency_ms: latencyMs,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("predict-services error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
