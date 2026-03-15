# Handled Home — AI Design Specs: Screen Flows

> **Purpose**: Feed this document into Google Stitch or Figma Make to generate production-quality mobile screen designs. Every screen is described with layout, copy, components, states, and design system tokens.
>
> **Business context**: Plan pricing, tier structure, bundle design, provider payouts, and margin mechanics are defined in `docs/operating-model.md`. Reference that document for any copy decisions involving pricing, plan framing, or provider economics.

---

## Design System Reference

| Token | Value |
|-------|-------|
| **Viewport** | 390 × 844 (iPhone 15), mobile-only |
| **Font** | Inter (weights: 300–700) |
| **Primary** | Navy `hsl(214, 65%, 14%)` |
| **Accent** | Cyan `hsl(200, 80%, 50%)` |
| **Background** | Light gray `hsl(220, 20%, 97%)` |
| **Card** | White `hsl(0, 0%, 100%)` |
| **Success** | Green `hsl(142, 72%, 37%)` |
| **Warning** | Amber `hsl(38, 92%, 50%)` |
| **Destructive** | Red `hsl(0, 72%, 51%)` |
| **Muted text** | `hsl(215, 16%, 47%)` |
| **Border** | `hsl(225, 14%, 91%)` |
| **H1** | 32px bold |
| **H2** | 24px bold |
| **H3** | 18px semibold |
| **Body** | 16px regular |
| **Caption** | 13px regular, muted color |
| **Card** | white bg, rounded-2xl (16px), shadow `0 1px 3px rgba(0,0,0,0.06)` |
| **Button (default)** | 44px height, rounded-xl (12px) |
| **Button (large)** | 48px height, rounded-xl |
| **Button (xl)** | 52px height, rounded-xl |
| **Input** | 48px height, rounded-xl, border gray |
| **Bottom Tab Bar** | Fixed bottom, 56px height, glass blur `bg-card/90`, 5 tabs, active = accent color |
| **Touch target** | Minimum 44 × 44px |
| **Icons** | Lucide React icon set |
| **Safe areas** | iOS notch top + home indicator bottom padding |
| **Animation** | `animate-fade-in` on page mount |

### Button Variants
- **default**: Navy bg, white text
- **accent**: Cyan bg, white text (primary CTA)
- **outline**: White bg, gray border, dark text
- **ghost**: Transparent bg, dark text
- **destructive**: Red bg, white text
- **secondary**: Light gray bg, dark text

### Component Library
Built on shadcn/ui: Card, Button, Input, Textarea, Label, Badge, Tabs, Dialog, Sheet, Alert, Skeleton, Progress, Avatar, Collapsible, Tooltip, Switch.

---

## Brand Voice

- **Calm, competent, kind.** Never blaming, never condescending.
- **Tagline**: "Your home, handled."
- Screens explain what happens next. No ambiguity at decision points.
- Errors tell what went wrong AND what to do.
- Plan/routine changes say "effective next cycle."

---

# FLOW 1: Authentication

**Route**: `/auth`
**Who**: Any unauthenticated user
**Purpose**: Sign in or create an account

### Screen 1.1: Auth Page

**Layout**:
- Full-screen, no tab bar, no header
- Background: `background` color
- Content centered, max-width 390px, px-6

**Sections (top to bottom)**:

1. **Brand Header** (pt-16, pb-10, centered)
   - Large tagline: "Your home, " (navy) + "handled." (accent cyan)
   - Font: Plus Jakarta Sans, 48px extrabold

2. **Tab Switcher** (centered, max-w-xs)
   - Pill-shaped tabs: "Log In" | "Sign Up"
   - Rounded-full, full-width
   - If arriving with `?ref=` param, default to Sign Up tab

3. **Login Form** (when Log In tab active)
   - Label: "Email" → Input (email, placeholder "Email address")
   - Label: "Password" → Input (password, placeholder "Password")
   - Button (accent, xl, full-width): "Sign In"
   - Text link below: "Forgot password?" (underlined, muted)

4. **Signup Form** (when Sign Up tab active)
   - **Role Selector**: Label "I am a..." with 2-column grid:
     - Card button: Home icon + "Homeowner" (selected = navy border + bg)
     - Card button: Wrench icon + "Service Provider"
   - Label: "Full Name" → Input (placeholder "Full name")
   - Label: "Email" → Input (email)
   - Label: "Password" → Input (password, placeholder "Min. 8 characters")
   - Label: "Confirm Password" → Input (password)
   - Button (accent, xl, full-width): "Create Account"

**States**:
- **Loading**: Button shows spinner + disabled inputs
- **Error (login)**: Toast: "Invalid email or password."
- **Error (signup, existing)**: Toast: "An account with this email already exists. Try logging in."
- **Error (signup, password mismatch)**: Toast: "Passwords do not match."
- **Success (signup)**: Toast: "Account created! Redirecting..."

---

# FLOW 2: BYOC Activation (Bring Your Own Customer)

**Route**: `/byoc/activate/:token`
**Who**: Unauthenticated person who received a provider's invite link
**Purpose**: See provider info and sign up to activate service

### Screen 2.1: BYOC Invite Landing (Unauthenticated)

**Layout**:
- Full-screen, no tab bar
- Background: `background`, px-5, py-10
- Content centered, max-w-md

**Sections (top to bottom)**:

1. **Logo** (centered)
   - Handled Home logo image, h-10

2. **Header** (centered)
   - H2: "Your Provider invited you"
   - Caption: "Continue your service through Handled Home — same great provider, better experience."

3. **Provider Card** (Card component)
   - Row: Avatar (12×12 circle with provider initial or logo) + provider name + MapPin icon + zone name
   - If no logo: circle with initial, bg-primary/10

4. **Service Details Card** (Card)
   - H3: "Service Details"
   - Row: "Category" → Badge (outline, category label)
   - Row: "Service" → text (service name)
   - Row: "Estimated Duration" → Clock icon + "XX min" (if available)

5. **Frequency Card** (Card)
   - H3: "How Often"
   - 2×2 grid of pill buttons: Weekly | Bi-weekly | Monthly | One-time
   - Default cadence is highlighted (primary bg, white text)
   - Other pills: gray bg, muted text (display only, not interactive)

6. **Benefits Card** (Card)
   - 3 icon-text rows:
     - Shield icon: "Handled Home manages scheduling, billing, and quality"
     - Camera icon: "Proof photos after every visit"
     - Sparkles icon: "Issue resolution and service guarantee"

7. **Primary CTA**
   - Button (large, full-width, h-14, rounded-xl): ArrowRight icon + "Sign Up to Activate"

8. **Footer Card** (Card, subtle)
   - Caption: "You'll create a free Handled Home account first, then your service will be activated automatically."

9. **Fine Print**
   - Caption (centered): "Free to join. Pricing set by Handled Home. Cancel anytime."

**States**:
- **Loading**: Full-screen centered spinner
- **Invalid/Expired Invite**: Logo + H2 "This invitation is no longer active" + Caption "The invite link may have expired or been deactivated." + Button "Back to Home"
- **Authenticated**: Renders BYOC Onboarding Wizard inline (see Flow 6)

---

# FLOW 3: Referral Invite Landing

**Route**: `/invite/:code`
**Who**: Person who received a customer referral link
**Purpose**: Marketing page → Sign up

### Screen 3.1: Invite Landing

**Layout**:
- Full-screen, centered, no tab bar
- Background: `background`, px-6, py-12

**Sections (top to bottom)**:

1. **Logo** (centered, h-12)

2. **Headline** (centered)
   - H2: "Your pro is moving updates to Handled Home"

3. **Feature Cards** (3 cards, stacked)
   - Card 1: Shield icon (primary) + "Track and manage every service visit"
   - Card 2: Camera icon (primary) + "Proof photos after each visit"
   - Card 3: CheckCircle icon (primary) + "Manage your home services in one place"

4. **Primary CTA**
   - Button (large, full-width): "Get Started"
   - Navigates to `/auth?ref={code}`

5. **Fine Print**
   - Caption: "Free to join. No commitments."

---

# FLOW 4: Share Landing (Receipt Proof)

**Route**: `/share/:shareCode`
**Who**: Anyone who received a shared visit receipt link
**Purpose**: See proof of completed service → Sign up

### Screen 4.1: Share Receipt Landing

**Layout**:
- Full-screen, no tab bar
- Background: `background`

**Sections (top to bottom)**:

1. **Hero Photo Area**
   - 4:3 aspect ratio container, bg-muted
   - Photo or gradient placeholder with ImageIcon
   - Bottom-right: brand stamp pill "Handled." (primary bg, white text, rounded-full)

2. **Content Section** (px-6, py-6)
   - Badge (outline, capitalize): category label (e.g., "Lawn Care")
   - Date: caption text
   - Name: "{firstName}'s home" (if available)
   - Neighborhood: caption (if available)

3. **Checklist Items**
   - Each item: CheckCircle2 icon (accent) + text

4. **CTAs** (stacked, pt-2)
   - Button (large, full-width): "Get Handled Home" + ArrowRight icon
   - Button (outline, large, full-width): "I'm a provider"

