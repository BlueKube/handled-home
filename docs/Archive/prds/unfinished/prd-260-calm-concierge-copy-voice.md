# PRD 260: Premium "Calm Concierge" Copy Voice

> **Status:** PLACEHOLDER
> **Priority:** P2 Medium
> **Effort:** Medium (3-5 days)

## What Exists Today

The brand promise is clearly defined -- "Your home is handled" -- and the design guidelines explicitly call for a "Calm concierge -- confident, kind, predictable" voice. The visual design delivers on this promise with glassmorphism cards, teal accents, an 8pt spacing grid, and smooth micro-animations. However, the words throughout the app do not match the visual premium:

- **Toast messages are functional but generic:** Titles like "Error," "Success," "Saved," and "Photo uploaded" are developer-facing labels, not concierge-quality communication. Error descriptions are technical: "Invalid email or password," "Failed to update profile," "Password must be at least 8 characters."
- **Button labels are standard:** "Submit," "Save," "Cancel," "Delete" -- the vocabulary of every app, not a premium home services brand.
- **Notification templates have some concierge tone:** The 19 seeded notification templates represent the best existing copy in the codebase, with structured messages that feel more intentional. But the in-app UI text around them is generic.
- **Empty states and placeholders are perfunctory:** Pages with no data show functional messages ("No items found," "No results") without warmth, encouragement, or guidance.
- **Onboarding text is instructional but flat:** The onboarding wizard guides users through property setup, but the copy reads like a form rather than a welcome experience.
- **Error handling is blame-adjacent:** Messages like "Failed to update profile" subtly imply the user did something wrong. A concierge never blames the guest.
- **Confirmation dialogs are transactional:** "Are you sure you want to cancel?" is a standard dialog pattern, not a concierge conversation.
- **The design guidelines themselves say:** "Calm, competent, kind. Never blame users. Reinforce: Your home is handled." This voice guide exists but has not been applied to the actual interface copy.

## What's Missing

1. **A comprehensive copy audit and rewrite of all user-facing text** across the customer, provider, and admin experiences. This includes button labels, form labels, placeholder text, empty states, error messages, success confirmations, dialog titles and descriptions, onboarding copy, loading messages, and tooltip text.
2. **A copy style guide with concrete examples** that defines the calm concierge voice with enough specificity that any designer or developer can write on-brand copy without guessing. This should include word lists (preferred terms and terms to avoid), tone principles for different emotional contexts (success, error, waiting, empty, destructive action), and before/after examples for every common UI pattern.
3. **Contextually warm empty states** that transform "nothing here yet" moments from dead ends into reassuring invitations. Each empty state should acknowledge the user's context, provide gentle guidance, and reinforce the brand promise.
4. **Reassuring error messages** that take responsibility instead of assigning blame, explain what happened in plain language, and suggest a next step. The tone should be "we hit a snag" rather than "you made an error."
5. **Delightful success states** that celebrate the user's progress and reinforce the value of the service, rather than perfunctory "Done" confirmations.
6. **Premium onboarding copy** that makes the first experience feel like checking into a luxury hotel rather than filling out a government form.
7. **Calm confirmation dialogs** for destructive or irreversible actions that feel like a concierge double-checking rather than a system warning.

## Why This Matters

### For the Business

Copy voice is half of brand personality. The visual design and the verbal design must match -- a premium look with generic language creates the same dissonance as a five-star hotel lobby with fluorescent lighting and plastic chairs in the rooms. This dissonance undermines perceived value at the exact moments that matter most: when something goes wrong (error messages), when the user is deciding whether to continue (onboarding), and when the user is evaluating whether the service was worth it (success/completion states).

Subscription businesses with a strong, consistent brand voice see 15-20% lower churn because users form an emotional relationship with the brand, not just a transactional one. When every interaction -- even an error -- feels handled with care, users trust the brand more and tolerate friction better. A user who reads "We hit a small snag saving your changes -- let's try that again" feels fundamentally different about the app than a user who reads "Failed to update profile."

