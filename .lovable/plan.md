

# Automated Code Review via n8n — Setup Guide

## What We're Building

An n8n workflow that accepts code diffs, sends them to Claude for review using your project's review checklist, and returns structured findings. Once built, I can execute this workflow directly from our conversation using the n8n MCP integration.

## Constraint

I cannot create n8n workflows remotely — they must be built in n8n's visual editor. I will give you exact step-by-step instructions to build it, then I can call it automatically after every implementation task.

---

## The Workflow (4 nodes)

```text
[Webhook Trigger] → [Set Review Prompt] → [HTTP Request to Claude API] → [Respond to Webhook]
```

### Node 1: Webhook Trigger
- Type: **Webhook**
- Method: POST
- Path: `code-review`
- Accepts JSON body with `{ files, taskId, checklist }`

### Node 2: Set Review Prompt (Code node)
- Assembles the prompt: combines the changed files content with the Handled Home review checklist into a single Claude-ready message

### Node 3: HTTP Request (Claude API call)
- POST to `https://api.anthropic.com/v1/messages`
- Headers: `x-api-key` (your Anthropic key), `anthropic-version: 2023-06-01`, `content-type: application/json`
- Body: model `claude-sonnet-4-20250514`, system prompt with review checklist, user message with code
- This is where Claude Opus 4 would go when available (swap model string)

### Node 4: Respond to Webhook
- Returns Claude's review findings as JSON back to the caller

---

## Steps for You in n8n

1. Create a new workflow named **"Lovable Code Review"**
2. Add each of the 4 nodes above (I will provide exact configurations for each once you're ready)
3. Add your Anthropic API key as an n8n credential
4. Activate the workflow
5. Go to workflow **Settings → toggle "Available in MCP"**
6. Tell me it's ready — I'll search for it and test it

## How I'll Use It

After each implementation task, I will:
1. Gather the files I changed
2. Call `execute_workflow` with the file contents and task context
3. Read Claude's review findings
4. Apply fixes immediately
5. Re-run the review to confirm clean

This eliminates the copy-paste loop entirely. You only see the final "all clear" result.

## What You Need
- An **Anthropic API key** (for Claude access from n8n)
- ~15 minutes to build the workflow following my instructions

## Next Step

Tell me you're ready to start building the workflow in n8n, and I will give you the exact configuration for each node — field by field, paste-ready.