5. **Footer Logo** (centered, h-6, opacity-60)

**States**:
- **Loading**: Full-screen centered spinner
- **Expired**: Logo + H2 "This share has expired" + Caption "The link is no longer active." + Button "Get Handled Home"

---

# FLOW 5: Customer Onboarding Wizard

**Route**: `/customer/onboarding`
**Who**: New customer after signup
**Purpose**: 8-step guided setup from property → plan → subscription → routine

### Screen 5.1: Progress Bar (persistent across all steps)

**Layout** (top of every step):
- Back button: ArrowLeft + "Back" (muted text, visible from step 2+)
- Step counter: "Step X of 8" (caption, right-aligned)
- Progress bar: 1.5px height, accent color fill
- Step labels row: "Your Home · Coverage · Home Setup · Pick Plan · Subscribe · Service Day · Routine · All Set"
  - Current and prior steps: accent + medium weight
  - Future steps: muted

### Screen 5.2: Step 1 — Your Home (Property)

**Layout**:
- max-w-lg, centered

**Sections**:

1. **Header** (centered)
   - Home icon (accent, 40×40)
   - H2: "Tell us about your home"
   - Caption: "We need a few details to match you with the right service team."

2. **Address Form**
   - Label: "Street Address *" → Input (placeholder "123 Main St")
   - 2-column row:
     - Label: "City *" → Input (placeholder "Los Angeles")
     - Label: "State *" → Input (placeholder "TX", uppercase, max 2 chars)
   - Label: "Zip Code *" → Input (numeric, placeholder "90210", max 5 chars)

3. **Optional Details** (collapsible `<details>`)
   - Summary: "+ Access details, pets, notes (optional)"
   - Gate Code → Input
   - Access Instructions → Textarea (2 rows)
   - Parking Notes → Textarea (2 rows)
   - Pets → Input (placeholder "dog, cat")
   - Anything Else → Textarea (2 rows)

4. **CTA**
   - Button (full-width, h-12, rounded-xl): "Continue" + ArrowRight icon

**Validation Errors**: Red caption below each field ("Street address is required", "Must be 5 digits")

### Screen 5.3: Step 2 — Zone Check

**Layout**: max-w-lg, centered, text-center

**Sections**:

1. **Header**
   - MapPin icon (accent, 40×40)
   - H2: "Checking your area"
   - Caption: "Zip code: **90210**" (mono font)

2. **Loading State**
   - Spinner + "Looking up coverage…"

3. **Covered State** (Card with accent border + accent bg tint)
   - CheckCircle icon (accent, 40×40)
   - "You're covered!"
   - "Zone: {zoneName}"
   - Animated "Continuing…" (auto-advances after 1.5s)

4. **Not Covered State** (Card with warning border + warning bg tint)
   - AlertTriangle icon (warning, 40×40)
   - "We're not in your area yet"
   - "Handled Home is expanding quickly. Join the waitlist and we'll let you know the moment we launch near you."
   - Button (full-width): Bell icon + "Join Waitlist"
   - Button (ghost, full-width): "Continue exploring"

### Screen 5.4: Step 3 — Home Setup (Coverage Phase)

**Layout**: max-w-lg, centered

**Sections**:

1. **Header** (centered)
   - Sparkles icon (accent, 40×40)
   - H2: "Make recommendations smarter"
   - Caption: "What's already handled at your home? This takes about 30 seconds."

2. **Coverage Categories** (list of rows)
   - Each row: icon (8×8 rounded-lg, accent bg tint) + category label + 4 pill buttons
   - Pill options: "Myself" | "Have one" | "None" | "N/A"
   - Selected pill: primary bg, white text. Others: gray bg.
   - Categories: Lawn, Pool, Pest, Trash, Pet Waste, Windows, Cleaning, Irrigation, Handyman

3. **CTA**
   - Button (full-width, h-12, rounded-xl): "Next: Home Size" + ArrowRight
   - Button (ghost): "Skip for now"

### Screen 5.5: Step 3b — Home Setup (Sizing Phase)

**Sections**:

1. **Header** (centered)
   - Home icon (accent, 40×40)
   - H2: "Home size (quick estimate)"
   - Caption: "Helps us pick the right service level. All fields optional."

2. **Sizing Groups** (4 groups, each with icon + label + pill row)
   - **Home Size**: icon + pills: "< 1,500 sqft" | "1,500–2,500" | "2,500–4,000" | "4,000+"
   - **Yard**: "Small" | "Medium" | "Large" | "XL"
   - **Windows**: "< 10" | "10–20" | "20–30" | "30+"
   - **Stories**: "1" | "2" | "3+"
   - Selected pill: primary bg, white text, shadow

3. **Progress**: Caption "X/4 fields set"

4. **CTA**
   - Button (full-width, h-12, rounded-xl): "Continue" + ArrowRight
   - Button (ghost): "Skip for now"

### Screen 5.6: Step 4 — Pick Your Plan

**Sections**:

1. **Header** (centered)
   - Shield icon (accent, 40×40)
   - H2: "Pick your membership"
   - Caption: "One simple plan — we handle the rest."

2. **Handles Explainer** (inline education component)

3. **Plan Cards** (stacked, space-y-4)
   - Each PlanCard:
     - Plan name (H3) — tier names: Essential, Plus, Premium
     - Tier positioning tagline (caption):
       - Essential: "The basics, handled."
       - Plus: "More covered, less to think about."
       - Premium: "Your home, fully handled."
     - Price text (large bold)
     - Handles per cycle badge
     - Tier highlights list (checkmark bullets) — frame as outcomes, not line items
     - "Recommended" badge (if applicable, accent border)
     - "Not available in your zone" overlay (if zone-disabled)
     - CTA: "Build Routine" button
   - See `operating-model.md` → Plan Tier Structure for positioning guidance

4. **Loading**: 3 skeleton cards (h-56 each)

### Screen 5.7: Step 5 — Subscribe (Checkout)

**Sections**:

1. **Header** (centered)
   - Sparkles icon (accent, 40×40)
   - H2: "Confirm your membership"

2. **Plan Summary Card**
   - CardTitle: Plan name
   - Tagline text
   - Price: large bold (e.g., "$49/cycle")
   - Caption: "Billed every 4 weeks. Cancel anytime."

3. **CTA**
   - Button (full-width, h-12, rounded-xl): "Subscribe Now"
   - Loading state: spinner + "Processing…"

**Post-Checkout State**: Spinner + H2 "Verifying your subscription…" + Caption "This usually takes just a few seconds."

### Screen 5.8: Step 6 — Service Day

**Sections**:

1. **Header** (centered)
   - CalendarCheck icon (accent, 40×40)
   - H2: "Your Service Day"
   - Caption: "We match you to the most efficient route day — so your provider arrives on time, every time."

2. **Recommended Day Card** (Card)
   - Badge row: Zap icon + "SYSTEM RECOMMENDED" (accent, uppercase)
   - Large centered day name (3xl bold accent, e.g., "Tuesday")
   - Capacity note: "Stable day — plenty of availability" or "Popular day in your area"
   - Caption: "This day has the best route density in your neighborhood, which means reliable, on-time service."

3. **Scheduling Preferences**
   - H3: "Scheduling preferences"
   - Toggle switches: "Align all services to same day", "I must be home during service"

4. **CTAs**
   - Button (full-width, h-12): "Accept & Continue"
   - Button (ghost): "Skip for now — I'll set this up later"

**Loading State**: Spinner + "Finding the best route day for your area…"

### Screen 5.9: Step 7 — Routine

**Sections**:

1. **Header** (centered)
   - Sparkles icon (accent, 40×40)
   - H2: "Build your routine"
   - Caption: "Choose which services you'd like on your regular visits. You can always swap, add, or remove services later from your dashboard."

2. **CTAs**
   - Button (full-width): "Continue to Complete Setup"
   - Button (ghost): "Skip for now"

### Screen 5.10: Step 8 — Complete

**Layout**: centered, max-w-lg

**Sections**:

1. **Success Icon**: CheckCircle (accent, 64×64)
2. **H2**: "You're all set!"
3. **Body**: "Welcome to Handled Home. Your first service day is coming up — we'll send you a reminder."
4. **CTAs** (pt-4, stacked):
   - Button (full-width): "Go to Dashboard"
   - Button (outline, full-width): "Review My Routine"

---

# FLOW 6: BYOC Customer Onboarding

**Route**: `/customer/onboarding/byoc/:token` (or inline at `/byoc/activate/:token` when authenticated)
**Who**: Customer who signed up via provider's BYOC invite link
**Purpose**: Streamlined onboarding variant — property details are pre-contextualized with the provider's service

> Similar to Flow 5 but with provider context baked in. The service category, provider, and cadence are pre-filled from the invite. Steps may be reduced.

---

# FLOW 7: Customer Dashboard

**Route**: `/customer`
**Who**: Authenticated customer with property set up
**Purpose**: Central hub — see next visit, routine status, suggestions, and quick actions

### Screen 7.1: Customer Dashboard (Simplified)

