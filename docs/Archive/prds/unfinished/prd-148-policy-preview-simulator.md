# PRD 148: Policy Preview Simulator

> **Status:** NOT STARTED
> **Priority:** P2 Medium
> **Effort:** Large (1-2 weeks)

## What Exists Today

The support policy engine is fully built. Admins can create versioned policies with configurable "dials" (JSON settings that control resolution behavior), publish them, and roll them back. Policies are scoped at multiple levels -- global, zone, category, SKU, and provider -- via the `support_policy_scopes` table. The `auto-resolve-dispute` edge function evaluates these policies when processing tickets, and the AI classification system uses policy context to determine resolution offers (credits, redos, plan changes).

Admins can manage policies through `useSupportPolicies` (create, publish, rollback) and view scopes. The admin support ticket detail page shows AI classification results, evidence scores, risk scores, and resolution offers.

However, there is no way to simulate "what would happen if..." without creating a real ticket. Admins cannot test how a policy change would affect different scenarios before publishing.

## What's Missing

1. **Simulator page:** A dedicated admin page (e.g., `/admin/support/policy-simulator`) where admins can input hypothetical scenario parameters and see what resolution offers would be generated.
2. **Scenario input form:** Fields for ticket type, category, severity, SKU, zone, provider, customer history profile, and evidence quality to construct a test case.
3. **Policy resolution preview:** A display showing which policy would match (including scope cascading logic), what dials would apply, and what offers would be presented to the customer.
4. **Side-by-side comparison:** The ability to compare the current published policy's output against a draft policy's output for the same scenario, so admins can see the impact of their changes before publishing.
5. **Scenario library:** A set of saved/preset scenarios representing common real-world cases (e.g., "First-time customer, missed mow, has photos," "Repeat complainer, no evidence, high-value plan") for quick testing.

## Why This Matters

### For the Business
Policy changes are currently "deploy and pray." Admins discover unexpected results only when real customers hit edge cases. This creates two problems: (1) admins are afraid to iterate on policies, leading to stale defaults that do not adapt to changing business needs; and (2) when they do make changes, mistakes can result in over-generous credits or unfair denials before anyone notices. A simulator lets admins iterate confidently, which directly improves resolution quality and protects margins. One incorrect policy change that auto-applies $50 credits to a broad category could cost thousands before detection.

### For the User
Better-tuned policies mean customers get fairer, more consistent resolution offers. When policies are stale because admins are afraid to change them, edge cases accumulate where customers get inappropriate responses. Customers in a specific zone with a specific provider issue should get a tailored response, but that only happens if admins feel safe creating fine-grained policies.

## User Flow

1. Admin navigates to the Policy Simulator page from the admin sidebar or from the existing policy management area.
2. Admin fills in scenario parameters:
   - **Ticket type** (dropdown: service_quality, billing, scheduling, safety, other)
   - **Category** (dropdown populated from existing categories)
   - **Severity** (dropdown: low, medium, high, critical)
   - **SKU** (searchable dropdown from active SKUs)
   - **Zone** (dropdown from active zones)
   - **Provider** (optional -- searchable dropdown from active provider orgs)
   - **Evidence quality** (slider: 0-100, simulating the AI evidence score)
   - **Risk score** (slider: 0-100, simulating the AI risk score)
   - **Customer profile** (radio: first-time reporter, occasional, frequent complainer)
   - **Ticket value estimate** (currency input, representing the job/invoice value)
3. Admin clicks "Simulate."
4. The simulator displays results in a structured panel:
   - **Matched policy:** Which policy version matched, at which scope level (with cascading explanation, e.g., "SKU-level policy overrides zone default").
   - **Applied dials:** The resolved dial values that would govern this scenario.
   - **Resolution path:** Whether the ticket would be auto-resolved, offered credit, queued for review, or escalated.
   - **Offers generated:** Specific offers that would be presented (credit amount, redo option, plan change), with explanations.
   - **Confidence assessment:** Whether the AI would likely auto-resolve or flag for human review based on the evidence and risk scores.
5. (Optional) Admin toggles a "Compare with draft" switch, selects a draft policy, and sees both the current and draft outputs side by side with differences highlighted.
6. Admin can save the scenario to a library for future reference or share it with other admins.
7. From the results panel, a "Publish this policy" shortcut allows the admin to publish a draft policy they are satisfied with, directly from the simulator context.

## UI/UX Design Recommendations

- **Two-panel layout:** Left panel for scenario inputs, right panel for simulation results. On mobile, stack vertically with a sticky "Simulate" button at the bottom.
- **Smart defaults:** Pre-populate the form with the most common scenario (medium severity, service_quality type, average evidence score) so admins can run a simulation immediately and then adjust parameters.
- **Scope cascade visualization:** Show the policy resolution chain as a vertical breadcrumb or waterfall: Global -> Zone -> Category -> SKU -> Provider, with the matching level highlighted and non-matching levels grayed out. This teaches admins how scope cascading works.
- **Diff view for comparisons:** When comparing current vs. draft, use a side-by-side card layout with green/red highlighting for changed values (similar to a code diff but for structured data). Highlight when a scenario that was previously "auto-resolve" would become "needs review" or vice versa.
- **Preset scenario chips:** A row of chip buttons at the top of the form for quick-loading common scenarios: "Happy path," "No evidence," "Repeat reporter," "High-value dispute," "Safety concern." Clicking a chip fills in all fields.
- **Result cards:** Each section of the results (matched policy, applied dials, resolution path, offers) should be a distinct card with clear headings. Use color coding: green for auto-resolve outcomes, amber for needs-review, red for escalation.
- **Warning callouts:** If the simulation reveals a potentially problematic outcome (e.g., auto-resolving a high-value dispute, or denying a first-time customer), show a yellow warning callout explaining the concern.
- **No real data mutation:** Make it visually clear (e.g., a "Simulation Mode" badge in the header) that this page does not create real tickets or apply real credits.

## Acceptance Criteria

- Admin can access a Policy Simulator page from the admin navigation.
- The scenario input form includes all key parameters: ticket type, category, severity, SKU, zone, provider, evidence score, risk score, customer profile, and ticket value.
- Clicking "Simulate" returns the matched policy, resolved dials, predicted resolution path, and generated offers within 2 seconds.
- The scope cascade is visualized, showing which policy level matched and why.
- Admins can compare current published policy output against a draft policy output for the same scenario.
- Differences between current and draft policy outcomes are clearly highlighted.
- At least 5 preset scenarios are available for quick loading.
- Admins can save custom scenarios to a library for reuse.
- The simulator is read-only -- no real tickets, credits, or offers are created.
- The page is accessible only to admin-role users.
- Mobile-responsive layout that remains usable on smaller screens.
