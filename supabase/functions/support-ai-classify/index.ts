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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    // M-1: Auth is mandatory — verify caller is ticket owner, admin, or service_role
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

    const { ticket_id } = await req.json();
    if (!ticket_id) {
      return new Response(JSON.stringify({ error: "ticket_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify ownership or admin (skip for service_role)
    if (!isServiceRole && callerUserId) {
      const adminSupabase = createClient(supabaseUrl, serviceKey);
      const { data: ticketCheck } = await adminSupabase
        .from("support_tickets")
        .select("customer_id")
        .eq("id", ticket_id)
        .single();
      if (ticketCheck && ticketCheck.customer_id !== callerUserId) {
        const { data: isAdmin } = await adminSupabase.rpc("has_role", {
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

    if (!lovableApiKey) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    // Fetch ticket
    const { data: ticket, error: ticketErr } = await supabase
      .from("support_tickets")
      .select("*")
      .eq("id", ticket_id)
      .single();

    if (ticketErr || !ticket) {
      return new Response(JSON.stringify({ error: "Ticket not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch job context + photos if available
    let jobContext = "";
    let photoContext = "";
    if (ticket.job_id) {
      const [jobRes, photoRes] = await Promise.all([
        supabase
          .from("jobs")
          .select("status, scheduled_date, started_at, completed_at, provider_summary, arrived_at, departed_at")
          .eq("id", ticket.job_id)
          .single(),
        supabase
          .from("job_photos")
          .select("id, slot_key, upload_status, captured_at")
          .eq("job_id", ticket.job_id)
          .eq("upload_status", "UPLOADED"),
      ]);

      if (jobRes.data) {
        const job = jobRes.data;
        const timeOnSite = job.arrived_at && job.departed_at
          ? Math.round((new Date(job.departed_at).getTime() - new Date(job.arrived_at).getTime()) / 60000)
          : null;
        jobContext = `\nJob context: status=${job.status}, scheduled=${job.scheduled_date}, arrived=${job.arrived_at || "none"}, departed=${job.departed_at || "none"}, time_on_site=${timeOnSite ? `${timeOnSite}min` : "unknown"}, provider_summary="${job.provider_summary || "none"}"`;
      }

      const photos = photoRes.data ?? [];
      if (photos.length > 0) {
        photoContext = `\nJob photos: ${photos.length} uploaded (slots: ${photos.map(p => p.slot_key || "unknown").join(", ")})`;
      }
    }

    // Check for customer issue photos
    let issuePhotoContext = "";
    if (ticket.job_id) {
      const { data: issues } = await supabase
        .from("customer_issues")
        .select("photo_storage_path, photo_upload_status, reason, note")
        .eq("job_id", ticket.job_id)
        .eq("customer_id", ticket.customer_id);
      
      if (issues && issues.length > 0) {
        const withPhotos = issues.filter(i => i.photo_upload_status === "UPLOADED");
        issuePhotoContext = `\nCustomer issues: ${issues.length} filed (${withPhotos.length} with photos). Reasons: ${issues.map(i => i.reason).join(", ")}`;
      }
    }

    // Check for duplicate tickets
    const { data: recentTickets } = await supabase
      .from("support_tickets")
      .select("id, ticket_type, category, status, created_at")
      .eq("customer_id", ticket.customer_id)
      .neq("id", ticket_id)
      .order("created_at", { ascending: false })
      .limit(5);

    const historyContext = recentTickets?.length
      ? `\nCustomer's recent tickets (last 5): ${JSON.stringify(recentTickets.map(t => ({ type: t.ticket_type, category: t.category, status: t.status, created: t.created_at })))}`
      : "\nNo recent ticket history.";

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
          {
            role: "system",
            content: `You are a support ticket classifier and resolution engine for a home services marketplace. Analyze the ticket and classify it. Consider severity, evidence quality, risk of chargeback or fraud, whether this might be a duplicate, and whether it can be auto-resolved.

Auto-resolution criteria:
- Clear-cut service quality issues with photo evidence (e.g., missed area, incomplete work)
- Minor billing discrepancies under $50
- Simple scheduling errors with no financial impact
- Issues where provider summary confirms the problem

Do NOT auto-resolve:
- Safety concerns
- Repeated complaints from same customer (potential abuse)
- High-value disputes (>$100)
- Issues requiring provider investigation`,
          },
          {
            role: "user",
            content: `Classify this support ticket and determine if it can be auto-resolved:
Type: ${ticket.ticket_type}
Category: ${ticket.category || "none"}
Severity (customer-reported): ${ticket.severity}
Customer note: "${ticket.customer_note || "none"}"${jobContext}${photoContext}${issuePhotoContext}${historyContext}`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "classify_ticket",
              description: "Return classification and auto-resolution results for a support ticket.",
              parameters: {
                type: "object",
                properties: {
                  ai_summary: {
                    type: "string",
                    description: "One-sentence summary of the issue for admin queue view (max 100 chars).",
                  },
                  recommended_severity: {
                    type: "string",
                    enum: ["low", "medium", "high", "critical"],
                  },
                  evidence_score: {
                    type: "number",
                    description: "Score 0-100 indicating strength of evidence provided.",
                  },
                  risk_score: {
                    type: "number",
                    description: "Score 0-100 indicating chargeback/fraud/abuse risk.",
                  },
                  duplicate_ticket_id: {
                    type: "string",
                    description: "ID of a likely duplicate ticket if detected, or null.",
                  },
                  classification: {
                    type: "object",
                    properties: {
                      is_repeat_offender: { type: "boolean" },
                      recommended_action: {
                        type: "string",
                        enum: ["auto_resolve", "offer_credit", "needs_review", "escalate"],
                      },
                      reasoning: { type: "string" },
                    },
                    required: ["is_repeat_offender", "recommended_action", "reasoning"],
                    additionalProperties: false,
                  },
                  auto_resolvable: {
                    type: "boolean",
                    description: "True if AI is confident this can be resolved without human review.",
                  },
                  suggested_credit_cents: {
                    type: "integer",
                    description: "AI-recommended credit amount in cents, or 0 if no credit needed.",
                  },
                  resolution_explanation: {
                    type: "string",
                    description: "Customer-facing explanation of the resolution (max 200 chars).",
                  },
                  photo_analysis: {
                    type: "object",
                    properties: {
                      has_evidence: { type: "boolean", description: "Whether photos provide relevant evidence." },
                      evidence_description: { type: "string", description: "Brief description of what photos show." },
                    },
                    required: ["has_evidence", "evidence_description"],
                    additionalProperties: false,
                  },
                },
                required: [
                  "ai_summary", "recommended_severity", "evidence_score", "risk_score",
                  "classification", "auto_resolvable", "suggested_credit_cents",
                  "resolution_explanation", "photo_analysis"
                ],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "classify_ticket" } },
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

      return new Response(JSON.stringify({ error: "AI classification failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const latencyMs = Date.now() - startMs;

    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      return new Response(JSON.stringify({ error: "No classification returned" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = JSON.parse(toolCall.function.arguments);

    // Update ticket with AI results (includes new auto-resolution fields)
    await supabase
      .from("support_tickets")
      .update({
        ai_summary: result.ai_summary?.slice(0, 200),
        ai_evidence_score: result.evidence_score,
        ai_risk_score: result.risk_score,
        ai_classification: {
          ...(result.classification ?? {}),
          auto_resolvable: result.auto_resolvable ?? false,
          suggested_credit_cents: result.suggested_credit_cents ?? 0,
          resolution_explanation: result.resolution_explanation ?? "",
          photo_analysis: result.photo_analysis ?? null,
        },
      })
      .eq("id", ticket_id);

    // Log inference run
    await supabase.from("ai_inference_runs").insert({
      ticket_id,
      model_name: "google/gemini-3-flash-preview",
      input_summary: `${ticket.ticket_type}/${ticket.category}: ${ticket.customer_note?.slice(0, 100) || "no note"}`,
      classification: result.classification,
      evidence_score: result.evidence_score,
      risk_score: result.risk_score,
      duplicate_ticket_id: result.duplicate_ticket_id || null,
      output: result,
      latency_ms: latencyMs,
    });

    // If auto-resolvable and meets guard criteria, trigger auto-resolution
    const shouldAutoResolve = result.auto_resolvable === true
      && (result.evidence_score ?? 0) >= 75
      && (result.risk_score ?? 100) < 30;

    return new Response(JSON.stringify({
      success: true,
      ...result,
      should_auto_resolve: shouldAutoResolve,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("support-ai-classify error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
