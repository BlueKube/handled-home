# PRD 228: Auto-Promote Backup Provider When Primary Suspended

> **Status:** PLACEHOLDER
> **Priority:** P0 Critical
> **Effort:** Small (1–2 days)

## What Exists Today

The zone model supports a franchise-style territory structure where each zone-category combination has designated PRIMARY and BACKUP providers. The `zone_category_providers` table tracks each provider's role (PRIMARY or BACKUP), their status (ACTIVE, SUSPENDED, etc.), a priority rank, and a performance score. Admins can view and manage provider assignments through a Zone Providers panel in the admin console.

Inside the `enforce_sla_suspensions` procedure, there is already rudimentary promotion logic: when a PRIMARY provider is suspended, the system selects the highest-ranked active BACKUP (ordered by priority rank ascending, then performance score descending) and updates their role to PRIMARY. A notification is sent to the promoted provider.

However, this logic only runs inside the SLA enforcement flow. If a primary provider is suspended manually by an admin (through the admin console), no automatic promotion occurs. The zone simply loses its primary provider and enters an unstaffed state until an admin manually reassigns. Additionally, the current promotion logic does not handle several important scenarios: what happens when there are no backups available, what happens to the promoted provider's original BACKUP slot, how to notify affected customers that their provider has changed, and how to handle the case where a suspended provider is later reinstated.

## What's Missing

1. **Event-driven promotion trigger** -- Promotion logic should fire whenever any provider's status changes to SUSPENDED, regardless of whether the suspension was triggered by the auto-SLA system, a manual admin action, or any other pathway. Currently it only runs within the SLA enforcement procedure.

2. **No-backup fallback workflow** -- When no backup provider is available for promotion, the system should immediately alert admins with a "coverage gap" notification and surface the affected zone-category in an urgent ops queue. Today the zone silently goes unstaffed.

3. **Backfill the backup slot** -- When a backup is promoted to primary, the backup slot is now empty. The system should flag this zone-category as "needs backup" and suggest candidates from adjacent zones or the provider applicant pool.

4. **Customer notification on provider change** -- Affected customers whose upcoming jobs will be fulfilled by a different provider should receive a warm, reassuring notification. Today no customer communication occurs during promotion.

5. **Reinstatement logic** -- When a previously suspended provider is reinstated, the system needs to determine their new role. They should not automatically displace the provider who was promoted to fill their slot. Instead, they should return as a backup unless an admin explicitly reassigns roles.

6. **Promotion audit trail** -- Every promotion event should be logged with the reason, the suspended provider, the promoted provider, and the admin (or system) that triggered it, for operational transparency and dispute resolution.

## Why This Matters

### For the Business
- A zone without a primary provider is a zone where jobs go unassigned. Every hour of coverage gap means customers in that zone may not receive their scheduled service. For a density-based model like Handled Home, where predictable service days are the core promise, even a single missed day erodes the "set-it-and-forget-it" trust that drives retention.
- Automating promotion across all suspension triggers (not just SLA) eliminates a category of operational emergencies. Admins should not need to remember to manually reassign after every suspension -- the system should handle continuity by default.
- The backup provider model is an insurance policy. If promotion only works in one specific code path, the insurance has a coverage gap.

### For the User
- Customers experience zero-downtime service transitions. Their lawn still gets mowed, their house still gets cleaned -- the only thing that changes is which crew shows up, and they get a friendly heads-up about it.
- Backup providers who have been waiting for an opportunity get recognized and rewarded. Being promoted to primary means more consistent work, which drives provider retention and satisfaction.
- Admins gain confidence that suspending a provider (for any reason) will not create a fire drill. The system handles continuity, freeing admins to focus on the suspension decision itself rather than the downstream logistics.

## User Flow

### Automatic Promotion (System)
1. A provider's status in a zone-category changes to SUSPENDED (via SLA enforcement, manual admin action, no-show threshold, or any other trigger).
2. The system checks if the suspended provider held the PRIMARY role for that zone-category.
3. If yes, the system queries for the best available BACKUP provider: active status, ordered by priority rank (lowest first), then by performance score (highest first).
4. **If a qualified backup exists:**
   - The backup's role is updated from BACKUP to PRIMARY.
   - The promoted provider receives a congratulatory notification: "Great news -- you've been promoted to Primary provider for [Zone Name] / [Category]. You'll now receive all primary assignments in this area."
   - All customers in that zone-category with upcoming jobs receive a notification: "Your upcoming [Category] service will be handled by [New Provider Name]. We've selected them for their excellent track record in your area."
   - The zone-category is flagged as "backup slot open" for admin attention.
   - An audit log entry records the promotion: suspended provider, promoted provider, trigger reason, and timestamp.
