# Batch Spec: D-1 — Anthropic Swap (predict-services + support-ai-classify)

> **Round / Phase:** 64.5 / D-1
> **Size:** M (3 files: 1 new `_shared/anthropic.ts`, 2 modified edge functions)
> **Goal:** Replace the Lovable AI gateway with direct calls to the Anthropic Messages API so the new Supabase project no longer depends on `LOVABLE_API_KEY`.

---

## Scope

### New file
- `supabase/functions/_shared/anthropic.ts` — typed helper for calling `https://api.anthropic.com/v1/messages` with tool use.

### Modified files
- `supabase/functions/predict-services/index.ts`
- `supabase/functions/support-ai-classify/index.ts`

### Out of scope
- Prompt caching (system prompts + tool schemas are under the 1024-token Haiku cache minimum; revisit once combined prefix grows).
- Streaming (neither caller streams today; stay non-streaming to keep the diff tight).
- Other edge functions that use `LOVABLE_API_KEY` — grep confirms only these two reference it.
- Updating `config.toml` edge-function listings (entries already exist).

---

## Helper design (`_shared/anthropic.ts`)

Single exported function:

```ts
export async function callAnthropicTool<T>(opts: {
  system: string;
  userContent: AnthropicContentBlock[] | string;
  toolName: string;
  toolDescription: string;
  inputSchema: Record<string, unknown>;
  model?: string;          // default: "claude-haiku-4-5-20251001"
  maxTokens?: number;      // default: 2048
}): Promise<
  | { ok: true; input: T; latencyMs: number; modelUsed: string }
  | { ok: false; status: number; error: string; latencyMs: number }
>;
```

Behaviour:
- Reads `ANTHROPIC_API_KEY` from `Deno.env`. Returns `{ ok: false, status: 500, error: "ANTHROPIC_API_KEY not configured" }` if absent (callers translate to 500).
- POSTs to `https://api.anthropic.com/v1/messages` with headers `x-api-key`, `anthropic-version: 2023-06-01`, `Content-Type`.
- Forces tool use with `tool_choice: { type: "tool", name: opts.toolName }`.
- Parses response: reads first `content[]` block of `type: "tool_use"` matching `opts.toolName`; returns `.input` as `T`.
- Error mapping:
  - `429` → `{ ok: false, status: 429, error: "Rate limited" }`
  - `529` → `{ ok: false, status: 529, error: "Anthropic overloaded" }`
  - `401` → `{ ok: false, status: 500, error: "Anthropic auth failed" }` (hide key details from caller)
  - Other non-2xx → `{ ok: false, status: 500, error: "AI call failed" }` with console.error for diagnostics
  - Missing/mismatched tool_use block → `{ ok: false, status: 500, error: "No tool call returned" }`
- Measures latency around the `fetch()` call; returns `latencyMs` in both success and failure paths so callers can log consistently.
- Exports types: `AnthropicContentBlock` (union of `{ type: "text"; text: string }` and `{ type: "image"; source: { type: "url"; url: string } }`).

No retry logic in v1 — callers that need retry/backoff can layer it. Both current callers are user-facing and prefer fast failure to long hangs.

---

## `predict-services` changes

1. Replace `const lovableApiKey = Deno.env.get("LOVABLE_API_KEY")` with `ANTHROPIC_API_KEY` check via helper (helper handles missing-key path).
2. Drop the direct `fetch("https://ai.gateway.lovable.dev/...")` block (~50 lines).
3. Replace with one `callAnthropicTool` invocation. System prompt = existing `"You are a predictive analytics engine. Return structured predictions only."`. User content = existing `prompt` string. Tool name = `predict_services`. `inputSchema` = the existing `parameters` object (unchanged).
4. Update `ai_inference_runs.model_name` from `"google/gemini-3-flash-preview"` to `"claude-haiku-4-5-20251001"`.
5. Error-status passthrough: `result.status` from the helper maps 1:1 to the existing HTTP response codes (429 stays 429, everything else becomes 500). Drop 402 handling (Anthropic-specific billing, no 402 emitted).

### Acceptance criteria
- File no longer references `LOVABLE_API_KEY` or `ai.gateway.lovable.dev`.
- Function still returns `{ success, predictions, latency_ms }` on happy path.
- 429 still maps to 429 response; everything else to 500.
- `ai_inference_runs` row is still written after every AI call (success or parsed-failure).
- `predictions` upsert + sku_id validation logic unchanged.

