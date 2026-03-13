# PRD 144: Evidence Replay for Customer Issue Review

> **Status:** PARTIALLY COMPLETE
> **Priority:** P1 High
> **Effort:** Medium (3–5 days)

## What Exists Today
The backend comprehensively captures visit evidence. The `useCustomerVisitDetail` hook fetches job photos (with signed URLs from storage), checklist items (with completion status and reason codes), time-on-site data (computed from arrived_at/departed_at timestamps), and provider summary notes. The Customer Visit Detail page already presents this data in separate cards: a "Presence Proof" card showing arrival time, departure time, and time on site; a "Photo Proof" gallery; a "Before & After" slider component using a drag-to-compare UI; and a "Work Summary" card showing checklist highlights and provider notes. A `BeforeAfterSlider` component exists with a polished drag interaction.

However, when a customer reports an issue and views their support ticket (Customer Support Ticket Detail page), none of this evidence is shown. The ticket detail view only displays: the ticket status, the customer's original note, the resolution summary (if resolved), any pending or accepted offers, an activity timeline, and an "Add more info" button. There is a complete disconnect between the rich evidence collected during the visit and the support ticket experience. The customer cannot see the before/after photos, the checklist, or the time-on-site data in the context of their issue.

## What's Missing
- **Evidence replay section in the customer support ticket detail view.** When a ticket is linked to a job (via `job_id`), the ticket detail page should display the same evidence available on the Visit Detail page, but framed as "What happened during your visit" -- providing context for the issue.
- **Contextual evidence framing.** The evidence should be presented in a narrative sequence: arrival proof, before photos, work performed (checklist), after photos, departure. This tells a story rather than showing disconnected data cards.
- **Issue-specific photo display.** Customer-submitted issue photos (from the `customer_issues` table, with `photo_storage_path`) should be shown alongside or contrasted with provider-submitted job photos, making it easy for the customer to see both perspectives.
- **Evidence summary for trust building.** A brief, automatically generated summary that contextualizes the evidence: "Your provider arrived at 10:15 AM, spent 42 minutes on site, completed 8 of 9 checklist items, and uploaded 4 photos."
- **Evidence in the admin ticket detail view.** Admins reviewing a ticket should also see the evidence replay inline, so they don't have to navigate to a separate job detail view to understand what happened.

## Why This Matters
### For the Business
Customers who see transparent evidence of what happened during their visit are significantly more likely to accept resolution offers quickly and less likely to escalate to chargebacks. Evidence replay reduces "he said / she said" dynamics by showing objective data. This has direct impact on resolution time, chargeback rate, and customer satisfaction. A customer who sees that the provider was on site for 42 minutes and completed 8 of 9 checklist items has a very different emotional state than one who just sees "your ticket is under review." Transparency builds trust in the platform's fairness.

### For the User
Customers reporting issues often feel uncertain about whether they'll be treated fairly. Evidence replay shows them that the platform has detailed records of what happened, which serves two purposes. First, for legitimate issues, it confirms their concern by showing what was or wasn't done. Second, for marginal complaints, it may help the customer self-calibrate by seeing that the provider did in fact complete most of the work. Either way, the customer feels informed and respected rather than kept in the dark.

## User Flow
1. Customer opens the Customer Support Ticket Detail page for a ticket linked to a job.
2. Below the ticket header and status, a new "Visit Evidence" section appears with a header like "What happened during your visit."
3. The section opens with an evidence summary banner: "Provider arrived at 10:15 AM, was on site for 42 minutes, and completed 8 of 9 tasks."
4. Below the summary, an expandable "Presence Proof" card shows arrival time, departure time, and total time on site -- same data as the Visit Detail page.
5. If before/after photos exist for the job, the "Before & After" slider is shown, allowing the customer to drag-compare the photos.
6. If the customer submitted issue photos, those appear in a separate "Your Evidence" card alongside the provider's job photos, with clear labels distinguishing "Provider's photos" from "Your photos."
7. A "Work Completed" card shows the checklist highlights: completed items with green checks, incomplete items with red X marks and reason codes.
8. If the provider left a summary note, it appears in a "Provider's Notes" card.
9. The customer can scroll through all evidence, then return to the resolution offers or add-more-info section to respond informed by the evidence.
10. For admin users viewing the same ticket in the Admin Support Ticket Detail page, the same evidence replay section appears, giving admins full context without navigating away.

## UI/UX Design Recommendations
- **Narrative card sequence.** Present evidence as a vertical sequence of cards that tell a chronological story. Use subtle connecting lines or a timeline spine on the left to reinforce the narrative flow: Arrival -> Before Photos -> Work Done -> After Photos -> Departure -> Issue Reported.
- **Evidence summary banner.** A compact, high-signal banner at the top of the evidence section using an icon-rich layout: clock icon + "42 min on site" | camera icon + "4 photos" | check icon + "8/9 tasks complete." This gives the customer a quick overview without scrolling.
- **Before/After slider (reuse existing component).** The `BeforeAfterSlider` component already exists and works well. Embed it directly in the ticket detail view when before/after photo pairs are available.
- **Photo comparison layout.** When showing provider photos alongside customer-submitted issue photos, use a two-column layout with clear headings: "Provider's Documentation" on the left and "What You Reported" on the right. This side-by-side comparison is powerful for building understanding.
- **Collapsed by default, expandable.** On the customer ticket detail view, the evidence section should be collapsed by default (showing just the summary banner) with an "Expand to see full evidence" button. This keeps the page focused on the resolution while making evidence easily accessible. On the admin view, show it expanded by default since admins need the full picture.
- **Checklist visualization.** Use the same check/X icon pattern from the Visit Detail page. For incomplete items, show the reason code in a muted label (e.g., "Not completed: gate locked").
- **Empty state handling.** If a ticket is not linked to a job, or the job has no evidence data, don't show the evidence section at all. If some evidence types are missing (e.g., no photos but checklist exists), show what's available without empty placeholder cards.

## Acceptance Criteria
- Customer Support Ticket Detail page shows an evidence replay section for tickets linked to a job
- Evidence summary banner displays time on site, photo count, and checklist completion rate
- Presence Proof card shows arrival time, departure time, and total time on site
- Before/After slider appears when matching before/after photo pairs exist for the job
- Customer-submitted issue photos display alongside provider job photos with clear labels
- Checklist highlights show completed and incomplete items with reason codes
- Provider summary note displays when available
- Admin Support Ticket Detail page also shows the evidence replay section
- Evidence section does not appear for tickets without a linked job
- Evidence section handles partial data gracefully (missing photos, missing checklist, etc.)
- Signed URLs for photos are generated securely with appropriate expiration
- Evidence replay loads without blocking the rest of the ticket detail page (data fetched in parallel)