Additionally, concierge copy reduces support volume. Clear, warm copy answers the user's implicit question ("Is everything okay?") before they open a support ticket. Every reassuring message is a support ticket not filed.

### For the User

Homeowners who pay a premium subscription for home management expect premium treatment at every touchpoint. The copy is the app's speaking voice -- it is how the brand sounds inside the user's head. Generic copy sounds like a machine. Concierge copy sounds like a trusted advisor who knows them and cares about their home.

For new users, warm onboarding copy reduces the anxiety of committing to a new service. For active users, clear and kind error handling builds trust during the most vulnerable moments (when something breaks). For long-term subscribers, delightful success states provide ongoing emotional reinforcement that the subscription is worth it. For providers, professional and encouraging copy helps them feel like valued partners rather than gig workers being monitored by a system.

## User Flow

1. **New customer signs up and sees the welcome screen:** Instead of "Create your account," the heading reads "Welcome home." Instead of "Password must be at least 8 characters," the hint reads "At least 8 characters to keep your account secure." After account creation, instead of "Account created! Redirecting..." the message reads "You're all set. Let's get your home handled."

2. **Customer adds their property:** Instead of placeholder text like "Enter your address," the input hint reads "Where's home?" The ZIP code coverage check, instead of showing a generic badge, says "Great news -- we're in your neighborhood" or "We're not in your area yet, but we'll let you know when we arrive." The form completion button says "Save my home" instead of "Submit."

3. **Customer browses services with no subscriptions yet:** Instead of an empty list, the screen shows a warm illustration with the message: "Your home is waiting. Explore services that keep everything running smoothly -- so you don't have to think about it."

4. **Customer encounters an error saving preferences:** Instead of "Failed to update profile" appearing as a destructive toast, the message reads: "We couldn't save that just now. Your previous settings are still safe -- try again in a moment." The tone takes responsibility ("we couldn't") rather than assigning blame ("failed to").

5. **Customer successfully schedules a service:** Instead of a brief "Saved" toast, the confirmation reads: "All set. Your [service name] is on the calendar. We'll handle the rest." The word "handled" directly echoes the brand promise.

6. **Provider completes a job and uploads photos:** Instead of "Photo uploaded," the confirmation reads: "Photo saved. Nice work." Instead of "Upload failed," the error reads: "That photo didn't come through -- tap to try again." The button says "Finish this job" instead of "Submit."

7. **Provider sees an empty jobs list:** Instead of "No jobs found," the screen reads: "No jobs on your plate right now. We'll notify you as soon as something comes in." This reassures the provider that the system is working and they haven't been forgotten.

8. **Customer opens a support ticket:** Instead of "Submit a support request," the heading reads: "Let us know what's going on." Instead of "Submit," the button reads: "Send to our team." After submission, instead of "Ticket created," the confirmation reads: "We've got it. Someone from our team will follow up shortly."

9. **User encounters a destructive confirmation dialog (e.g., canceling a service):** Instead of "Are you sure you want to cancel?" the dialog reads: "Just checking -- if you cancel [service name], your next visit won't be scheduled. You can always re-add it later." The confirm button says "Go ahead and cancel" instead of "Delete" or "Confirm." The dismiss button says "Keep it" instead of "Cancel" (avoiding the confusing "Cancel to cancel" pattern).

10. **Loading states throughout the app:** Instead of a bare spinner or skeleton, brief loading moments can show rotating calm phrases: "Getting things ready..." or "Pulling up your details..." These micro-copy moments reinforce that someone (the concierge) is actively working on the user's behalf.

## UI/UX Design Recommendations

