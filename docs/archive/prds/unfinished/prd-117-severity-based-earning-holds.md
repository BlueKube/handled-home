# PRD 117: Severity-Based Earning Holds

> **Status:** PARTIALLY COMPLETE
> **Priority:** P1 High
> **Effort:** Medium (3–5 days)

## What Exists Today
The `provider_holds` table exists with fields for `severity`, `hold_type`, `status`, `earning_id`, and `released_at`. Provider earnings already support `ELIGIBLE`, `HELD`, and `HELD_UNTIL_READY` statuses. When a customer reports a HIGH severity issue, the linked provider earning row is set to HELD status. There is an RPC function `release_eligible_earning_holds` that releases holds. The Provider Earnings page displays held balances separately from available balances, and individual earning cards show hold reason and estimated release time when expanded. The Exceptions page shows exception queue entries with severity badges (HIGH vs. secondary). The foundation for hold-based earning management is in place.

## What's Missing
The explicit severity-to-hold-duration mapping is incomplete. Currently all holds behave the same regardless of the issue severity. What needs to be built:

- **LOW severity = no hold.** Minor quality complaints (e.g., billing question, routine change request) should not freeze any provider earnings. The earning should remain ELIGIBLE.
- **MEDIUM severity = soft hold (24-48 hours).** Quality complaints and missed-item reports should create a time-limited hold that automatically releases if no escalation occurs within the hold window. The provider should see a countdown. If the issue is resolved during the hold window, the hold releases immediately. If the window expires without escalation, the hold releases automatically.
- **HIGH severity = hard hold with exception queue entry.** Damage reports and safety concerns should create an indefinite hold that requires manual admin release. A corresponding exception queue entry must be created so the admin team is aware and can investigate. The hold does not auto-release.
- **Admin override capability.** Admins should be able to manually release any hold early, or convert a soft hold to a hard hold if investigation reveals the issue is more serious than initially classified.
- **Provider-facing transparency.** The provider needs to understand why their earnings are held, what type of hold it is, and when (if ever) it will automatically release.

## Why This Matters
### For the Business
Treating all holds identically creates two failure modes. First, it over-penalizes good providers for minor complaints, damaging retention and trust. Providers who consistently see earnings frozen for trivial issues will leave the platform. Second, it under-protects the business on serious claims. A damage report needs an indefinite hold because the liability exposure may be significant, and releasing earnings before investigation completes creates financial risk. Proportional holds align business exposure with issue severity.

### For the User
Providers need to trust that the earnings system is fair. Seeing a 24-hour hold for a "wrong day" billing question feels punitive and arbitrary. Conversely, providers should understand that a property damage claim warrants a longer investigation. Clear communication about hold type, reason, and expected release time builds trust. On the customer side, the hold system protects against premature payout for unresolved serious issues, ensuring the business retains leverage to make things right.

## User Flow
1. Customer reports an issue through the Guided Resolver flow, selecting a category (quality, missed, damage, billing, safety, routine_change).
2. The system maps the category to a severity level (LOW, MEDIUM, HIGH/CRITICAL) using the existing severity mapping.
3. If the severity is LOW: no hold is created. The provider earning stays ELIGIBLE. The support ticket is created and handled normally.
4. If the severity is MEDIUM: a soft hold is created on the provider's earning for that job. The hold has a 24-hour window (extendable to 48 hours if the admin requests more time). The provider sees a "Soft Hold" badge on the earning with a countdown timer showing when it will auto-release.
5. If the severity is HIGH or CRITICAL: a hard hold is created on the provider's earning. An exception queue entry is automatically created and appears in the admin Exceptions dashboard. The provider sees a "Hold — Under Investigation" badge with no release date. The hold remains until an admin manually releases it.
6. Provider opens their Earnings page and sees the held earning with a clear explanation: hold type (soft/hard), reason category, and expected resolution.
7. Provider can tap the held earning to see more details and a link to the related support ticket where they can respond with a statement or evidence photos.
8. For soft holds: if the issue is resolved (ticket resolved) before the window expires, the hold is released immediately. If the window expires without escalation, the hold auto-releases.
9. For hard holds: admin reviews the exception queue, investigates the issue, and explicitly releases the hold (or voids the earning if liability is confirmed). The provider is notified when the hold is released.
10. Admin can override at any point: release a hard hold early, convert a soft hold to a hard hold, or extend a soft hold window.

## UI/UX Design Recommendations
- **Provider Earnings card — hold indicator:** Use a clear visual hierarchy for hold states. Soft holds get a yellow/amber "Soft Hold" badge with a countdown ("Releases in 18h"). Hard holds get a red "Under Investigation" badge with no countdown. No hold gets no badge (earning shows as ELIGIBLE in green).
- **Hold detail sheet:** Tapping a held earning opens a bottom sheet with: reason category (e.g., "Quality concern reported by customer"), hold type explanation ("This is a temporary hold. Your earnings will be released automatically if no further action is needed."), link to the support ticket, and for soft holds a visual countdown progress bar.
- **Provider notification:** When a hold is created, send an in-app notification with the hold type and reason. When a hold is released, send a success notification. Use distinct tones: soft hold creation is informational (blue), hard hold creation is cautionary (amber), hold release is positive (green).
- **Admin Exceptions integration:** Hard hold exception entries should appear prominently in the admin Exceptions page with a "Provider Earnings Hold" label, the amount being held, and quick-action buttons for "Release Hold" and "Void Earning."
- **Admin hold management:** In the admin Support Ticket Detail view, add a "Hold Status" card that shows the current hold state for the linked earning, with controls to release, extend, or escalate the hold.

## Acceptance Criteria
- LOW severity issues do not create any earning hold; the provider earning remains ELIGIBLE
- MEDIUM severity issues create a soft hold with a default 24-hour auto-release window
- HIGH and CRITICAL severity issues create a hard hold and automatically create an exception queue entry
- Soft holds auto-release when the hold window expires without escalation
- Soft holds release immediately when the linked support ticket is resolved
- Hard holds persist until an admin explicitly releases them
- Provider Earnings page shows distinct visual indicators for soft holds (with countdown) and hard holds (under investigation)
- Providers receive notifications when holds are created and released
- Admins can release, extend, or escalate holds from the Support Ticket Detail view
- Admin Exceptions page shows hard-hold exception entries with amount and quick actions
- Hold state transitions are logged as events in the support ticket timeline
