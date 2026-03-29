# PRD 217: Template-Based Provider Coaching Cues

> **Status:** PLACEHOLDER
> **Priority:** P1 High
> **Effort:** Medium (3-5 days)

## What Exists Today

The provider experience has rich performance data but thin coaching guidance:

- **Quality Score system:** A rolling 28-day composite score with four weighted components -- Customer Rating (35%), Issue/Redo Rate (25%), Photo Compliance (20%), and On-Time Performance (20%). Scores map to color bands (GREEN >= 80, YELLOW 60-79, ORANGE 40-59, RED < 40).
- **Tier system:** Three tiers (Gold, Silver, Standard) determined by quality score, affecting payout hold periods and assignment priority.
- **Provider Insights page (`/provider/insights`):** Displays stat cards for completed jobs, proof compliance %, issue rate, avg time on site, and eligible payout. Has a hardcoded "Coaching Tips" section with 3 static rules (proof < 90%, issue rate > 10%, held earnings > 0).
- **Quality Score page (`/provider/quality-score`):** Shows the composite score, component breakdown, tier status, training gates, tier history, and weekly coaching rollups (from `provider_feedback_rollups` with AI-generated `summary_positive` and `summary_improve` fields).
- **Weekly feedback rollups:** Aggregate customer feedback with theme counts, average rating, and AI-generated positive/improvement summaries. Published weekly.
- **Quality score events:** Track score changes over time with old/new score deltas.
- **`compute-quality-scores` edge function:** Runs daily, computing scores and evaluating training gates.

The gap: the existing coaching is either hardcoded (3 static tips on the Insights page) or AI-generated prose summaries (weekly rollups). There are no structured, template-based coaching messages tied to specific score components that give providers concrete, actionable steps to improve specific metrics.

## What's Missing

1. **Coaching cue template system:** A set of parameterized coaching message templates, each tied to a specific quality score component, threshold, and trend direction. For example: "Your photo compliance dropped to {score}% this week. Adding a clear after photo from the same angle as your before photo can bring this back up."
2. **Dynamic cue selection logic:** Rules that evaluate a provider's current component scores, trends (improving, declining, flat), and tier to select the most relevant 2-3 coaching cues. Prioritize the component with the biggest gap or steepest decline.
3. **Coaching cue UI on the Insights page:** Replace the hardcoded tips with dynamically selected, personalized coaching cards that feel like a mentor speaking to the provider.
4. **Coaching cue integration on the Quality Score page:** Below each component metric, show the relevant coaching cue if that component is below threshold or declining.
5. **Positive reinforcement cues:** Not just improvement suggestions but also congratulatory messages when a component improves or hits a milestone (e.g., "Your on-time rate hit 95% this week -- nice work!").
6. **Cue history/progression:** Track which cues a provider has seen, so the system can rotate messaging and avoid showing the same tip repeatedly.

## Why This Matters

### For the Business
Showing a provider that their photo score is 60% without telling them what to do about it is like a fitness tracker showing steps without suggesting a walk. Coaching cues drive behavior change: providers who know exactly what to improve can act on it. Improved provider quality directly reduces customer issues, which reduces support ticket volume, which reduces ops costs. A 10% improvement in photo compliance across the provider network could reduce "no proof" disputes by 20-30%. Additionally, providers who feel coached and supported have higher retention -- they feel invested in, not just measured.

### For the User
Providers who receive actionable coaching deliver better service. Customers benefit from more complete photo proof (fewer "he said, she said" disputes), better on-time performance (fewer missed windows), and higher overall service quality. The coaching cues are invisible to customers, but the effects are directly felt through improved service reliability.

## User Flow