**Layout**:
- Bottom tab bar visible (Home tab active)
- p-6, pb-24 (account for tab bar)
- Content scrollable
- **Design goal**: Calm status board. Answers "Is everything OK with my home right now?" at a glance. Urgent when action needed, serene when all clear.

**Sections (top to bottom)**:

1. **Greeting**
   - H2: "Your home is handled."
   - Caption: "Welcome back, {firstName}."

2. **Smart App Banner** (conditional, dismissible)

3. **Notification Banners** (stacked alerts for payment failures, SLA issues, etc.)

4. **Home Team Card** (Card)
   - Shows assigned providers for this property

5. **Home Setup Card** (Card, conditional)
   - Prompts to complete property setup if incomplete

6. **Service Day Banner** (conditional states):
   - **No assignment**: Card with spinner + "We're assigning your Service Day…"
   - **Offered**: Card with CalendarDays icon + "Confirm your Service Day to activate your plan." + "View →" button
   - **Routine not effective yet**: Card with Settings icon + "Your routine updates take effect next cycle."
   - **Draft routine nudge**: Card with Sparkles icon + "Finish your routine" + "You have X services ready to confirm." + "Continue →" + dismiss X
   - **No routine**: Card with Plus icon + "Start your routine" + "Choose services to keep your home maintained automatically."

7. **Next Up Section** (prominent — the hero card)
   - Label: "NEXT UP" (uppercase caption) + "View schedule →" link (navigates to `/customer/schedule`)
   - NextVisitCard component (shows date, services, provider, ETA)

8. **Handle Balance Bar** (conditional, only if subscription with handles)
   - Progress bar: handles used / handles per cycle
   - If rollover handles exist: "+X rolled over" badge (accent, small) to the right of the bar
   - Rollover cap: 1.5× monthly allowance — show rollover as a positive signal, not a limit
   - See `operating-model.md` → Rollover language

9. **Property Health Widget**
    - Health score visualization

10. **Suggested Services Section** (single top suggestion)
    - One AI-suggested service card with "Add to routine" CTA
    - "See more →" link to full routine catalog

11. **Seasonal Plan Card** (conditional)

12. **First Service Celebration** (conditional, one-time overlay)

13. **Floating Add Button** (fixed, bottom-right above tab bar)
    - Circle button with Plus icon
    - Opens AddServiceDrawer sheet

**Removed from Dashboard** (moved to dedicated tabs):
- ~~This Cycle Summary~~ → Moved to Schedule tab
- ~~Recent Receipt~~ → Moved to Activity tab
- ~~Home Timeline link~~ → Activity is now a primary tab

**Sheets/Modals**:
- **AddServiceDrawer**: Bottom sheet with service search + add capability

---

# FLOW 8: Plans & Subscription

### Screen 8.1: Browse Plans

**Route**: `/customer/plans`
**Entry**: Tab bar "Plans" tab, or redirect from gated features

**Sections**:

1. **Header**
   - H2: "Pick your membership"
   - Body: "One simple plan — we handle the rest."

2. **Gated Alert** (conditional, if `?gated=1`)
   - Alert with Info icon: "You need an active membership to access that feature. Pick a plan to get started."

3. **Handles Explainer** (education component)

4. **Plan Cards** (stacked)
   - Each card: tier name (Essential / Plus / Premium), tier tagline, price, handles, outcome-based highlights, recommended badge, zone availability
   - Tier taglines: Essential → "The basics, handled." | Plus → "More covered, less to think about." | Premium → "Your home, fully handled."
   - Highlights should frame outcomes ("Recurring lawn + pest care") not line items ("2 anchor services")
   - CTA per card: "Preview" and "Build Routine" buttons

5. **Footer**
   - Caption: "All plans bill every 4 weeks. Change or cancel anytime — changes take effect next cycle."

**Loading**: 3 skeleton cards
**Empty**: "No plans available at the moment."

### Screen 8.2: Plan Detail

**Route**: `/customer/plans/:planId`
**Entry**: "Preview" button from plan card

**Sections**:
1. Back button
2. Plan hero (name, price, tagline)
3. Handles callout card
4. Included services card
5. Available as extras card
6. Not available card
7. Change policy info card
8. CTAs: "Build Routine" + "Subscribe"

### Screen 8.3: Subscription Management

**Route**: `/customer/subscription`

**Sections**:

1. **Header**: H2 "Subscription"

2. **No Subscription State**: "No Active Subscription" + "You don't have a subscription yet." + Button "Browse Plans"

3. **Active State**:
   - Fix Payment Panel (if past_due): destructive card with CTA
   - Subscription Status Panel: plan name, status, billing cycle, next renewal
   - Pause Panel: pause/resume controls
   - Plan Change Panel: change plan CTA (hidden if paused/canceling)
   - Cancellation Flow: cancel subscription (hidden if paused)

---

# FLOW 9: Routine Management

### Screen 9.1: Routine Builder

**Route**: `/customer/routine`
**Entry**: Tab bar "Routine" tab

**Gate**: Requires confirmed service day (shows gate screen if not confirmed)

**Sections**:

1. **Truth Banner** (sticky top info bar)
   - Shows: plan name, service weeks per cycle, service day, billing model, included credits

2. **Header**
   - H2: "Build Your Routine"
   - Caption: "Choose services and how often they happen."

3. **Entitlement Guardrails** (conditional)
   - Budget usage bar: credits used vs included vs max
   - "Auto-fit" button if over limit

4. **Service Items** (list of RoutineItemCards)
   - Each card: service name, level selector, cadence selector (weekly/biweekly/monthly), remove button
   - **Empty state**: Sparkles icon + "No services yet. Tap below to add your first." (or "Browse available services — subscribe when you're ready.")

5. **Routine Suggestion** (AI-suggested adjacent service)

6. **Seasonal Boosts Section** (conditional)

7. **4-Week Preview Timeline** (visual week-by-week schedule)

8. **Add Services Button** → opens AddServicesSheet

9. **Bottom CTA** (fixed above tab bar, blur bg)
   - If subscribed: "Review Routine" + ArrowRight (disabled if over limit)
   - If not subscribed: "Subscribe to continue" + ArrowRight

**Loading**: Skeleton blocks
**Service Day Gate**: H2 "Confirm your Service Day" + "Lock in your weekly service day before building your routine." + Button "Set Service Day"

### Screen 9.2: Routine Review

**Route**: `/customer/routine/review`
**Purpose**: Review 4-week preview before confirming

### Screen 9.3: Routine Confirm

**Route**: `/customer/routine/confirm`
**Purpose**: Final confirmation with effective date
**Copy**: "Changes effective next cycle."

---

# FLOW 10: Service Day Management

### Screen 10.1: Service Day

**Route**: `/customer/service-day`

**States**:

1. **Loading**: Spinner + "We're matching you to the best route…"

2. **No Assignment**: Caption "Unable to generate a service day offer. Please ensure you have an active subscription."

3. **Offer Pending** (primary state):
   - ServiceDayOfferCard: shows offered day with capacity info, Confirm/Reject buttons
   - Scheduling Preferences section with toggle switches
   - Expired offer alert (if applicable): "Your previous offer expired, so we refreshed your Service Day options."

4. **Alternatives** (after rejection):
   - ServiceDayAlternatives: grid of alternative day options

5. **Confirmed**:
   - ServiceDayConfirmed: shows locked day with checkmark
   - Scheduling Preferences section

---

# FLOW 11: Schedule & Activity

### Screen 11.1: Schedule (Primary Tab)

**Route**: `/customer/schedule`
**Tab**: Schedule (2nd tab, CalendarDays icon)
**Purpose**: Answer "When is my next service?" — the #1 reason customers open the app.

**Layout**:
- Bottom tab bar visible (Schedule tab active)
- p-4, pb-24

**Sections (top to bottom)**:

1. **Header**
   - H2: "Schedule"

2. **Month Calendar** (mini calendar widget)
   - Compact month grid (Mon–Sun columns)
   - Current month shown, swipe left/right to navigate months
   - Days with scheduled services show a cyan dot below the date number
   - Today highlighted with accent circle
   - Tapping a day with a dot scrolls the list below to that date
   - Caption below calendar: "X services this month"

3. **This Cycle Summary** (Card, moved from Dashboard)
   - Service count badges (top 3 services + "+X more")
   - Handle usage bar: "X/Y handles used this cycle"
   - If rollover: "+X rolled over from last cycle" caption (accent, 12px) below the bar
   - "Edit routine →" link to `/customer/routine`

4. **Upcoming Visits List**
   - Section label: "UPCOMING" (uppercase caption)
   - Visit cards (repeating):
     - Date header (e.g., "Thursday, Mar 13")
     - Card: Service names, provider name + avatar, estimated time window
     - Status badge: Scheduled / En Route / In Progress
     - Tap → `/customer/visits/:jobId` (Visit Detail)
   - Empty state: CalendarDays icon + "No upcoming visits" + "Your next service will appear here once scheduled."

5. **Service Day Info** (Card, compact)
   - CalendarDays icon + "Your service day: {dayOfWeek}"
   - Link: "Change preferences →" to `/customer/service-day`

**Redirects**:
- `/customer/visits` → `/customer/schedule`
- `/customer/upcoming` → `/customer/schedule`

