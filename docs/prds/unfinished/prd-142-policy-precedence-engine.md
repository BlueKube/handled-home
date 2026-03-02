# PRD 142: Policy Precedence Engine (5-Level Resolution)

> **Status:** PLACEHOLDER
> **Priority:** P1 High
> **Effort:** Large (1–2 weeks)

## What Exists Today
The `support_policies` table stores versioned policy documents with a `dials` JSON field that can contain arbitrary resolution parameters (credit amounts, redo eligibility, refund limits, etc.). Policies have lifecycle management: draft, published, rolled_back statuses, with version numbering and change reason tracking. The `support_policy_scopes` table exists with a `scope_type` enum (global, zone, category, sku, provider) and fields for `scope_ref_id`, `scope_ref_key`, and `active_policy_id`. The `useSupportPolicies` hook fetches policies and scopes and provides mutations for creating, publishing, and rolling back policies. The OpsDefinitions admin page likely surfaces this. However, the scopes table is currently just a flat lookup -- there is no resolution logic that evaluates multiple matching scopes and determines which policy's dials should apply for a given support interaction. Policies are created and stored but not consumed with precedence.

## What's Missing
- **Precedence resolution logic.** The core engine that, given a specific support context (provider, SKU, category, zone), finds all matching policy scopes and returns the winning policy's dials based on the 5-level hierarchy: provider > sku > category > zone > global. More specific scopes override broader ones.
- **Policy dial merging.** When a more specific scope only overrides some dials (e.g., a provider-level policy sets max credit to $20 but doesn't specify redo eligibility), the remaining dials should inherit from the next broader scope. This is a merge/cascade behavior, not a full replacement.
- **Integration with auto-resolve and admin tooling.** The auto-resolve function currently has a hard-coded $50 credit cap. This should instead consult the policy engine to determine the appropriate cap for the specific context. Similarly, admin offer presentation should show policy-derived limits.
- **Policy preview and conflict visualization.** Admins need to see which policy applies in a given scenario before creating new scopes, to avoid unintended conflicts or gaps.
- **Audit trail for policy resolution.** When a policy is applied to a ticket resolution, the system should record which scopes were evaluated and which policy won, for transparency and debugging.

## Why This Matters
### For the Business
Without precedence, the policy system is effectively a single global configuration. Ops teams cannot say "lawn care credits max at $30, but this specific high-risk provider is capped at $15" or "in this zone where we have margin pressure, redo eligibility is more restricted." Granular policy control is essential for managing unit economics across different geographies, service categories, and provider risk profiles. The difference between a $30 and a $50 credit cap, applied across thousands of resolutions, has material impact on margins. The 5-level hierarchy enables fine-grained ops control without requiring a unique policy for every possible combination.

### For the User
For admins, the policy engine transforms the support system from a one-size-fits-all ruleset to a precision instrument. They can experiment with different resolution parameters in specific zones or categories without affecting the entire system. For customers, policies ensure resolution offers are consistent and appropriate for their service context rather than applying blanket rules that may be too generous or too restrictive. For providers, consistent policy application means fair and predictable treatment.

## User Flow
1. Admin navigates to the Policy Management section (within Ops Definitions or a dedicated route).
2. Admin sees the current policy hierarchy visualized as a tree or table: global policy at the top, then zone-level overrides, category-level overrides, SKU-level overrides, and provider-level overrides at the bottom (most specific).
3. To create a new override, admin clicks "Add Override" and selects the scope level (zone, category, SKU, or provider).
4. Admin selects the specific scope target (e.g., a particular zone, a specific SKU, or a provider org).
5. Admin configures only the dials they want to override. Unconfigured dials show their inherited values (grayed out) from the next broader scope, so the admin understands what defaults will apply.
6. Admin writes a change reason and saves the policy as a draft.
7. Admin previews the policy by entering a test scenario (e.g., "Provider X, SKU Y, Zone Z") and sees which dials would apply, with annotations showing which scope each dial comes from.
8. Admin publishes the policy. It becomes active immediately for new support interactions.
9. When a support ticket is created or an auto-resolve is attempted, the system evaluates the ticket's context (provider org, job SKU, issue category, zone) against all active policy scopes.
10. The engine returns the merged policy dials, with more specific scopes overriding broader ones. This determines credit caps, redo eligibility, refund limits, and other resolution parameters.
11. The auto-resolve function uses the resolved policy dials instead of hard-coded values. Admin offer presentation shows policy-compliant options.
12. The resolution event logs which scopes were matched and which policy was applied, for audit purposes.

## UI/UX Design Recommendations
- **Hierarchy visualization.** Display the policy hierarchy as a visual tree or layered table. Global at the top, then expanding rows for each zone, category, SKU, and provider override. Use indentation and connector lines to show the cascade relationship. Badge each node with the number of dials it overrides.
- **Override editor with inheritance preview.** When creating or editing a scope-level policy, show a two-column layout: left column lists all available dials (max credit, redo eligibility, refund limit, SLA hours, etc.), right column shows the current value with a source annotation (e.g., "Inherited from Global" in gray, or the overridden value in bold with an edit control). Only dials the admin explicitly sets are considered overrides.
- **Conflict detection banner.** If an admin creates an override that conflicts with or is superseded by a more specific existing override, show a warning banner: "Note: Provider ABC already has a provider-level override for max credit. Your SKU-level setting will not apply to that provider."
- **Test scenario tool.** A "Policy Tester" panel where the admin can select a provider, SKU, category, and zone, then see the fully resolved policy with annotations showing which scope contributed each dial value. This is the single most important tool for admin confidence.
- **Policy version history.** Each scope's policy should show a version timeline with change reasons, who made the change, and when. Allow one-click rollback to a previous version per scope.
- **Dashboard summary card.** On the Ops dashboard, show a "Policy Coverage" card: X global dials set, Y zone overrides active, Z provider-specific overrides. This gives a quick sense of policy complexity.

## Acceptance Criteria
- Policy resolution evaluates all matching scopes for a given context (provider, SKU, category, zone) and returns merged dials
- More specific scopes override broader ones in strict order: provider > sku > category > zone > global
- Dials not overridden at a specific scope level inherit from the next broader matching scope
- Auto-resolve function uses policy-resolved credit cap instead of the hard-coded $50 limit
- Admin offer presentation respects policy-derived limits and options
- Admin UI shows the policy hierarchy with clear visualization of overrides and inheritance
- Override editor displays inherited values alongside override controls
- Policy Tester tool allows admins to preview resolved dials for any scenario
- Policy application is logged in ticket events for audit (which scopes matched, which policy applied)
- Conflict warnings appear when an override is superseded by a more specific existing override
- Policy changes are versioned with change reasons and support one-click rollback
- Global policy always exists as a fallback; the system never returns empty dials