1. **Provider opens Insights page:** The page loads performance stats as it does today. Below the stat grid, the "Coaching Tips" section appears.
2. **Dynamic cue selection:** The system evaluates the provider's current component scores and recent trends. It selects the 2-3 most impactful coaching cues based on: (a) which components are furthest below their "green" threshold, (b) which components have declined in the past week, and (c) which cues the provider has not seen recently.
3. **Coaching cards display:** Each cue appears as a distinct card with an icon, a specific actionable message, and a contextual data point. For example:
   - Icon: Camera. Message: "Take a clear 'after' photo from the same angle as your 'before' shot. Your photo compliance is at 62% -- jobs with matched before/after photos have 40% fewer customer complaints." Data: "62% this week, down from 78% last week."
   - Icon: Clock. Message: "Try to arrive within the scheduled window. Customers rate on-time providers 0.8 stars higher on average." Data: "85% on-time this week."
4. **Positive reinforcement:** If a component recently improved significantly, show a green celebratory card: "Your customer rating climbed to 4.7 this week -- up from 4.3! Keep it up."
5. **Cue rotation:** If a provider returns the next day and has not improved the relevant metric, the same cue remains but with refreshed copy to avoid staleness. After 7 days, the cue messaging rotates to a different phrasing of the same advice.
6. **Quality Score page integration:** On the detailed Quality Score page, each of the four component metric cards (Rating, Issues, Photos, On-Time) shows a subtle coaching hint below the score if that component is in YELLOW, ORANGE, or RED range. Tapping the hint expands it to the full coaching message.
7. **Provider acts on coaching:** The provider improves their behavior. On their next visit, the coaching section reflects the updated scores and either celebrates improvement or adjusts the focus to the next priority area.

## UI/UX Design Recommendations

- **Coaching card design:** Use the existing Card pattern with a left-colored border (amber for improvement needed, green for positive reinforcement, red for urgent). Each card has: a relevant icon (Camera, Clock, Star, AlertTriangle), a bold headline action ("Improve your photo proof"), a 2-sentence coaching message in conversational tone, and a muted data row showing the current metric + trend arrow.
- **Priority ordering:** Show the most impactful cue first (biggest gap from green threshold or steepest decline). Limit to 3 cues maximum to avoid overwhelming the provider.
- **Tone:** Coaching cues should feel encouraging and specific, not punitive. Use "try" and "consider" rather than "you must." Frame improvements in terms of benefits: "Customers tip more when..." rather than "Your score is too low."
- **Inline hints on Quality Score page:** Below each ComponentMetric card, show a single line of coaching text in muted color with a lightbulb icon. Keep it to one sentence. Tapping reveals a tooltip or expandable section with the full coaching message. Only show for components below the GREEN threshold (score < 80).
- **Positive reinforcement styling:** Green background tint, checkmark or trophy icon, and celebratory language. These should feel like a reward, not just another card. Show these prominently -- above improvement cues -- to lead with positivity.
- **Avoid notification fatigue:** Coaching cues are shown only on the Insights and Quality Score pages -- do not push them as notifications. Providers see them when they choose to check their performance, which is the right context for absorbing improvement advice.
- **Skeleton/loading state:** While component scores load, show skeleton cards in the coaching section to indicate content is coming. Never show stale coaching cues from a previous session.

## Acceptance Criteria

- The hardcoded coaching tips on the Provider Insights page are replaced with dynamically generated coaching cues based on the provider's actual component scores and trends.
- Coaching cues are personalized: they reference the provider's specific metric values and recent changes.
- Each coaching cue includes a concrete, actionable recommendation (not just "improve your score").
- The system selects the 2-3 most relevant cues based on which components are furthest below threshold or declining fastest.
- Positive reinforcement cues appear when a component score improves by 5+ points or crosses into the GREEN band.
- The Quality Score page shows inline coaching hints below component metrics that are below the GREEN threshold.
- Coaching cue copy rotates after 7 days to avoid repetition, even if the underlying metric has not changed.
- Coaching cues do not generate push notifications or emails -- they are displayed only on the provider performance pages.
- The coaching cue system is template-driven and maintainable: adding a new cue for a new scenario does not require code changes (templates should be configurable or stored as structured data).
- No regressions to existing Insights page stat cards, Quality Score page, or weekly rollup display.
- The coaching section gracefully handles edge cases: new providers with no score data (show an onboarding welcome message instead), providers with all-green scores (show only positive reinforcement).