### Screen 11.2: Activity (Primary Tab)

**Route**: `/customer/activity`
**Tab**: Activity (4th tab, Clock icon)
**Purpose**: Show proof that services were done. The retention moat — cumulative value that makes leaving feel like losing a record.

**Layout**:
- Bottom tab bar visible (Activity tab active)
- p-4, pb-24

**Sections (top to bottom)**:

1. **Header**
   - H2: "Activity"

2. **Stats Summary** (3-pill row, horizontal)
   - Shield icon: "{totalServices} services"
   - Camera icon: "{totalPhotos} photos"
   - Calendar icon: "{memberMonths} months"

3. **Value Card** (Card, accent/5 bg)
   - "Your home has received {totalServices} professional services since {joinDate}."
   - Badge: "Insured providers · Proof on every visit"

4. **Recent Receipt Highlight** (Card, if last completed job exists)
   - Latest completed visit card with photo thumbnail
   - Service names, date, provider name
   - "View receipt →" CTA
   - Tap → `/customer/visits/:jobId`

5. **Timeline** (grouped by month)
   - Month headers: "March 2026", "February 2026", etc.
   - Left border accent line (timeline visual)
   - Per-visit entry:
     - Date: "EEE, MMM d" format
     - Service names (Badge per service)
     - Camera icon + photo count (if photos exist)
     - Tap → `/customer/visits/:jobId`
   - Empty state: Clock icon + "No completed services yet" + "Your service history will build here over time."

**Redirects**:
- `/customer/history` → `/customer/activity`
- `/customer/timeline` → `/customer/activity`

### Screen 11.3: Visit Detail (Receipt)

**Route**: `/customer/visits/:jobId`
**Purpose**: Proof-first receipt — photos and checklist before narrative

**Sections (top to bottom)**:

1. **Back Button**: "← Visits"

2. **Header**
   - Status badge (completed/under_review/resolved)
   - H2: Service summary (e.g., "Lawn Care (Standard)")
   - Date: "Tuesday, Jan 14, 2026"

3. **Presence Proof Card**
   - 3-column grid: Arrived (time) | Left (time) | On site (X min with Clock icon)
   - Fallback: "Verified by support."

4. **Photo Proof Card**
   - Photo gallery grid (thumbnails, tap to expand)

5. **Before & After Card** (conditional)
   - Slider comparison component

6. **Work Summary Card**
   - Provider summary text (if any)
   - Checklist items: CheckCircle (green) for done, XCircle (red) for not done + reason

7. **Courtesy Upgrade Notice** (conditional, accent border)
   - ArrowUpCircle icon + "Courtesy Upgrade Applied"
   - "We upgraded your [service] level today so your home meets Handled standards."
   - Button: "Update level going forward"
   - Copy should reference the service level name (e.g., Essential → Plus), not hardcoded tier names

8. **Provider Recommendation** (conditional, accent border)
   - Lightbulb icon + "Provider Recommendation"
   - "Your provider recommends upgrading to [next level] for better results."
   - Two buttons: "Update going forward" | "Keep current level"
   - Level names are dynamic per SKU — see `operating-model.md` for tier structure (Essential / Plus / Premium)

9. **Quick Feedback Card** (conditional, completed jobs only)
   - Satisfaction check with emoji/tag buttons

10. **Private Review Card** (conditional)
    - Rating, tags, optional public comment

11. **Share CTA**
    - Button (outline, full-width): Share2 icon + "Share the after photo"

12. **Receipt Suggestions** (growth surface)
    - Related services to add to routine

13. **Issue Section**
    - If issue exists: warning card with status, note, resolution
    - If no issue: Button (outline): "Report a problem"

**Sheets**:
- ReportIssueSheet: structured issue reporting with reason categories
- ShareCardSheet: generate shareable receipt link

### Screen 11.4: Appointment Picker

**Route**: `/customer/appointment/:visitId`
**Purpose**: Pick time window for a specific upcoming visit

---

# FLOW 12: Property Management

### Screen 12.1: Property Profile

**Route**: `/customer/property`

**Sections**:

1. **Header**
   - H2: "Your Home"
   - Caption: "A few details so we can serve you smoothly."

2. **Gated Banner** (conditional, if `?gated=1`)
   - MapPin icon + "Add your home details to continue." + dismiss X

3. **Section A — Address**
   - H3: "Address"
   - Street Address * → Input
   - 2-col: City * → Input | State * → Input (2 chars, uppercase)
   - Zip Code * → Input (numeric, 5 digits)
   - Zone coverage inline feedback:
     - Loading: spinner + "Checking coverage…"
     - Covered: CheckCircle (green) + "Zone: {name}"
     - Not covered: AlertTriangle (warning) + "Service is not yet available in your area."

4. **Section B — Home Setup**
   - H3: "Home Setup" (with info tooltip)
   - Card with 2 navigation rows:
     - Map icon + "Coverage Map" + "What's already handled at your home" + checkmark if done + ChevronRight
     - Ruler icon + "Home Size" + "Quick estimate for better recommendations" + checkmark if done + ChevronRight

5. **Section C — Access & Logistics**
   - H3: "Access & Logistics"
   - Gate Code → Input
   - Access Instructions → Textarea
   - Parking Notes → Textarea
   - Pets → Input (comma separated)
   - Anything Else → Textarea

6. **Sticky Save Button** (fixed above tab bar)
   - Button (full-width, h-12): "Save" (or spinner + "Saving…")

**Dialog**: "We're Not in Your Area Yet" with "Notify Me" and "Continue Exploring" buttons

### Screen 12.2: Coverage Map

**Route**: `/customer/coverage-map`
**Purpose**: Mark what services you already have handled

### Screen 12.3: Property Sizing

**Route**: `/customer/property-sizing`
**Purpose**: Estimate home size for service recommendations

---

# FLOW 13: Billing

### Screen 13.1: Billing Overview

**Route**: `/customer/billing`

**Sections**:

1. **Header**: H2 "Billing"

2. **Current Plan Card**
   - "Current plan" label + plan name
   - Status badge (Paid / Action needed)
   - Next bill date with Clock icon

3. **Failed Payment Alert** (conditional, destructive border)
   - AlertTriangle icon + "Payment failed" + "Update your payment method to avoid interruption."
   - Button (destructive, sm): "Fix"

4. **Payment Method Card** (tappable → methods page)
   - CreditCard icon + "Payment method"
   - Brand + last 4 digits (e.g., "visa ····4242")
   - ChevronRight
   - If none: "No method on file"

5. **Credits Card** (conditional)
   - Gift icon + "Credits available" + amount + "auto-applied on next bill"

6. **Billing History Card** (tappable → history page)
   - Receipt icon + "Billing history"
   - ChevronRight

### Screen 13.2: Payment Methods

**Route**: `/customer/billing/methods`
**Purpose**: Manage saved payment methods, add new cards, set default

### Screen 13.3: Billing History

**Route**: `/customer/billing/history`
**Purpose**: List of invoices with dates, amounts, status badges

### Screen 13.4: Receipt Detail

**Route**: `/customer/billing/receipts/:invoiceId`
**Purpose**: Individual invoice/receipt detail with line items

---

# FLOW 14: Customer Support

### Screen 14.1: Support Home

**Route**: `/customer/support`

**Sections**:

1. **Header**
   - H2: "Support"
   - Caption: "Get help or resolve an issue"

2. **Resolve CTA Card** (accent border + bg tint, tappable)
   - MessageCirclePlus icon (accent, in rounded bg) + "Resolve something now" + "Get an instant resolution for most issues" + ChevronRight

3. **Active Tickets Section** (conditional)
   - H3: "ACTIVE TICKETS" (uppercase caption)
   - Ticket cards (repeating):
     - TicketStatusChip + date + category label + customer note (truncated)
     - ChevronRight, tappable → ticket detail

4. **Recent Visits Section** (conditional)
   - H3: "RECENT VISITS"
   - Visit cards with Clock icon: date + "Report an issue"
   - Tappable → new ticket with job context

5. **View All Tickets Button** (conditional)
   - Button (outline, full-width): Inbox icon + "View all tickets (X)"

6. **Empty State**
   - Inbox icon (muted, 40×40) + "No issues yet — that's great!"

### Screen 14.2: New Ticket

**Route**: `/customer/support/new`
**Purpose**: Structured issue submission with reason categories (not freeform chat)

### Screen 14.3: Ticket List

**Route**: `/customer/support/tickets`
**Purpose**: Filterable list with status pills (Open | Resolved | All)

### Screen 14.4: Ticket Detail

**Route**: `/customer/support/tickets/:ticketId`
**Purpose**: Individual ticket view with status, notes, resolution

---

# FLOW 15: Customer Referrals

### Screen 15.1: Referrals Hub

**Route**: `/customer/referrals`

**Sections**:

1. **Header**: H2 "Referrals"

2. **Share & Earn Card**
   - Users icon + "Share & Earn"
   - Description: "Invite friends and earn credits when they subscribe."
   - Referral code display: monospace code in muted bg + Copy button
   - Uses count: "X referrals used"
   - If no code: "Generate Code" button

