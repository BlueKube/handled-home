# PRD 104: Handled Receipt (Visit Summary)

> **Status:** PARTIALLY COMPLETE
> **Priority:** P0 Critical
> **Effort:** Medium (3–5 days)

## What Exists Today

A VisitDetail page exists at `/customer/visits/:jobId` that displays the following for a completed job:

- **Presence proof card:** Arrival time, departure time, and calculated time on site.
- **Photo proof gallery:** Required and optional photos displayed in a grid, with a full-screen viewer sheet. A BeforeAfterSlider component enables side-by-side comparison when matching before/after photos exist.
- **Work summary card:** Provider's written summary and checklist highlights showing completed items (green checkmark) and items not completed with reasons (red X).
- **Courtesy upgrade notice:** If the provider performed a higher service level than scheduled, a card explains the upgrade and offers a one-tap button to make it permanent.
- **Provider recommendation card:** If the provider recommends a level change, a card with accept/decline options appears.
- **Quick feedback card:** A satisfaction check (thumbs up/down with optional tags) anchored to the receipt.
- **Private review card:** An anonymous provider rating with tags and optional comment.
- **Share CTA:** A button to share the after photo via a ShareCardSheet.
- **Receipt suggestions:** A growth surface showing related services the customer might want to add to their routine.
- **Report a problem:** An issue reporting sheet with status tracking for existing issues.

A RecentReceipt component on the customer dashboard shows a card linking to the most recent completed visit.

**What is missing is not more data -- it is the presentation.** The current VisitDetail page is a functional list of cards. It does not feel like a receipt. It lacks the branded, polished, "moment of delight" quality that makes a customer feel their home was truly handled.

## What's Missing

1. **Branded receipt identity** -- The page has no distinct visual identity as a "Handled Receipt." There is no branded header, no receipt-like visual language (clean lines, signature moment, completion stamp), and no sense of ceremony. It looks like any other detail page.

2. **Receipt header with completion stamp** -- A prominent header that says "Your Home is Handled" with the date, provider name or team, and a visual completion indicator (checkmark seal, branded stamp, or similar) that immediately communicates "this visit is done and accounted for."

3. **Unified narrative flow** -- The current page is a stack of independent cards with no connective tissue. A proper receipt tells a story: "Here's when we came, here's what we did, here's how it looks, here's how you can tell us how we did." The cards need to flow as a coherent narrative, not a disconnected list.

4. **Checklist rendering completeness** -- The current view only shows "highlights" (completed items and exceptions). A full receipt should show every checklist item for the job, organized by service, so the customer can see the complete scope of what was supposed to happen and what did happen.

5. **Time-stamped activity timeline** -- Instead of just showing arrival and departure as static numbers, the receipt could present a mini timeline: arrived, started first task, completed task, took photo, departed. This creates a more vivid picture of the visit.

6. **Shareable receipt format** -- The current share flow only shares the after photo. Customers should be able to share the entire receipt (or a beautiful summary card) as an image or link, which doubles as a referral and word-of-mouth growth tool.

7. **Print / save as PDF** -- Some customers want a permanent record. A clean print stylesheet or "Save as PDF" option lets customers archive receipts.

## Why This Matters

### For the Business
- **Retention driver:** The receipt is the single highest-impact touchpoint for subscription retention. Every visit is a renewal decision moment. A generic detail page says "we did the work." A beautiful receipt says "your home is handled, and here's the proof." The latter keeps customers subscribed.
- **Word-of-mouth growth engine:** When receipts are beautiful and shareable, customers show them to neighbors, share them on social media, and text them to friends. Every shared receipt is free, high-trust marketing. The current share flow (just a photo) does not carry the Handled brand or context.
- **Premium positioning:** Handled Home competes on trust and quality, not price. A polished receipt reinforces the premium positioning. Customers who pay more expect a premium experience at every touchpoint, including how they are shown what was done.
- **Dispute reduction:** A comprehensive, well-organized receipt with complete checklists and clear photos answers most customer questions before they become support tickets. "Was the patio swept?" -- the receipt shows a checked item and an after photo.

### For the User
- **Peace of mind:** The receipt answers the fundamental question every customer has after a visit: "What exactly happened at my home while I was away?" A beautiful, thorough receipt transforms anxiety into confidence.
- **Shareability as social proof:** Customers want to show their spouse, partner, or housemates what was done. A polished receipt makes this easy and impressive, rather than requiring the customer to narrate a list of photos.
- **Accountability record:** Over time, receipts build a history of care for the home. Customers can look back at months of receipts and see consistent, documented service -- reinforcing the value of their subscription.
- **Emotional delight:** The "Your Home is Handled" moment should feel like opening a beautifully wrapped package. It is the payoff for trusting a service with access to their home.

## User Flow