5. **If no qualified backup exists:**
   - The zone-category is flagged as "COVERAGE GAP -- NO PRIMARY" in the ops dashboard.
   - All ops-level admins receive an urgent notification: "[Zone Name] / [Category] has no primary provider. Immediate action required."
   - Upcoming jobs for this zone-category are flagged in the dispatcher queue as "unassigned -- provider suspended."
   - The system suggests candidate providers from adjacent zones who cover the same category.

### Admin: Reviewing Promotion Events
6. Admin opens the Provider Coverage dashboard and sees a feed of recent promotion events.
7. Each promotion card shows: zone, category, who was suspended, who was promoted, and whether a backup slot is now open.
8. Admin can tap "Fill Backup" to assign a new backup provider from a list of eligible candidates, or the system can suggest candidates based on proximity and performance.

### Provider Reinstatement Flow
9. When a previously suspended provider is reinstated (via admin action after a cooling-off period), the system assigns them the BACKUP role for their original zone-category by default.
10. Admin receives a prompt: "[Provider] has been reinstated for [Zone/Category]. They have been assigned as Backup. Would you like to adjust roles?" with options to keep current roles, swap primary and backup, or assign to a different zone.

## UI/UX Design Recommendations

- **Coverage status indicator on zone list:** Each zone row in the admin zone list should show a provider coverage pill: "2P / 1B" (2 primary, 1 backup) in green when fully staffed, "1P / 0B" in amber when backup is missing, and "0P / 1B" or "0P / 0B" in red when primary is missing. This gives admins an instant read on coverage health across all zones.
- **Promotion event feed:** On the Provider Coverage or Ops Dashboard page, show a chronological feed of recent promotion events as compact cards. Each card shows an upward arrow icon (promotion) in green or a warning triangle (coverage gap) in red, with the zone name, category, and the providers involved. Tapping expands to show full context.
- **"Fill Backup" quick action:** When a backup slot opens due to promotion, show a persistent amber banner on the zone detail page: "Backup provider needed for [Category]. [Suggest] or [Assign manually]." The suggest action shows a ranked list of candidates with their quality scores, proximity, and current workload.
- **Customer notification preview:** Before confirming a manual suspension, show the admin a preview of what customers will see: "X customers have upcoming jobs. They will receive this message: [preview]. Proceed?" This prevents admins from being surprised by downstream communication.
- **Reinstatement role picker:** When reinstating a suspended provider, show a clear modal with the current zone-category staffing: "Current Primary: [Name]. Current Backup: [None/Name]. Reinstate [Suspended Provider] as: [Backup (recommended)] [Primary] [Other Zone]." Default to backup with a brief explanation: "The current primary was promoted to fill this role and has been performing well."

## Acceptance Criteria

- When any provider's status changes to SUSPENDED (regardless of trigger), the system checks if they held a PRIMARY role and initiates promotion if so
- The highest-ranked active BACKUP provider (by priority rank, then performance score) is automatically promoted to PRIMARY
- Promoted providers receive a notification confirming their new PRIMARY role with zone and category details
- Customers with upcoming jobs in the affected zone-category receive a warm notification about their new provider
- When no backup is available for promotion, admins receive an urgent "coverage gap" notification and the zone-category is surfaced in an ops alert queue
- The vacated BACKUP slot is flagged for admin attention with candidate suggestions
- Every promotion event is logged in an audit trail with trigger reason, suspended provider, promoted provider, and timestamp
- When a suspended provider is reinstated, they are assigned the BACKUP role by default (not automatically restored to PRIMARY)
- Admins can manually adjust roles after reinstatement through a clear role-picker interface
- The zone list view shows real-time provider coverage status for each zone-category
- Promotion works correctly when triggered by manual admin suspension, SLA auto-suspension, no-show threshold suspension, or any other status change to SUSPENDED