3. **Credits Summary** (2-column grid)
   - Card 1: Gift icon + earned amount + "Earned"
   - Card 2: Clock icon (amber) + pending amount + "Pending"

4. **Referral List**
   - H3: "Your Referrals"
   - Cards per referral: ID preview + milestone badges (Signed up, Subscribed, First visit, Paid cycle)
   - Empty: "No referrals yet. Share your code to get started!"

---

# FLOW 16: Customer More & Settings

### Screen 16.1: More Menu

**Route**: `/customer/more`

**Sections**:

1. **Header**: H2 "More"

2. **Role Switcher** (conditional, if user has multiple roles)

3. **Menu Sections** (grouped cards with dividers):
   - **Account**: Plans & Subscription (CreditCard) | Property (MapPin) | Billing (Wallet)
   - **Community**: Referrals (Users) | Support (HelpCircle)
   - **Preferences**: Settings (Settings)

4. **Appearance**
   - Dark/Light mode toggle with Moon/Sun icon + Switch

5. **Sign Out** (destructive card)
   - LogOut icon + "Sign Out"

Each menu item: icon + label + ChevronRight, tappable

**Note**: "Plans & Subscription" replaces the former Plans primary tab. It links to `/customer/plans` which serves as both plan browsing (for new/upgrading customers) and subscription management (for active subscribers).

### Screen 16.2: Account Settings

**Route**: `/customer/settings`

**Sections**:

1. **Header**: H2 "Account Settings"

2. **Avatar + Email**
   - Avatar circle (14×14) with initials, accent bg
   - Mail icon + email address

3. **Profile Form**: Full name, phone (editable)
4. **Change Password Form**: Current + new password
5. **Notification Preferences**: Toggle switches
6. **Role Switcher** (if multi-role)
7. **Preview As Card** (dev/admin tool)
8. **Sign Out Button** (destructive, full-width): LogOut icon + "Sign Out"

### Screen 16.3: Notification Inbox

**Route**: `/customer/notifications`
**Purpose**: Chronological notification list (shared component across all roles)

---

# FLOW 17: Provider Onboarding

**Route**: `/provider/onboarding`
**Who**: New provider with invite code
**Purpose**: 6-step guided onboarding

### Screen 17.1: Invite Code Entry

**Sections**:

1. **Header** (centered, mt-8)
   - Shield icon (accent, 48×48)
   - H2: "Join the Handled Home Network"
   - Caption: "You're applying to join a curated network of trusted service providers."

2. **Invite Code Card**
   - CardTitle: "Enter Your Invite Code"
   - Input (centered, large, monospace, tracking-widest, placeholder "e.g. HANDLED-2026")
   - Error text (destructive) if invalid
   - Button (full-width): "Verify Code" + ArrowRight

**States**:
- **Loading org**: Full-screen spinner
- **Active org**: Redirects to dashboard
- **Suspended**: AlertTriangle icon (destructive) + H2 "Account Suspended" + "Please contact support" + Button "Contact Support"
- **Pending Review**: Clock icon + H2 "Under Review" + Submission date + Checklist (all checkmarks + warning for missing docs) + "We'll notify you"
- **Draft (Resume)**: Shield icon + H2 "Continue Your Application" + Button "Continue Application" (navigates to next incomplete step)

### Screen 17.2: Step 1 — Organization Setup

**Route**: `/provider/onboarding/org`
**Fields**: Business name, phone, zip, website (optional)

### Screen 17.3: Step 2 — Coverage Zones

**Route**: `/provider/onboarding/coverage`
**Purpose**: Select which zones to operate in (from allowed zones)

### Screen 17.4: Step 3 — Capabilities

**Route**: `/provider/onboarding/capabilities`
**Purpose**: Select service categories (lawn care, landscaping, etc.)

### Screen 17.5: Step 4 — Compliance

**Route**: `/provider/onboarding/compliance`
**Purpose**: Terms acceptance, insurance + tax document upload

### Screen 17.6: Step 5 — Agreement

**Route**: `/provider/onboarding/agreement`
**Purpose**: Read and accept service agreement

### Screen 17.7: Step 6 — Review

**Route**: `/provider/onboarding/review`
**Purpose**: Final review of all submitted information before submission

---

# FLOW 18: Provider Dashboard

**Route**: `/provider`
**Who**: Active provider
**Purpose**: Daily operations hub — today's jobs, earnings, route status

### Screen 18.1: Provider Dashboard (Primary Tab — Home)

**Layout**:
- Bottom tab bar visible (Home tab active)
- p-4, pb-24

**Sections (top to bottom)**:

1. **Greeting**
   - H2: "Good morning, {firstName}"
   - Caption: "You have X jobs today" (or "No jobs scheduled for today")

2. **Notification Banners** (SLA alerts, compliance warnings)

3. **Market Heat Banner** (demand signals)

4. **Route Lock Banner** (Card, conditional)
   - **Not locked**: Car icon + "Ready to start?" + "Lock your route to begin your day" + Button "Start Route" (Lock icon)
   - **Locked**: Lock icon (accent) + "Route Locked" + "X stops · Y min total" + Projected earnings line

5. **Stats Grid** (2×2)
   - Briefcase icon: "Today's Jobs" = count
   - Clock icon: "Est. Work" = X min
   - Car icon: "Est. Drive" = X min
   - TrendingUp icon: "This Week" = $XX.XX

6. **Earnings Projection Card** (`EarningsProjectionCard`)
   - Shows capacity % and estimated monthly earnings
   - Growth CTA if below 90% capacity
   - See Flow 34 for full spec

7. **Route Progress Card** (`RouteProgressCard`, added Batch 2)
   - Segmented progress bar showing completed vs remaining stops today
   - "X of Y stops complete" label
   - Trophy icon when all stops done
   - Only visible when provider has jobs today

8. **BYOC Banner** (`ByocBanner`)
   - See Flow 35 for full spec

