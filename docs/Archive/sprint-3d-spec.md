# Sprint 3D — AI Intelligence Layer

> Predictive service recommendations + smart dispute resolution. Extends existing AI infrastructure (Lovable AI gateway, `ai_inference_runs` table, `support-ai-classify` edge function).

## 3D-B: Predictive Service Recommendations

### Goal
Use property history (visit frequency, SKU coverage, seasonal gaps, weather events) + property signals to predict next-needed services. Powers a `"predicted"` suggestion type in the existing suggestion engine.

### Phase B1: Prediction Edge Function
- **`predict-services` edge function** — accepts `property_id`, queries:
  - Property signals (sqft, yard, stories, windows tiers)
  - Coverage map (which categories are NONE/SELF/PROVIDER)
  - Visit history (last 6 months of completed jobs with SKUs)
  - Seasonal context (current month, zone climate)
  - Property health score + sub-scores
- Calls Lovable AI (gemini-3-flash-preview) with structured tool calling
- Returns ranked list of `{ sku_id, confidence, reason, timing_hint }` predictions
- Writes results to `property_service_predictions` table (cached, refreshed weekly)

### Phase B2: Prediction Schema
- **`property_service_predictions`** table:
  - `id`, `property_id` FK, `sku_id` FK, `confidence` (0-100), `reason` text, `timing_hint` (now/next_month/next_season), `predicted_at`, `expires_at` (7 days), `model_version`
  - RLS: customer reads own property, admin all
  - Unique: `(property_id, sku_id)` with ON CONFLICT UPDATE

### Phase B3: Wire into Suggestion Engine
- Update `get_service_suggestions` RPC to include a `"predicted"` suggestion_type
- Predicted suggestions scored with `confidence / 10` (so 80 confidence = +8 score)
- Existing filters (suppression, impression throttling, routine exclusion) still apply
- `useSuggestions` hook already handles new types — just ensure `"predicted"` renders with distinct reason text

### Phase B4: Refresh Automation
- `run-scheduled-jobs` edge function calls `predict-services` weekly for active properties
- Stale predictions (>7 days) excluded from suggestion RPC

## 3D-C: Smart Dispute Resolution

### Goal
Extend `support-ai-classify` to auto-resolve clear-cut disputes using photo evidence + job context, and auto-generate resolution offers for admin review.

### Phase C1: Enhanced Classification
- Update `support-ai-classify` to include new tool outputs:
  - `auto_resolvable: boolean` — true if AI is confident the issue is clear-cut
  - `suggested_credit_cents: number | null` — AI-recommended credit amount
  - `resolution_explanation: string` — customer-facing explanation
  - `photo_analysis: { has_evidence: boolean, evidence_description: string }` — what photos show
- When job has photos, include signed photo URLs in the AI prompt for visual analysis

### Phase C2: Auto-Resolution Flow
- New `auto-resolve-dispute` edge function:
  - Called after classification when `auto_resolvable = true` AND `evidence_score >= 75` AND `risk_score < 30`
  - Creates resolution offer (credit or service redo) via existing `create_resolution_offer` RPC
  - Emits `CUSTOMER_ISSUE_AUTO_RESOLVED` notification event
  - Logs to `ai_inference_runs` with resolution details
  - Falls back to admin queue if any guard fails

### Phase C3: Admin AI Insights
- Ticket detail page shows AI analysis card:
  - Classification reasoning, evidence score, risk score
  - Photo analysis summary (if available)
  - Suggested resolution with "Apply" one-click button
  - Override controls (admin can adjust credit amount or reject AI suggestion)

### Phase C4: Customer Issue Integration
- `customer_issues` auto-classification on insert (DB trigger or hook)
- Quick issues (from VisitDetail) get classified immediately
- Status shows "AI reviewing..." while classification runs, then auto-resolves or escalates

## Implementation Order
B2 → B1 → B3 → B4 → C1 → C2 → C3 → C4

## Dependencies
- Lovable AI gateway (already configured, `LOVABLE_API_KEY` available)
- `ai_inference_runs` table (exists)
- `get_service_suggestions` RPC (exists from 3C)
- `support-ai-classify` edge function (exists)
- `support_tickets` + `customer_issues` tables (exist)
