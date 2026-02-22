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
    const { ticket_id } = await req.json();
    if (!ticket_id) {
      return new Response(JSON.stringify({ error: "ticket_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    // E1: Auth check — verify caller owns the ticket or is admin
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY") ?? "", {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: { user } } = await userClient.auth.getUser();
      if (user) {
        // Verify ownership or admin role
        const adminSupabase = createClient(supabaseUrl, serviceKey);
        const { data: ticketCheck } = await adminSupabase
          .from("support_tickets")
          .select("customer_id")
          .eq("id", ticket_id)
          .single();
        if (ticketCheck && ticketCheck.customer_id !== user.id) {
          const { data: isAdmin } = await adminSupabase.rpc("has_role", {
            _user_id: user.id,
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
    }

    if (!lovableApiKey) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    // Fetch ticket with related data
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

    // Fetch job context if available
    let jobContext = "";
    if (ticket.job_id) {
      const { data: job } = await supabase
        .from("jobs")
        .select("status, scheduled_date, started_at, completed_at, provider_summary")
        .eq("id", ticket.job_id)
        .single();
      if (job) {
        jobContext = `\nJob context: status=${job.status}, scheduled=${job.scheduled_date}, started=${job.started_at}, completed=${job.completed_at}, provider_summary="${job.provider_summary || "none"}"`;
      }
    }

    // Check for duplicate tickets from same customer
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

    // Call Lovable AI for classification using tool calling
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
            content: `You are a support ticket classifier for a home services marketplace. Analyze the ticket and classify it. Consider the severity of the issue, evidence quality, risk of chargeback or fraud, and whether this might be a duplicate of a recent ticket.`,
          },
          {
            role: "user",
            content: `Classify this support ticket:
Type: ${ticket.ticket_type}
Category: ${ticket.category || "none"}
Severity (customer-reported): ${ticket.severity}
Customer note: "${ticket.customer_note || "none"}"${jobContext}${historyContext}`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "classify_ticket",
              description: "Return classification results for a support ticket.",
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
                    description: "AI-recommended severity based on analysis.",
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
                },
                required: ["ai_summary", "recommended_severity", "evidence_score", "risk_score", "classification"],
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

    // Parse tool call result
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      return new Response(JSON.stringify({ error: "No classification returned" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = JSON.parse(toolCall.function.arguments);

    // Update ticket with AI results (E2: also write ai_classification)
    await supabase
      .from("support_tickets")
      .update({
        ai_summary: result.ai_summary?.slice(0, 200),
        ai_evidence_score: result.evidence_score,
        ai_risk_score: result.risk_score,
        ai_classification: result.classification ?? null,
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

    return new Response(JSON.stringify({ success: true, ...result }), {
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
