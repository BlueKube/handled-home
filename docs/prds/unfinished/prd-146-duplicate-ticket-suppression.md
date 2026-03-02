# PRD 146: Duplicate Ticket Suppression

> **Status:** PLACEHOLDER
> **Priority:** P1 High
> **Effort:** Medium (3-5 days)

## What Exists Today

The AI ticket classification system (`support-ai-classify` edge function) already detects potential duplicates. When a ticket is classified, the AI receives the customer's 5 most recent tickets and can return a `duplicate_ticket_id` if it identifies a match. The schema supports this with a `duplicate_of_ticket_id` foreign key on the `support_tickets` table, and the AI inference run logs the detected duplicate ID.

The `ReportIssueSheet` component handles the customer-facing issue submission flow (reason selection, description, photo upload), and `useSupportTicketDetail` provides ticket detail queries including offers, events, and attachments. The admin `SupportTicketDetail` page shows full ticket context.

However, none of this duplicate detection feeds back into the customer experience. A customer can submit the same issue twice, creating two parallel tickets that waste admin time and confuse resolution.

## What's Missing

1. **Pre-submission duplicate check:** Before a customer submits a new ticket, the system should check for open/recent tickets on the same job or with similar issue types and surface them.
2. **Customer-facing duplicate alert UI:** A component that says "It looks like you already reported this -- here's the status of your existing ticket" with a direct link to the existing ticket.
3. **Soft gate in the submission flow:** After the customer selects a reason and before they write details, show any matching open tickets and let them choose to either view the existing ticket or proceed with a new one.
4. **Post-classification duplicate linking:** When the AI flags a ticket as a duplicate after submission, the customer should see a banner on the new ticket detail page saying "This issue has been linked to an earlier report" with a link.
5. **Admin-side duplicate indicator:** The admin ticket queue should show a badge or icon when a ticket has been flagged as a duplicate, with one-click navigation to the original.

## Why This Matters

### For the Business
Duplicate tickets inflate the support queue and distort metrics like ticket volume and resolution time. In mature support systems, suppressing duplicates at submission time reduces ticket volume by 15-25%. Every duplicate ticket that reaches an admin costs 3-5 minutes of triage time. At scale, this translates directly to reduced ops headcount needs. Additionally, two parallel tickets for the same issue can lead to conflicting resolutions (e.g., double credits), which hurts margins.

### For the User
Customers who submit a duplicate often do so because they are anxious about their first report. Showing them "we received your earlier report and it's being reviewed" is actually more reassuring than letting them submit again. It reduces the feeling of shouting into a void. When customers discover they have two open tickets for the same thing, it erodes confidence in the system's competence.

## User Flow

1. Customer taps "Report a problem" on a completed job card, opening the `ReportIssueSheet`.
2. Customer selects a reason (e.g., "Missed something").
3. **New step -- Duplicate check:** Before advancing to the details form, the system checks for any open or recently resolved tickets from this customer on the same job (or with the same category if no job).
4. If a potential match is found, a card appears showing the existing ticket's status, category, and creation date. Two options are presented: "View existing ticket" (navigates to ticket detail) or "This is a different issue" (continues the submission flow).
5. If the customer chooses "This is a different issue," the flow continues normally to the description and photo step.
6. Customer submits the ticket. AI classification runs as usual.
7. If the AI also flags this as a duplicate post-submission, the new ticket detail page shows an informational banner: "This appears related to ticket #[short-id] -- our team is reviewing both together." The banner links to the original ticket.
8. On the admin side, tickets flagged as duplicates show a "Duplicate" badge in the queue list. Clicking the badge opens the original ticket in a side panel for quick comparison.
9. Admin can confirm the duplicate link (merging the tickets' context) or dismiss it if the AI was wrong.

## UI/UX Design Recommendations

- **Duplicate match card (Step 3):** Use a soft yellow/amber background card (consistent with the existing warning pattern in `ReportIssueSheet` for old visits). Show the ticket type icon, status badge (e.g., "Open," "In Review"), the customer's original note truncated to 2 lines, and the submission date. Use a friendly tone: "We found a recent report that looks similar."
- **Two clear action buttons:** "View my existing report" as the primary action (filled button) and "Report a different issue" as secondary (outline button). Bias the UX toward viewing the existing ticket since that is the desired outcome most of the time.
- **Post-classification banner:** On the ticket detail page, use a compact info banner (blue/info color) at the top that says "Linked to earlier report" with a right-arrow icon for navigation. This should feel informational, not alarming.
- **Admin duplicate badge:** A small pill badge in the ticket queue row, styled like existing badges. Orange color to draw attention without being critical. Hovering or tapping shows the linked ticket ID.
- **No blocking:** The duplicate check should never prevent submission. It is a suggestion, not a gate. Customers who are certain their issue is distinct should always be able to proceed.
- **Loading state:** The duplicate check should be fast (single query). Show a subtle skeleton shimmer for at most 1 second. If the check takes longer, skip it and proceed to the details step.

## Acceptance Criteria

- When a customer starts reporting an issue, any open or recently resolved (within 7 days) tickets for the same job are surfaced before the description step.
- The duplicate match card shows the existing ticket's status, category, original note preview, and submission date.
- Customers can choose to view the existing ticket or proceed with submitting a new one.
- If the AI classification flags a `duplicate_of_ticket_id`, the new ticket's detail page displays a linked-ticket banner with navigation to the original.
- The `duplicate_of_ticket_id` field is written to the ticket record when the AI detects a duplicate (this already works server-side -- just needs to be reflected in UI).
- Admin ticket queue shows a visible duplicate indicator on flagged tickets.
- Admins can confirm or dismiss the duplicate link from the ticket detail page.
- The duplicate check does not block or prevent ticket submission under any circumstance.
- The duplicate check query completes within 500ms and gracefully degrades (skips) if slow or errored.
- No regressions to the existing `ReportIssueSheet` submission flow for non-duplicate cases.