9. **Today's Queue**
   - H3: "Today's Queue" + "See all" link
   - QuickJobCards (repeating):
     - Rank badge (#1, #2…) + address + services + duration + status badge + ChevronRight
   - Button (ghost): "View all jobs →"
   - Empty: MapPin icon + "No jobs scheduled for today" + "Check upcoming jobs or enjoy the day off"

10. **Daily Recap Card** (`DailyRecapCard`, added Batch 1)
    - Shows end-of-day summary: jobs completed, total earnings, avg per job
    - Only visible after provider has completed at least one job today

11. **Coming Up**
    - H3: "Coming Up"
    - Card with upcoming 3 jobs: CalendarDays icon + address + date + service count

---

# FLOW 19: Provider Job Execution

### Screen 19.1: Job List

**Route**: `/provider/jobs`

**Sections**:
1. Tabs: Today | This Week | All
2. Today's Loadout summary (total stops, minutes)
3. Day Plan summary
4. Job Cards (repeating): rank, address, services, status badge, duration, reorder buttons
5. Map/List view toggle
6. Route optimization button
7. Week Due Queue
8. Empty: "No jobs scheduled for today"

### Screen 19.2: Job Detail

**Route**: `/provider/jobs/:jobId`
**Purpose**: Full job info — property details, checklist, photos required, navigation

**Key UI elements (updated Batch 2)**:
- **Queue breadcrumb**: "Stop X of Y today" with prev/next navigation arrows (ChevronLeft/ChevronRight). Uses `useProviderJobs("today_all")` for queue context.
- **Sticky action bar**: Fixed bottom-16 with pb-48. Contains primary actions (Start Job, View Checklist, Upload Photos, Complete Job) based on job status.
- Property details card: address, gate code, dog alert, parking notes
- SKU checklist with proof-required indicators
- Report Issue and Self-Healing action sheets

### Screen 19.3: Job Checklist

**Route**: `/provider/jobs/:jobId/checklist`
**Purpose**: Complete checklist items one by one (guided, one action at a time)

### Screen 19.4: Job Photos

**Route**: `/provider/jobs/:jobId/photos`
**Purpose**: Upload required before/after photos per SKU

### Screen 19.5: Job Complete

**Route**: `/provider/jobs/:jobId/complete`
**Purpose**: Confirmation and celebration screen after marking job complete

**Key UI elements (updated Batch 2)**:
- **Celebration header**: PartyPopper icon with "Job Complete!" headline
- **Earnings display**: Shows base pay + modifier breakdown with `formatCents` utility
- **Route progress bar**: Segmented stops showing completed vs remaining, trophy when all done
- **Next stop CTA**: Button to navigate directly to next uncompleted job
- **Day complete state**: Trophy card when all stops finished
- Level sufficiency form (LevelSufficiencyForm) for quality feedback
- Notes textarea and submit flow

---

# FLOW 20: Provider BYOC Center

### Screen 20.1: BYOC Center

**Route**: `/provider/byoc`

**Sections**:

1. **Header**
   - H2: "BYOC Center" + Caption: "Bring Your Own Customers"
   - Button (sm): Plus icon + "New Link"

2. **How BYOC Works Card**
   - Info icon + title
   - 3 numbered steps:
     1. "Create an invite link for your service category and zone."
     2. "Share the link with your existing customers via text or email."
     3. "When they sign up, you earn BYOC bonuses and keep servicing them."

3. **Compliance Reminder** (Alert)
   - AlertTriangle: "Do not promise permanent pricing. Transition credits may apply. All pricing is set by Handled Home."

4. **Stats Grid** (3 columns)
   - Link2 icon: "Active Links" = count
   - Users icon: "Activations" = count
   - Gift icon: "Recent Events" = count

5. **Invite Scripts Card** (conditional)
   - Pre-written message templates with tone badges and Copy buttons

6. **Active Invite Links Card**
   - Per link: category badge + status icon + token + activation count + cadence
   - Buttons: "Copy Link" + "Deactivate"
   - Empty: "No active links yet. Create one to start inviting customers."

7. **Recent Activity** (collapsible)
   - Event list with type badges and timestamps

8. **Inactive Links** (collapsed section)

**Gate**: Must be approved provider. Otherwise shows locked screen.

### Screen 20.2: Create BYOC Link

**Route**: `/provider/byoc/create-link`
**Purpose**: Form to create new invite link (select category, zone, cadence)

---

# FLOW 21: Provider Earnings & Payouts

### Screen 21.1: Earnings Dashboard

**Route**: `/provider/earnings`

**Sections**:

1. **Header**: H2 "Earnings" + Caption "Track your earnings and payouts"

2. **Period Selector** (pill row)
   - "Today" | "Week" | "Month" — active has white bg + shadow

3. **Stats Grid** (2×2)
   - DollarSign: "{Period} Earned" = amount
   - Zap: "Modifiers" = +/- amount
   - TrendingUp: "Available" = amount
   - Clock: "On Hold" = amount

4. **Monthly Projection Card** (conditional, primary tint)
   - Target icon + "At current pace: $X,XXX" + "X scheduled jobs remaining · avg $XX/job"
   - Framing: guaranteed, predictable payout per job — no tip dependency, no surprise adjustments

5. **Payout Account Status Card**
   - CheckCircle (green): "Payout account ready" + "Earnings will be deposited on schedule"
   - PauseCircle (warning): "Payout account not set up" + "Set up your payout account to receive earnings"

6. **Earnings/Payouts Tabs**
   - Tab "Earnings": Earning cards with address, date, status badge, base/modifier/net breakdown (expandable)
     - **Modifier explanation labels** (added Batch 1): Each modifier shows a human-readable reason ("Quality tier bonus", "Rush / high-demand bonus", "Adjustment — issue reported")
     - **Expandable earning cards**: Tap to expand and see full base + modifier + net breakdown
   - Tab "Payouts": Payout cards with date, status badge, amount
   - All payout amounts are per-job, set by SKU + Level + zone. Providers never see customer pricing.

7. **Held Earnings Detail** (added Batch 1)
   - Expandable section showing held earnings with hold reason labels
   - Hold reasons: "New provider review period", "Under review — service issue reported", "Payout account setup required"
   - Estimated release timeline when available

**Empty (earnings)**: DollarSign icon + "No earnings for this period" + "Complete jobs to start earning"
**Empty (payouts)**: Banknote icon + "No payouts yet"

**Design note**: Provider earnings screens should reinforce the value of predictable, guaranteed payouts and denser routes — the core provider value prop. See `operating-model.md` → Provider Payout Logic.

---

# FLOW 22: Provider Performance & Quality

### Screen 22.1: Quality Score

**Route**: `/provider/quality` or `/provider/performance`
**Purpose**: Quality rating breakdown, feedback summary, performance metrics

### Screen 22.2: Insights

**Route**: `/provider/insights`
**Purpose**: Business insights and growth recommendations

### Screen 22.3: Insights History

**Route**: `/provider/insights/history`
**Purpose**: Historical insights archive

---

# FLOW 23: Provider Organization & Setup

### Screen 23.1: Organization

**Route**: `/provider/organization`
**Purpose**: Business profile — name, phone, website, team members

### Screen 23.2: Coverage

**Route**: `/provider/coverage`
**Purpose**: Zone map and capacity assignments

### Screen 23.3: Authorized SKUs

**Route**: `/provider/skus`
**Purpose**: Services this provider is authorized to perform

### Screen 23.4: Work Setup

**Route**: `/provider/work-setup`
**Purpose**: Working hours, availability preferences

### Screen 23.5: Availability

**Route**: `/provider/availability`
**Purpose**: Schedule availability calendar

---

# FLOW 24: Provider More & Settings

### Screen 24.1: More Menu

**Route**: `/provider/more`

**Sections** (same structure as customer More menu):
- **Business**: Organization (Building2) | Coverage & Availability (Map)
- **Growth**: BYOC Center (UserPlus) | Referrals (Users)
- **Help**: Support (HelpCircle)
- **Preferences**: Settings (Settings)
- Appearance toggle
- Sign Out

**Note**: Coverage & Availability replaces the former Coverage primary tab. BYOC Center and Referrals are grouped under "Growth" to make the revenue-boosting tools discoverable as a category.

### Screen 24.2: Provider Settings

**Route**: `/provider/settings`
**Purpose**: Account settings, notification preferences (same pattern as customer settings)

### Screen 24.3: Provider Support

**Route**: `/provider/support`
**Purpose**: Support tickets for providers

### Screen 24.4: Provider Referrals

**Route**: `/provider/referrals`
**Purpose**: Provider referral program + customer invites

---

# FLOW 25: Admin Dashboard & Ops

### Screen 25.1: Admin Dashboard

**Route**: `/admin`
**Layout**: Sidebar navigation (AdminShell), not bottom tabs
**Purpose**: Overview metrics — active subscriptions, jobs today, provider count, revenue

### Screen 25.2: Ops Cockpit

**Route**: `/admin/ops`
**Purpose**: Real-time operational health dashboard with drill-down links

### Screen 25.3: Zone Health

**Route**: `/admin/ops/zones`
**Purpose**: Zone-by-zone capacity, provider coverage, service day distribution

### Screen 25.4: Zone Detail

**Route**: `/admin/ops/zones/:zoneId`

### Screen 25.5: Jobs Health

**Route**: `/admin/ops/jobs`
**Purpose**: Active/completed/failed jobs metrics

### Screen 25.6: Billing Health

**Route**: `/admin/ops/billing`
**Purpose**: Payment success rates, failed payments, revenue metrics

### Screen 25.7: Growth Health

**Route**: `/admin/ops/growth`
**Purpose**: Signup funnel, BYOC activations, referral conversion

### Screen 25.8: Support Health

**Route**: `/admin/ops/support`
**Purpose**: Ticket volume, resolution time, SLA compliance

---

# FLOW 26: Admin Provider Management

### Screen 26.1: Provider List

**Route**: `/admin/providers`
**Purpose**: Searchable, filterable provider directory

### Screen 26.2: Provider Detail

**Route**: `/admin/providers/:id`
**Purpose**: Full provider profile — org info, coverage, capabilities, quality, earnings

### Screen 26.3: Application Queue

**Route**: `/admin/providers/applications`
**Purpose**: Pending provider applications for review

### Screen 26.4: Application Detail

**Route**: `/admin/providers/applications/:id`
**Purpose**: Individual application review with approve/reject actions

---

# FLOW 27: Admin Service Configuration

### Screen 27.1: Zone Management

**Route**: `/admin/zones`
**Purpose**: Create/edit zones, assign zip codes

### Screen 27.2: Zone Builder

**Route**: `/admin/zones/builder`
**Purpose**: Map-based zone creation tool

### Screen 27.3: SKU Catalog

**Route**: `/admin/skus`
**Purpose**: Service type definitions — names, durations, levels, checklist templates

### Screen 27.4: Plan Management

**Route**: `/admin/plans`
**Purpose**: Subscription plan configuration — pricing, handles, zone availability

### Screen 27.5: Bundle Management

**Route**: `/admin/bundles`
**Purpose**: Service bundle configuration

### Screen 27.6: Service Day Config

**Route**: `/admin/service-days`
**Purpose**: Service day rules — capacity per day, assignment algorithm

### Screen 27.7: Scheduling

**Route**: `/admin/scheduling`
**Purpose**: Scheduling rules and policies

### Screen 27.8: Capacity

**Route**: `/admin/capacity`
**Purpose**: Zone capacity planning — homes per day, buffer percentages

---

# FLOW 28: Admin Job & Exception Management

### Screen 28.1: Job List

**Route**: `/admin/jobs`
**Purpose**: All jobs with filters (status, date, zone, provider)

### Screen 28.2: Job Detail

**Route**: `/admin/jobs/:jobId`
**Purpose**: Full job view with admin actions

### Screen 28.3: Exception Queue

**Route**: `/admin/exceptions`
**Purpose**: Severity-sorted exception queue (failed payments, missed jobs, provider issues)

### Screen 28.4: Exception Analytics

**Route**: `/admin/ops/exception-analytics`
**Purpose**: Exception patterns and trends

### Screen 28.5: Dispatcher Queues

**Route**: `/admin/ops/dispatch`
**Purpose**: Job dispatch management

---

# FLOW 29: Admin Billing & Payouts

### Screen 29.1: Billing Overview

**Route**: `/admin/billing`
**Purpose**: Revenue overview, subscription status distribution

### Screen 29.2: Customer Ledger

**Route**: `/admin/billing/customers/:customerId`
**Purpose**: Individual customer financial history — invoices, credits, payments

### Screen 29.3: Payout Overview

**Route**: `/admin/payouts`
**Purpose**: Provider payout status, pending amounts, payout schedule

### Screen 29.4: Provider Ledger

**Route**: `/admin/payouts/providers/:providerOrgId`
**Purpose**: Individual provider earnings history — earnings, holds, payouts

### Screen 29.5: Pricing Control

**Route**: `/admin/control/pricing`
**Purpose**: System-wide pricing configuration

### Screen 29.6: Payout Control

**Route**: `/admin/control/payouts`
**Purpose**: Payout frequency, hold policies, minimum thresholds

---

# FLOW 30: Admin Support & Growth

### Screen 30.1: Support Console

**Route**: `/admin/support`
**Purpose**: All support tickets with filters, assignment, bulk actions

### Screen 30.2: Support Ticket Detail

**Route**: `/admin/support/tickets/:ticketId`
**Purpose**: Full ticket view with admin resolution tools

### Screen 30.3: Support Policies

**Route**: `/admin/support/policies`
**Purpose**: Auto-resolution rules, SLA targets, escalation paths

### Screen 30.4: Response Macros

**Route**: `/admin/support/macros`
**Purpose**: Pre-written support response templates

### Screen 30.5: Growth Dashboard

**Route**: `/admin/growth`
**Purpose**: Viral loop metrics, BYOC performance, referral conversion

### Screen 30.6: Feedback

**Route**: `/admin/feedback`
**Purpose**: Customer feedback review and transparency

### Screen 30.7: Reports

**Route**: `/admin/reports`
**Purpose**: Business analytics and reporting

### Screen 30.8: Audit Logs

**Route**: `/admin/audit`
**Purpose**: System audit trail — who did what, when

### Screen 30.9: Incentive Programs

**Route**: `/admin/incentives`
**Purpose**: Referral program configuration, BYOC bonus rules

---

# Navigation Reference

## Bottom Tab Bar — Customer
| Tab | Icon | Route | Label |
|-----|------|-------|-------|
| 1 | Home | `/customer` | Home |
| 2 | CalendarDays | `/customer/schedule` | Schedule |
| 3 | ListChecks | `/customer/routine` | Routine |
| 4 | Clock | `/customer/activity` | Activity |
| 5 | MoreHorizontal | `/customer/more` | More |

**Navigation story (left to right):** "My home → What's next → My services → What got done → Everything else"

**Rationale:** Plans was a setup-once page consuming a primary tab. Schedule (upcoming visits) and Activity (completed services timeline) are higher-frequency destinations. Plans moves to the More menu under Account.

## Bottom Tab Bar — Provider
| Tab | Icon | Route | Label |
|-----|------|-------|-------|
| 1 | Home | `/provider` | Home |
| 2 | Briefcase | `/provider/jobs` | Jobs |
| 3 | DollarSign | `/provider/earnings` | Earn |
| 4 | BarChart3 | `/provider/performance` | Score |
| 5 | MoreHorizontal | `/provider/more` | More |

**Navigation story (left to right):** "My overview → My work → My money → My standing → Everything else"

**Rationale:** The Dashboard (today's queue, route lock, projected earnings) was not previously a tab — providers couldn't reach it via tab navigation. Earn merges Earnings + Payouts into one money center. Score rebrands Performance with gamification potential. Coverage (setup-once) moves to More.

## Admin — Sidebar Navigation
Admin uses a fixed left sidebar (AdminShell) with grouped navigation sections instead of bottom tabs.

---

# FLOW 31: Bundle Savings Calculator

**Component**: `BundleSavingsCard`
**Where**: Plans page, Onboarding Plan Step
**Purpose**: Show customers how much they save vs. hiring separate vendors — reinforces subscription value without exposing per-handle economics. See `operating-model.md` → Bundle Design for the margin logic behind bundling anchor services with low-frequency, high-perceived-value items.

### Screen 31.1: Bundle Savings Card

**Layout**:
- Card with `bg-accent/5 border-accent/20`
- Left: 36px accent circle with PiggyBank icon
- Right: text content

**Sections**:
1. **Headline**: "Save ~$X/mo vs. separate vendors" (bold, 14px)
2. **Subtext**: "That's X% less than hiring individually" (muted, 12px)
3. **Service breakdown** (mt-2, space-y-1):
   - Per service: Check icon + service name + strikethrough separate price (right-aligned)
   - Bottom row: PiggyBank icon + "Handled Home" + subscription price (accent, bold)
   - Separated by thin accent/10 border

**Data**: Tier-based services (Essential: lawn; Plus: lawn+pest; Premium: lawn+pest+pool). Conservative market-rate estimates. Include low-frequency items (gutters, dryer vent, pressure washing) in higher tiers to widen perceived value gap — these items increase plan attractiveness without proportional monthly cost. See `operating-model.md` → Low-frequency, high-perceived-value items.

**Key constraint**: Never show per-handle math. Show monthly totals only. Frame savings at the plan level ("Save ~$X/mo"), never per-service margin.

---

# FLOW 32: First Service Celebration

**Component**: `FirstServiceCelebration`
**Where**: Customer Dashboard (overlay, triggered once)
**Purpose**: Create emotional "aha" moment after first completed service

### Screen 32.1: Celebration Overlay

**Layout**:
- Full-screen fixed overlay, `z-50`, `bg-background/95 backdrop-blur-sm`
- Content centered, max-w-sm, space-y-6

**Sections**:
1. **Icon**: PartyPopper (64px, accent) with spring animation + rotation wiggle
2. **Headline**: "Your home is handled!" (24px bold)
3. **Subtext**: "Your first service is complete. Your subscription is already working for you." (muted, 14px)
4. **Service summary card** (bg-card, rounded-2xl, border, p-4):
   - Star icon + "Serviced by {providerName}" (if available)
   - Date (muted, 12px)
   - "Your proof-of-work receipt is ready to view..." (muted, 12px)
5. **Primary CTA**: "View Your Receipt" (default button, h-12, rounded-xl, with ArrowRight)
6. **Secondary CTA**: "Share the news" (outline, with Share2 icon)
7. **Dismiss**: "Continue to dashboard" (text link, muted)

**Trigger**: Once only (localStorage flag). Shown when `lastCompletedJob` exists and flag not set.

---

# FLOW 33: Home Timeline

**Route**: `/customer/timeline`
**Who**: Customer
**Purpose**: Chronological service history that reinforces subscription value and creates switching costs

### Screen 33.1: Home Timeline Page

**Layout**:
- Standard page with back arrow + "Home Timeline" header
- pb-24 for tab bar clearance

**Sections**:
1. **Stats row** (grid-cols-3, gap-3):
   - CheckCircle + total services count + "Services"
   - Camera + total photos count + "Photos"
   - Clock + membership duration + "Member"
2. **Value card** (bg-accent/5, border-accent/20):
   - TrendingUp icon + "Your subscription has delivered X services" + "All verified with proof-of-work receipts"
3. **Trust badge** (centered): Shield icon + "Insured providers · Proof on every visit"
4. **Monthly groups**:
   - Calendar icon + month name + visit count badge (right-aligned)
   - Left border (accent/20, 2px) with indented job cards:
     - CheckCircle + service names + date + photo count
     - Tappable → navigates to `/customer/visits/:jobId`
5. **Bottom CTA**: "View all photos" (outline button, Camera icon)

**Empty state**: Calendar icon + "No completed services yet" + subtext

---

# FLOW 34: Provider Earnings Projection

**Component**: `EarningsProjectionCard`
**Where**: Provider Dashboard, Provider Onboarding (future)
**Purpose**: Show providers income potential to kill ambiguity and reduce churn

### Screen 34.1: Dashboard Variant

**Layout**:
- Card with `bg-primary/5 border-primary/20`
- Left: 36px primary circle with Target icon

**Content**:
- Headline: "You're at X% capacity" (or "nearly at full capacity" if ≥80%)
- Subtext: "X jobs/week · avg finish Xh" or "est. $X/mo"
- Growth CTA (accent, 12px): "Fill your schedule to earn $X more/mo" (if <90% capacity)

### Screen 34.2: Onboarding Variant

**Layout**:
- Card with `bg-accent/5 border-accent/20`
- TrendingUp icon circle + "Earnings potential in your zone"

**Content**:
- 2-column grid:
  - "At 60% capacity" + weekly estimate (foreground, bold)
  - "Full schedule" + weekly estimate (accent, bold)
- Footer: Zap icon + "Dense routes mean less driving, more earning"
- The density message reinforces the provider economics flywheel: more density → denser routes → more stops/day → better earnings/hour → better retention

**Key constraint**: Never show customer pricing or subscription spread. Show payout amounts only. See `operating-model.md` → Provider Payout Logic for the full economics model.

---

# FLOW 35: BYOC Banner (Provider Dashboard)

**Component**: `ByocBanner`
**Where**: Provider Dashboard (between stats and job queue)
**Purpose**: Make BYOC the hero growth action for providers

### Screen 35.1: BYOC Banner Card

**Layout**:
- Card with `bg-accent/5 border-accent/20`
- Left: 36px accent circle with Users icon

**Content**:
- Headline: "Bring your existing customers" (bold, 14px)
- Subtext: "Earn bonus income on top of your guaranteed route pay when your own customers join Handled Home." (muted, 12px)
- Activation count (if >0): DollarSign + "X customers activated" (accent, 12px)
- CTA: "Create invite link" (outline sm button, ArrowRight icon)

---

# FLOW 36: Trust Bar (Onboarding Social Proof)

**Component**: `TrustBar`
**Where**: Onboarding Zone Check step, Plan Selection step
**Purpose**: Reduce cold-funnel fear with trust signals

### Screen 36.1: Trust Bar

**Layout**:
- Horizontal flex, centered, py-2.5 px-3, bg-muted/50 rounded-xl
- 3 items separated by 12px-tall vertical dividers (bg-border)

**Items**:
1. Shield icon (primary) + "Insured providers"
2. Clock icon (accent) + "Satisfaction guarantee"
3. XCircle icon (muted) + "Cancel anytime"

**Typography**: 12px, muted-foreground

---

# FLOW 37: Referral Milestones

**Where**: Customer Referrals page (below credits summary)
**Purpose**: Create urgency and tiered goals for referral growth

### Screen 37.1: Milestone Card

**Layout**:
- Card with CardHeader ("Referral Milestones" + Target icon) and CardContent

**Content**:
1. **Progress headline**: "X more referrals to unlock: {reward}" (14px medium)
2. **Progress bar**: `<Progress>` component, h-2
3. **Count label**: "X / Y referrals" (muted, 12px)
4. **3-column tier grid** (gap-2):
   - Per tier: icon + label + reward text
   - Achieved: bg-accent/10, border-accent/30, accent icon
   - Locked: bg-muted/30, border-border, muted icon

**Tiers**:
- Starter (Star icon): 3 referrals → $30 credit
- Ambassador (Trophy icon): 5 referrals → Free month
- Champion (Gift icon): 10 referrals → VIP status

---

# FLOW 38: Navigation Restructure

**Purpose**: Redesign bottom tab navigation for both Customer and Provider roles based on first-principles analysis of user frequency patterns. Tabs should reflect daily-use destinations, not setup-once pages.

## Customer Navigation Change

**Before**: `Home | Plans | Routine | Visits | More`
**After**: `Home | Schedule | Routine | Activity | More`

### Rationale
- **Plans** (setup-once) replaced by **Schedule** (checked 2-3x/week — "when is my next service?")
- **Visits** (ambiguous) replaced by **Activity** (clear — "what's been done to my home")
- **Routine** stays — it's the subscription flywheel and a differentiator
- Dashboard simplified by offloading ThisCycleSummary → Schedule, RecentReceipt → Activity

### Customer Weekly Loop
```
Monday:    Home → see "Thursday service" card → feel assured → close
Thursday:  Push notification → Schedule → see ETA → wait
Thursday:  Push notification → Activity → see receipt + photos → satisfied
Saturday:  Home → see suggestion → Routine → add pool cleaning → done
```

**Every interaction reinforces the value proposition. The loop: anticipate → receive → verify → expand.**

## Provider Navigation Change

**Before**: `Jobs | Payouts | Performance | Coverage | More`
**After**: `Home | Jobs | Earn | Score | More`

### Rationale
- **Dashboard added as Home tab** — it has today's queue, route lock, projected earnings, BYOC banner. Was previously unreachable via tabs.
- **Payouts** replaced by **Earn** — broader framing includes real-time earnings, projections, and BYOC bonuses (not just past payouts)
- **Performance** rebranded as **Score** — more engaging, implies gamification
- **Coverage** (setup-once) moves to More

### Provider Daily Workflow
```
7:00 AM:   Home → see 6 jobs → tap "Lock Route" → see projected $187
7:30 AM:   Jobs → map view → drive to first stop
8:00 AM:   Job detail → checklist → photos → complete → "+$32" toast
3:00 PM:   Earn → see "$187 earned today" → feel productive
Friday:    Earn → see "Payout: $843 sent" → feel paid
Sunday:    Score → see 98% on-time, 15-day streak → feel proud
```

## Route Redirects

| Old Route | Redirects To | Reason |
|-----------|-------------|--------|
| `/customer/visits` | `/customer/schedule` | Renamed tab |
| `/customer/upcoming` | `/customer/schedule` | Merged into Schedule |
| `/customer/history` | `/customer/activity` | Merged into Activity |
| `/customer/timeline` | `/customer/activity` | Merged into Activity |

**Note**: `/customer/visits/:jobId` remains unchanged (Visit Detail / Receipt page). Only the list views redirect.

## More Menu Restructuring

### Customer More Menu
```
Account
  ├─ Plans & Subscription    (CreditCard icon)
  ├─ Property                (MapPin icon)
  └─ Billing                 (Wallet icon)

Community
  ├─ Referrals               (Users icon)
  └─ Support                 (HelpCircle icon)

Preferences
  └─ Settings                (Settings icon)
```

### Provider More Menu
```
Business
  ├─ Organization            (Building2 icon)
  └─ Coverage & Availability (Map icon)

Growth
  ├─ BYOC Center             (UserPlus icon)
  └─ Referrals               (Users icon)

Help
  └─ Support                 (HelpCircle icon)

Preferences
  └─ Settings                (Settings icon)
```

## Page Merges

| Current (separate pages) | Merged Into | Notes |
|--------------------------|-------------|-------|
| Upcoming Visits + Visit History | Schedule + Activity | Future visits → Schedule tab; past visits → Activity tab |
| HomeTimeline + History | Activity | Activity is the enriched timeline with stats |
| Earnings + Payouts | Earn | Single money center with period tabs |
| Performance + Insights | Score | Single performance hub |

---

# FLOW 39: Sprint Implementation Plan

## Sprint 1: Navigation Shell (Foundation)

**Goal**: Change tab bars, routes, redirects. No page content changes. Everything works — tabs just point to new destinations.

### Files to modify:
1. `src/components/BottomTabBar.tsx` — Update customerTabs and providerTabs arrays
2. `src/App.tsx` — Add routes for `/customer/schedule` and `/customer/activity`, add redirect routes
3. `src/components/MoreMenu.tsx` — Restructure menu sections for both roles

### Changes:
- **BottomTabBar.tsx**: Customer tabs → Home, Schedule (`/customer/schedule`), Routine, Activity (`/customer/activity`), More. Provider tabs → Home (`/provider`), Jobs, Earn (`/provider/earnings`), Score (`/provider/performance`), More.
- **App.tsx**: Add `<Route path="/customer/schedule" element={<CustomerSchedule />} />`, `<Route path="/customer/activity" element={<CustomerActivity />} />`, redirect routes for old paths.
- **MoreMenu.tsx**: Add "Plans & Subscription" to customer Account section. Add "Coverage & Availability" and "Growth" section to provider menu.

### New files:
- `src/pages/customer/Schedule.tsx` — Initially wraps existing upcoming visits functionality
- `src/pages/customer/Activity.tsx` — Initially wraps existing HomeTimeline component

### Verification:
- All tabs navigate correctly
- Old routes redirect properly
- `/customer/visits/:jobId` still works
- More menus show updated sections
- `npm run build` passes

---

## Sprint 2: Customer Page Refinement

**Goal**: Build the Schedule page with calendar, enrich the Activity page, simplify Dashboard.

### Files to modify:
1. `src/pages/customer/Schedule.tsx` — Full implementation with mini calendar + upcoming list + cycle summary
2. `src/pages/customer/Activity.tsx` — Full implementation merging HomeTimeline stats + chronological history
3. `src/pages/customer/Dashboard.tsx` — Remove ThisCycleSummary, RecentReceipt, HomeTimeline link

### New components:
- `src/components/customer/MiniCalendar.tsx` — Month grid calendar widget with service day dots

### Verification:
- Schedule shows calendar with dots on service days
- Tapping a calendar day scrolls to that date's visits
- Activity shows stats + grouped timeline + receipts
- Dashboard is cleaner (5 focused sections)
- `npm run build` passes

---

## Sprint 3: Provider Enhancements & Polish

**Goal**: Polish provider experience — real-time earning feedback, Score page gamification, map view improvements.

### Files to modify:
1. `src/pages/provider/Performance.tsx` — Add streak tracking, zone rank, gamification elements
2. `src/pages/provider/Earnings.tsx` — Ensure combined view works well as primary money tab
3. `src/pages/provider/JobComplete.tsx` — Add earning toast after job completion ("+$32 earned" animation)

### Optional enhancements:
- Provider Score badges and streak counter
- Real-time earning animation on job completion
- Map view prominence on Jobs page

### Verification:
- Score tab shows engaging performance metrics
- Earn tab is comprehensive money center
- Job completion shows earning feedback
- `npm run build` passes
- Full walkthrough on 390×844 viewport
