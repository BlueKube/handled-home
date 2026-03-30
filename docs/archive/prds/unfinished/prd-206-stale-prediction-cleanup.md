# PRD 206: Stale AI Prediction Cleanup

> **Status:** PLACEHOLDER
> **Priority:** P2 Medium
> **Effort:** Small (1-2 days)

## What Exists Today

The AI service prediction system is largely built:

- **`property_service_predictions` table** stores predictions with `confidence`, `reason`, `timing_hint` (now / next_month / next_season), `predicted_at`, `expires_at` (default 7 days), and `model_version`. Predictions are upserted per property+SKU combination.
- **`predict-services` edge function** generates 3-6 AI predictions per property based on property signals, coverage maps, health scores, seasonal context, and service history. It uses the Lovable AI gateway (Gemini) and upserts results with a 7-day expiry.
- **`cleanup_stale_predictions` RPC function** deletes predictions that expired more than 30 days ago. It returns a JSON count of deleted rows.
- **`run-scheduled-jobs` orchestrator** has the cleanup wired as a weekly Monday sub-job (`stale_predictions_cleanup`), calling the RPC.
- **`RoutineSuggestion` component** and `SuggestionCard` surface AI predictions to customers on the Routine page, with "AI pick" badges and the ability to add suggestions to their routine or hide them.

The gap is subtle but important: the cleanup only deletes predictions expired for more than 30 days. Predictions that have expired (past their 7-day `expires_at`) but are less than 30 days old continue to appear in suggestion surfaces. There is no mechanism to filter them out at query time or to flag them as stale in the UI. Additionally, the weekly Monday schedule means predictions can persist for up to 37 days (7-day expiry + 30-day grace + up to 6 days until Monday) before deletion.

## What's Missing

1. **Query-time expiry filtering:** The hooks and components that fetch predictions do not filter by `expires_at`. Expired predictions appear alongside fresh ones in customer-facing suggestion surfaces.
2. **Stale visual indicator:** No UI distinction between a prediction made yesterday (high confidence, fresh context) and one made 3 weeks ago (potentially outdated).
3. **More aggressive cleanup cadence:** The weekly Monday schedule is too infrequent. A daily cleanup or at minimum a query-time filter would prevent stale predictions from ever reaching the UI.
4. **Refresh trigger:** No mechanism to proactively refresh predictions that are about to expire. The weekly batch `predict_services_weekly` job regenerates all predictions every Monday, but if a customer visits their Routine page on Friday, they might see 5-day-old predictions that are about to expire.
5. **Admin visibility:** No admin-facing view showing prediction freshness across the customer base -- how many predictions are current vs. stale vs. expired.

## Why This Matters

### For the Business
Stale predictions directly undermine trust in the AI intelligence layer. If a customer sees "Your yard would benefit from fall leaf cleanup" in March, the AI looks unintelligent, and the customer is less likely to trust future recommendations. Each bad suggestion reduces the conversion rate of the suggestion surface, which is a key revenue expansion driver. AI-powered upsell suggestions are only valuable if they are timely and contextually appropriate.

### For the User
Customers rely on the "Suggested Addition" cards to discover services relevant to their home right now. A stale prediction wastes their attention and screen real estate. Worse, acting on a stale suggestion (adding an out-of-season service) creates a poor experience downstream when the service cannot actually be fulfilled or does not make sense. The prediction system should feel like a knowledgeable advisor who knows what season it is, not a static recommendation engine.

## User Flow

1. **Customer visits Routine page:** The `RoutineSuggestion` component fetches predictions for the customer's property.
2. **Fresh predictions only:** The query filters to predictions where `expires_at > now()`, ensuring only unexpired predictions appear.
3. **Near-expiry refresh:** If the freshest prediction is within 24 hours of expiring and the customer is actively viewing the page, a background refresh is triggered (calling `predict-services` for the property) so the customer sees updated suggestions on their next visit.
4. **No stale cards:** If all predictions have expired and no refresh has completed, the suggestion section is hidden entirely rather than showing outdated content. A subtle "Checking for new suggestions..." placeholder can appear briefly if a refresh is in progress.
5. **Daily cleanup job:** A daily scheduled job (rather than weekly) deletes predictions that have been expired for more than 7 days (reduced from 30 days), keeping the table lean.
6. **Admin monitoring:** On the Cron Health page, admins can see the last cleanup run, how many predictions were deleted, and the current count of active vs. expired predictions.

## UI/UX Design Recommendations

- **Invisible to the customer when working correctly:** The best UX here is that customers never see a stale prediction. This is primarily a backend and query-layer fix. The customer-facing change is simply the absence of bad suggestions.
- **Freshness badge (optional enhancement):** On the `SuggestionCard`, consider showing a subtle "Updated today" or "Updated this week" timestamp next to the AI pick badge. This builds trust that the suggestion is current without cluttering the card. Use relative time ("2 days ago") in muted text below the suggestion reason.
- **Empty state:** When no current predictions exist, do not show an empty card or "No suggestions" message. Simply hide the entire "Suggested Addition" section. The absence of suggestions is better than a visible empty state that makes the AI seem broken.
- **Loading state for refresh:** If a background refresh is triggered, show a subtle skeleton shimmer on the suggestion area for at most 3 seconds. If the refresh takes longer, hide the section and let the suggestions appear on the next page visit.
- **Admin prediction health card:** On the Cron Health page, add a small stat card showing: total active predictions, total expired (pending cleanup), last cleanup timestamp, and predictions generated this week. Use the existing `StatCard` pattern.

## Acceptance Criteria

- All customer-facing prediction queries filter by `expires_at > now()` to exclude expired predictions.
- The `RoutineSuggestion` component and any other surfaces consuming predictions never display expired predictions.
- When no unexpired predictions exist for a property, the suggestion UI section is hidden (not shown as empty).
- The `cleanup_stale_predictions` job runs daily instead of weekly.
- The cleanup grace period is reduced from 30 days to 7 days past expiration.
- A background refresh is triggered when a customer views predictions that are within 24 hours of expiring.
- The Cron Health admin page shows prediction cleanup stats (deleted count, active count, last run).
- No regressions to the `predict-services` edge function or the `run-scheduled-jobs` orchestrator.
- The prediction table maintains a reasonable size by not accumulating months of expired rows.
