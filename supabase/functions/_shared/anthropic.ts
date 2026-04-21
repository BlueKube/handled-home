// Anthropic Messages API helper for tool-use calls from Supabase Edge Functions.
// See batch spec: docs/working/batch-specs/d1-anthropic-swap.md

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";
const DEFAULT_MODEL = "claude-haiku-4-5-20251001";
const DEFAULT_MAX_TOKENS = 2048;

export type AnthropicContentBlock =
  | { type: "text"; text: string }
  | { type: "image"; source: { type: "url"; url: string } };

export type AnthropicToolResult<T> =
  | { ok: true; input: T; modelUsed: string; latencyMs: number }
  | { ok: false; status: number; error: string; latencyMs: number };

interface AnthropicToolUseBlock {
  type: "tool_use";
  id: string;
  name: string;
  input: Record<string, unknown>;
}

interface AnthropicResponse {
  content?: Array<AnthropicToolUseBlock | { type: string; [k: string]: unknown }>;
  stop_reason?: string;
}

export async function callAnthropicTool<T>(opts: {
  system: string;
  userContent: AnthropicContentBlock[] | string;
  toolName: string;
  toolDescription: string;
  inputSchema: Record<string, unknown>;
  model?: string;
  maxTokens?: number;
}): Promise<AnthropicToolResult<T>> {
  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) {
    return { ok: false, status: 500, error: "ANTHROPIC_API_KEY not configured", latencyMs: 0 };
  }

  const model = opts.model ?? DEFAULT_MODEL;
  const userBlocks: AnthropicContentBlock[] =
    typeof opts.userContent === "string"
      ? [{ type: "text", text: opts.userContent }]
      : opts.userContent;

  const body = {
    model,
    max_tokens: opts.maxTokens ?? DEFAULT_MAX_TOKENS,
    system: opts.system,
    messages: [{ role: "user", content: userBlocks }],
    tools: [
      {
        name: opts.toolName,
        description: opts.toolDescription,
        input_schema: opts.inputSchema,
      },
    ],
    tool_choice: { type: "tool", name: opts.toolName },
  };

  const startMs = Date.now();
  let res: Response;
  try {
    res = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": ANTHROPIC_VERSION,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
  } catch (e) {
    const latencyMs = Date.now() - startMs;
    console.error("Anthropic fetch failed:", e);
    return { ok: false, status: 500, error: "AI call failed", latencyMs };
  }

  const latencyMs = Date.now() - startMs;

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    console.error(`Anthropic API error ${res.status}:`, errText.slice(0, 500));
    if (res.status === 429) return { ok: false, status: 429, error: "Rate limited", latencyMs };
    if (res.status === 529) return { ok: false, status: 529, error: "Anthropic overloaded", latencyMs };
    if (res.status === 401) return { ok: false, status: 500, error: "Anthropic auth failed", latencyMs };
    return { ok: false, status: 500, error: "AI call failed", latencyMs };
  }

  let data: AnthropicResponse;
  try {
    data = await res.json();
  } catch (e) {
    console.error("Anthropic response parse failed:", e);
    return { ok: false, status: 500, error: "AI response parse failed", latencyMs };
  }

  const toolBlock = data.content?.find(
    (b): b is AnthropicToolUseBlock => b.type === "tool_use" && "name" in b && b.name === opts.toolName,
  );
  if (!toolBlock) {
    console.error("No tool_use block in response:", JSON.stringify(data).slice(0, 500));
    return { ok: false, status: 500, error: "No tool call returned", latencyMs };
  }

  return { ok: true, input: toolBlock.input as T, modelUsed: model, latencyMs };
}