---

## `support-ai-classify` changes

1. Same `LOVABLE_API_KEY` → `ANTHROPIC_API_KEY` swap via helper.
2. User content becomes a content-block array: `[ { type: "text", text: "..." }, ...photoUrls.map(url => ({ type: "image", source: { type: "url", url } })), ...issuePhotoUrls.map(...) ]`. Same photo set as today (≤4 job photos + ≤2 issue photos).
3. Anthropic signed-URL ingestion: confirmed supported with `anthropic-version: 2023-06-01`. Signed URLs expire in 600s (10min), well within Anthropic's fetch window.
4. Tool name = `classify_ticket`, `inputSchema` = existing `parameters` object (unchanged, already Anthropic-compatible JSON Schema).
5. Update `ai_inference_runs.model_name` from `"google/gemini-3-flash-preview"` to `"claude-haiku-4-5-20251001"`. Other `ai_inference_runs` fields (`classification`, `evidence_score`, `risk_score`, `duplicate_ticket_id`, `output`, `latency_ms`) unchanged.
6. Auto-resolve chain (lines 387–428) unchanged.
7. Error mapping: 429→429, drop 402, everything else→500.

### Acceptance criteria
- File no longer references `LOVABLE_API_KEY` or `ai.gateway.lovable.dev`.
- Multimodal input (text + up to 6 image URLs) still sent when photos are present.
- Photo-less path (no `job_id` or no uploaded photos) still works with text-only user content.
- `support_tickets.ai_summary`, `ai_evidence_score`, `ai_risk_score`, `ai_classification`, and optional `duplicate_of_ticket_id` still written on success.
- Auto-resolve chain still fires when `auto_resolvable=true && evidence_score>=75 && risk_score<30`.

---

## Shared acceptance criteria

- `npx tsc --noEmit` passes on the app TypeScript (edge functions are Deno — type-checked by Deno runtime, not `tsc`; app code unaffected).
- `deno check` passes on both edge-function entry points (run from `supabase/functions/` after the changes).
- `grep -r LOVABLE_API_KEY supabase/functions/` returns zero matches (excluding comments/docs).
- Edge-function deploys succeed on both functions (`supabase functions deploy predict-services --use-api` + `support-ai-classify`).
- The new project does not yet have `ANTHROPIC_API_KEY` set — document in plan.md + TODO.md that Phase C-4 must include this key before either function can run. Until then both functions return 500 "ANTHROPIC_API_KEY not configured" — acceptable because no caller depends on them during migration.

---

## Risks + edge cases

| Risk | Mitigation |
|---|---|
| Anthropic rejects `source.type: "url"` with older `anthropic-version` | Pinning to `2023-06-01` header; URL image source has been GA for ~18 months on that version. If broken, helper returns clear error; fallback is base64 fetch (deferred). |
| Signed URL expires before Anthropic fetches it | Current 10-min expiry is comfortably longer than typical Anthropic fetch (<5s). No change. |
| Tool-use response truncated mid-JSON (token limit) | `maxTokens: 2048` for predict-services (returns ≤6 predictions × ~80 tokens = ~500 tokens, headroom fine) and `maxTokens: 4096` for support-ai-classify (classification struct with ~10 fields + resolution explanation, could hit ~1500 tokens). Explicit per-caller override. |
| Model name drift | `model` defaulted in helper but overridable per-call. Updating the default centralizes the model upgrade path. |
| `ai_inference_runs` schema expects specific `model_name` values? | Checked: column is free-text. No constraint. |

---

## Test plan

1. `deno check supabase/functions/predict-services/index.ts` → clean.
2. `deno check supabase/functions/support-ai-classify/index.ts` → clean.
3. `supabase functions deploy predict-services --use-api --project-ref $SUPABASE_PROJECT_REF` → ACTIVE.
4. `supabase functions deploy support-ai-classify --use-api --project-ref $SUPABASE_PROJECT_REF` → ACTIVE.
5. Post-D-1 manual live test (after Phase C-4 ships `ANTHROPIC_API_KEY`): invoke each function from Supabase dashboard with a fixture `property_id` / `ticket_id` and assert shape of the response matches the contract.

Not running live inference test in this batch — `ANTHROPIC_API_KEY` not yet set on the new project. That validation is part of Phase E (smoke test).
