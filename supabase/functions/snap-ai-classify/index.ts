import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callAnthropicTool, type AnthropicContentBlock } from "../_shared/anthropic.ts";

const MODEL = "claude-haiku-4-5-20251001";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type SnapClassifyResult = {
  summary: string;
  suggested_sku_id: string | null;
  suggested_credits: number;
  area_inference: "bath" | "kitchen" | "yard" | "exterior" | "other" | "unknown";
  confidence: number;
  urgency_signal: "low" | "medium" | "high";
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

    // Auth: caller is either service role, or the snap owner, or admin.
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Authorization required" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const isServiceRole = token === serviceKey;
    let callerUserId: string | null = null;

    if (!isServiceRole) {
      const userClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data, error: claimsErr } = await userClient.auth.getClaims(token);
      if (claimsErr || !data?.claims?.sub) {
        return new Response(JSON.stringify({ error: "Invalid token" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      callerUserId = data.claims.sub as string;
    }

    const { snap_request_id } = await req.json().catch(() => ({}));
    if (!snap_request_id) {
      return new Response(JSON.stringify({ error: "snap_request_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    // Fetch the snap_request.
    const { data: snap, error: snapErr } = await supabase
      .from("snap_requests")
      .select("id, customer_id, description, area, photo_paths, status")
      .eq("id", snap_request_id)
      .single();

    if (snapErr || !snap) {
      return new Response(JSON.stringify({ error: "Snap not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Ownership check (skip for service role).
    if (!isServiceRole && callerUserId) {
      if (snap.customer_id !== callerUserId) {
        const { data: isAdmin } = await supabase.rpc("has_role", {
          _user_id: callerUserId,
          _role: "admin",
        });
        if (!isAdmin) {
          return new Response(JSON.stringify({ error: "Not authorized" }), {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
    }

    if (snap.status === "resolved" || snap.status === "canceled") {
      return new Response(JSON.stringify({ error: "Snap is closed" }), {
        status: 409,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate signed URLs for up to 4 photos (token limits).
    const paths: string[] = (snap.photo_paths ?? []).slice(0, 4);
    if (paths.length === 0) {
      return new Response(JSON.stringify({ error: "Snap has no photos" }), {
        status: 422,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: signed, error: signedErr } = await supabase.storage
      .from("snap-photos")
      .createSignedUrls(paths, 600);

    if (signedErr || !signed) {
      console.error("Signed URL generation failed:", signedErr);
      return new Response(JSON.stringify({ error: "Could not load photos" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const photoUrls = signed.map((s) => s.signedUrl).filter(Boolean);

    const systemPrompt = `You are a helpful triage assistant for Handled Home, a residential home-maintenance marketplace. A customer just snapped a photo of something that needs fixing and you need to classify it before they commit credits.

Your output is shown to the customer immediately, so:
- Keep the summary friendly, specific, and grounded in what you see in the photo.
- Be honest about confidence. If the photo is ambiguous or doesn't show the described issue, say so.
- Credits range from about 20 (quick 10-minute task) to about 400 (significant work). Most common snaps fall between 60 and 180.
- If you can't confidently match a specific service SKU, return null for suggested_sku_id — the customer doesn't see the SKU ID, just the credit estimate, so a wrong SKU is worse than no SKU.
- Urgency signal is a hint only. The customer still picks next_visit vs ad_hoc themselves.`;

    const userBlocks: AnthropicContentBlock[] = [
      {
        type: "text",
        text: `Snap details:
Customer-supplied description: "${snap.description ?? "(none)"}"
Customer-tagged area: ${snap.area ?? "(none)"}

Photos follow. Classify and estimate credits.`,
      },
      ...photoUrls.map((url) => ({ type: "image" as const, source: { type: "url" as const, url } })),
    ];

    const aiResult = await callAnthropicTool<SnapClassifyResult>({
      system: systemPrompt,
      userContent: userBlocks,
      toolName: "classify_snap",
      toolDescription: "Classify a Snap-a-Fix request and estimate the credits needed.",
      inputSchema: {
        type: "object",
        properties: {
          summary: {
            type: "string",
            description:
              "Friendly one-line summary shown to the customer before they commit. <=120 chars.",
          },
          suggested_sku_id: {
            type: ["string", "null"],
            description: "UUID of the best-matching service_sku, or null if unsure.",
          },
          suggested_credits: {
            type: "integer",
            description: "Integer credit estimate (clamped 20-400).",
            minimum: 20,
            maximum: 400,
          },
          area_inference: {
            type: "string",
            enum: ["bath", "kitchen", "yard", "exterior", "other", "unknown"],
          },
          confidence: {
            type: "integer",
            description: "Confidence 0-100 in the overall classification.",
            minimum: 0,
            maximum: 100,
          },
          urgency_signal: {
            type: "string",
            enum: ["low", "medium", "high"],
            description: "Routing hint — customer still picks next_visit vs ad_hoc.",
          },
        },
        required: [
          "summary",
          "suggested_sku_id",
          "suggested_credits",
          "area_inference",
          "confidence",
          "urgency_signal",
        ],
        additionalProperties: false,
      },
      model: MODEL,
      maxTokens: 1024,
    });

    if (!aiResult.ok) {
      return new Response(JSON.stringify({ error: aiResult.error }), {
        status: aiResult.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = aiResult.input;

    // Hard clamp credits defensively (Anthropic mostly respects schema but not always).
    const credits = Math.max(20, Math.min(400, Math.round(result.suggested_credits)));
    const classification: SnapClassifyResult = { ...result, suggested_credits: credits };

    // Persist classification + advance status.
    const { error: updateErr } = await supabase
      .from("snap_requests")
      .update({
        ai_classification: classification,
        status: "triaged",
      })
      .eq("id", snap_request_id);

    if (updateErr) {
      console.error("snap_requests update failed:", updateErr);
      return new Response(JSON.stringify({ error: "Could not save classification" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Log the inference run. Best-effort — a failure here shouldn't block the user.
    await supabase
      .from("ai_inference_runs")
      .insert({
        snap_request_id,
        model_name: MODEL,
        input_summary: [snap.area ?? "(no area)", snap.description ?? "(no description)"].join(
          " · ",
        ),
        output: classification,
        classification: {
          suggested_sku_id: classification.suggested_sku_id,
          area_inference: classification.area_inference,
          urgency_signal: classification.urgency_signal,
          confidence: classification.confidence,
        },
        latency_ms: aiResult.latencyMs,
      })
      .then(({ error }) => {
        if (error) console.error("ai_inference_runs insert failed (non-fatal):", error);
      });

    return new Response(
      JSON.stringify({ success: true, ...classification }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error(
      "snap-ai-classify error:",
      e instanceof Error ? e.message : JSON.stringify(e, Object.getOwnPropertyNames(e)),
    );
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