1. Provider completes a visit and submits their job report (photos, checklist, summary note).
2. Customer receives a push notification: "Your home is handled. Tap to see your receipt."
3. Customer taps the notification and lands on the Handled Receipt page.
4. **Receipt header:** A branded banner at the top displays "Your Home is Handled" with a subtle checkmark seal, the visit date, and the provider's first name or team name.
5. **Photo hero section:** The best after photo (or a before/after slider if both exist) is displayed prominently as the first visual element -- large, edge-to-edge, making an immediate impact.
6. **Visit timeline:** A compact vertical timeline shows key moments: arrived at [time], service performed, departed at [time], total time on site [X minutes]. This gives the customer a sense of the visit as a real event, not just abstract data.
7. **Services performed:** Each service in the job is listed with its checklist expanded. Completed items show green checkmarks. Items not completed show the reason. Each service section can optionally show its associated photos grouped together.
8. **Provider note:** If the provider left a summary note, it appears in a distinct card with a slightly different background, styled like a personal message from the provider.
9. **How was this visit?** The quick feedback prompt (thumbs up/down) appears as a natural next step in the receipt flow.
10. **Share and save:** At the bottom, two actions: "Share This Receipt" (generates a beautiful summary card image or shareable link) and "Save as PDF" (for personal records).
11. **Growth surface:** Below the receipt proper, the receipt suggestions component shows relevant add-on services, positioned as "While we're caring for your home, you might also love..."

## UI/UX Design Recommendations

- **Receipt visual language:** Draw inspiration from premium brand receipts and hotel checkout summaries. Use generous whitespace, a clear visual hierarchy, and subtle brand elements (the Handled logo watermark, brand colors as accents, not backgrounds). The receipt should feel like a document, not a web page.
- **Completion seal:** A circular stamp/seal element in the header (like a notary seal or a wax seal) that says "Handled" with a checkmark. This is the signature visual element that distinguishes a receipt from a regular page. It should be elegant and understated, not clip-art.
- **Photo-first layout:** The hero photo should span the full width of the content area with rounded corners and a subtle shadow. If before/after exists, use the existing BeforeAfterSlider but at a larger size. The photo is the emotional centerpiece of the receipt.
- **Timeline component:** A vertical line with small dots at each event (arrival, completion, departure), with times displayed to the right. Keep it compact -- 3-4 lines total. Use the brand accent color for the timeline dots and line.
- **Checklist with completion percentage:** For each service, show a small circular progress indicator (e.g., "5/6 items completed") alongside the expanded checklist. This gives an at-a-glance completion picture before the customer reads individual items.
- **Provider note styling:** Display the provider's summary in a card with a slightly warm background tint and a subtle quotation mark icon, giving it a personal-letter feel. Include the provider's first name and a generic avatar or team icon.
- **Share card design:** When the customer taps "Share This Receipt," generate a designed summary card (image format) that includes: the Handled branding, the date, one key before/after photo pair, the services performed, and a referral message ("My home is handled -- yours can be too"). This card should look good in a text message, Instagram story, or email.
- **Smooth scroll experience:** The receipt should be a single scrollable page with no tabs or collapsed sections (except possibly individual checklists for jobs with many services). The goal is a satisfying scroll from top to bottom that tells the complete story.
- **Print optimization:** Include a print-friendly stylesheet that removes navigation, adjusts photo sizes, and formats the receipt cleanly for letter-size paper. The PDF save option should use this same layout.
- **Empty and loading states:** The loading state should show a skeleton that hints at the receipt structure (header block, photo placeholder, timeline lines). If photos are still processing, show "Finalizing your receipt..." with an estimated time rather than empty spaces.

## Acceptance Criteria

- The Handled Receipt page has a distinct branded header with the "Your Home is Handled" message, visit date, and a visual completion seal
- The receipt displays the best available after photo (or before/after comparison) prominently as the first visual element below the header
- A visit timeline shows arrival time, departure time, and total time on site in a compact vertical format
- Every checklist item for the job is displayed (not just highlights), organized by service, with clear completion status indicators
- The provider's summary note is displayed in a visually distinct card styled as a personal message
- The quick feedback prompt is integrated into the receipt flow rather than appearing as a disconnected card
- A "Share This Receipt" action generates a branded summary card suitable for sharing via messaging apps and social media
- A "Save as PDF" or print option produces a clean, formatted document
- The receipt page works as a shareable link that recipients can view (with appropriate access controls)
- The existing VisitDetail functionality (courtesy upgrades, provider recommendations, issue reporting, private reviews, receipt suggestions) is preserved and integrated into the receipt layout
- The receipt loads with a branded skeleton state that maintains the receipt's visual structure during data fetching
- Photos that are still processing show a "Finalizing..." placeholder rather than empty space
- The receipt is fully responsive and provides an excellent experience on mobile devices (the primary viewing context)
- Navigation from the RecentReceipt dashboard card and push notifications correctly routes to the Handled Receipt page