- **Create a copy tone spectrum for different emotional contexts.** Not every message should sound the same. Define the concierge voice across five emotional registers: (a) Welcoming -- warm, open, inviting (onboarding, empty states); (b) Reassuring -- steady, calm, confident (errors, loading, waiting); (c) Celebratory -- proud, appreciative, affirming (success states, milestones); (d) Clarifying -- clear, direct, gentle (confirmations, warnings, destructive actions); (e) Professional -- competent, respectful, efficient (provider-facing operational copy).
- **Replace generic button labels with action-specific copy.** "Submit" becomes "Send to our team," "Save my home," "Finish this job," or "All set" depending on context. "Cancel" (the dismiss action) becomes "Never mind," "Go back," or "Not right now." "Delete" becomes "Remove" with a descriptor ("Remove this service"). Every button should answer the question: "What happens when I tap this?"
- **Rewrite every error toast to follow a three-part pattern:** (1) What happened, using "we" language ("We couldn't save that"); (2) What's safe ("Your previous settings are still in place"); (3) What to do next ("Try again in a moment"). Never use the word "failed" or "error" in user-facing copy. Never use exclamation marks in error messages.
- **Design empty states as invitations, not dead ends.** Each empty state should have: a warm illustration or icon, a one-line message that acknowledges the context ("No visits scheduled yet"), and a subtle call-to-action or reassurance ("Explore services to get started" or "We'll show your upcoming visits here once you're set up"). Empty states are prime real estate for brand voice.
- **Use the word "handled" strategically.** It is the brand's signature word. Use it at high-value moments -- after booking confirmation ("Your lawn is handled"), after completing onboarding ("Your home is handled"), in the dashboard greeting ("Everything's handled this week"). Do not overuse it in mundane contexts; reserve it for moments of completion and reassurance.
- **Write provider-facing copy with professional respect.** Providers are partners, not subordinates. Copy should be encouraging and efficient: "Nice work" after a job, "Your payout is on its way" instead of "Payout processed," "Ready for your next job" instead of "Job assigned." Coaching language should use "try" and "consider" rather than "you must" or "required."
- **Avoid jargon, technical terms, and system language in all user-facing copy.** "RPC," "mutation," "query," "record," "entity," "instance," and "configuration" should never appear in the UI. "Ticket" becomes "request" or "message." "Record" becomes "entry" or is removed. "Configuration" becomes "settings" or "preferences."
- **Add personality to loading and transition states.** These micro-moments are opportunities to reinforce the brand. Rotating loading messages ("Getting things ready...", "Almost there...", "Pulling up your home...") feel more human than a bare spinner. Keep them short, calm, and varied.
- **Punctuation and formatting guidelines:** Use sentence case for all UI text (not title case). End full sentences with periods. Do not end button labels, headings, or labels with periods. Avoid exclamation marks except in celebratory success states (use sparingly -- one per flow at most). Use an em dash rather than a colon for appositives. Use the Oxford comma.

## Acceptance Criteria

- Every user-facing text string in the app has been reviewed and rewritten to match the calm concierge voice as defined in the design guidelines: "Calm, competent, kind. Never blame users."
- No button in the app uses the generic labels "Submit," "Cancel" (as a destructive action), or "Delete" without a contextual descriptor. Every button label describes the specific action it performs.
- All error messages follow the three-part pattern (what happened, what's safe, what to do next) and use "we" language instead of blaming the user. The words "failed," "error," and "invalid" do not appear in any user-facing error message.
- All empty states include a warm message and either a call-to-action or reassurance, not just "No items found" or a blank screen.
- All success/confirmation messages celebrate the user's action and reinforce the value of the service, rather than just confirming the technical operation ("Saved" becomes "All set. Your home is handled.").
- Onboarding copy reads as welcoming and conversational, not as a form to be filled out.
- Destructive confirmation dialogs explain the consequence in plain language and use descriptive button labels (not "Confirm" / "Cancel").
- The word "handled" appears at key brand-reinforcement moments (post-booking, post-onboarding, dashboard greeting) without being overused.
- Provider-facing copy is professional, encouraging, and treats providers as partners, not gig workers.
- No technical jargon, system terminology, or developer-facing language appears anywhere in the user-facing interface.
- A copy style guide document exists with tone principles, word lists (preferred and avoided terms), and before/after examples for each UI pattern (buttons, errors, empty states, confirmations, onboarding, loading states).
- All copy uses sentence case, proper punctuation (periods on full sentences, no periods on labels/buttons), and avoids excessive exclamation marks.
