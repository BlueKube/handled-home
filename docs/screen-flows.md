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
- **Status Badge**: Shows "Log In" or "Sign Up" active state indicator
- **Cancel**: dismiss keyboard or close form by tapping outside
- **Explainer**: help text under Sign Up tab: "How it works — create your free account, set up your home, and choose a service plan."
- **Empty State**: "Welcome — sign in or create an account to manage your home services."
- **Validation**: Email must be valid format, password min 8 characters, confirm password must match
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
   - Row: Avatar (12×12 circle with provider initial or logo) + provider name + MapPin icon + zone name + status badge "Verified"
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
   - Explainer: "How it works — your provider continues servicing your home, managed through Handled Home's scheduling and quality platform."

**States**:
- **Loading**: Full-screen centered spinner
- **Invalid/Expired Invite**: Logo + H2 "This invitation is no longer active" + Caption "The invite link may have expired or been deactivated." + Button "Back to Home"
- **Validation**: Cadence selection required before activation
- **Empty State**: "Your provider's invitation details will appear here once the link is verified."
- **Success**: Toast "Invitation verified — complete signup to activate your service."
- **Error State**: AlertTriangle icon + "We couldn't load your provider's invitation — check the link or ask your provider to resend it."
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
   - Button (ghost, sm): "Dismiss" (close landing page) — status badge on referral code (valid/used)

5. **Fine Print**
   - Caption: "Free to join. No commitments."

**Empty State**: "Your friend's referral details will appear here once the link is verified."
**Success**: Toast "Referral verified — sign up to claim your welcome offer."
**Explainer**: help text "How it works — your friend uses Handled Home to manage their home services. Join to get your own managed experience."
**Loading**: Full-screen spinner while referral is verified
**Error State**: AlertTriangle icon + "This referral link couldn't be verified — it may have been used already. Ask your friend for a new link."

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
   - Badge (outline, capitalize): category label (e.g., "Lawn Care") — status badge showing service completion
   - Date: caption text
   - Name: "{firstName}'s home" (if available)
   - Neighborhood: caption (if available)

3. **Checklist Items**
   - Each item: CheckCircle2 icon (accent) + text

4. **CTAs** (stacked, pt-2)
   - Button (large, full-width): "Get Handled Home" + ArrowRight icon
   - Button (outline, large, full-width): "I'm a provider"

5. **Footer Logo** (centered, h-6, opacity-60)
   - Help text: "How it works — view proof of completed service and share it with anyone."
   - Button (ghost, sm): "Close" (dismiss receipt view)

**States**:
- **Loading**: Full-screen centered spinner
- **Expired**: Logo + H2 "This share has expired" + Caption "The link is no longer active." + Button "Get Handled Home"
- **Empty State**: "Your service receipt details will load shortly."
- **Success**: Toast "Receipt loaded — view the proof of completed service."
- **Error State**: AlertTriangle icon + "This receipt couldn't be loaded — the share link may be invalid or the visit was removed."

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
- Progress indicator: Step X of 8 with visual segments
- Step labels row: "Your Home · Coverage · Home Setup · Pick Plan · Subscribe · Service Day · Routine · All Set"
  - Current and prior steps: accent + medium weight
  - Future steps: muted
- Button (accent, lg, full-width): "Continue to Next Step"
- Skip option: Button (ghost, sm): "Skip to next step" (for optional steps only)

### Screen 5.2: Step 1 — Your Home (Property)

**Layout**:
- max-w-lg, centered

**Sections**:

1. **Header** (centered)
   - Home icon (accent, 40×40)
   - H2: "Tell us about your home"
   - Caption: "We need a few details to match you with the right service team." — status badge "Step 1"

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
**Empty State**: Home icon + "Tell us about your home below — we'll use this to match you with your service team."
**Explainer**: help text on Optional Details: "How it works — access details help your provider arrive prepared."
**Success**: Toast "Address saved — continuing to zone check."
**Loading**: Skeleton form fields

### Screen 5.3: Step 2 — Zone Check

**Layout**: max-w-lg, centered, text-center

**Sections**:

1. **Header**
   - MapPin icon (accent, 40×40)
   - H2: "Checking your area"
   - Caption: "Zip code: **90210**" (mono font) — status badge showing zone check progress
   - Button (ghost, sm): "Skip zone check" (optional — continues to next step without zone confirmation)

2. **Loading State**
   - Spinner + "Looking up coverage…"

3. **Covered State** (Card with accent border + accent bg tint)
   - CheckCircle icon (accent, 40×40)
   - "You're covered!"
   - "Zone: {zoneName}"
   - Animated "Continuing…" (auto-advances after 1.5s)

4. **Not Covered State** (Card with warning border + warning bg tint — empty state for zones not yet available — success shown when covered)
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
   - Caption: "What's already handled at your home? This takes about 30 seconds." — status badge "Optional"

2. **Coverage Categories** (list of rows)
   - Each row: icon (8×8 rounded-lg, accent bg tint) + category label + 4 pill buttons
   - Pill options: "Myself" | "Have one" | "None" | "N/A"
   - Selected pill: primary bg, white text. Others: gray bg.
   - Categories: Lawn, Pool, Pest, Trash, Pet Waste, Windows, Cleaning, Irrigation, Handyman

3. **CTA**
   - Button (full-width, h-12, rounded-xl): "Next: Home Size" + ArrowRight
   - Button (ghost): "Skip for now"

**Explainer**: help text "How it works — tell us what's already handled so we recommend the right services."
**Empty State**: Sparkles icon + "Select your current coverage below — we'll use this to make smarter service recommendations."
**Success**: Toast "Coverage preferences saved."
**Loading**: Skeleton rows while coverage categories load
**Error State**: "Your coverage preferences couldn't be saved — check your connection and try again."

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

3. **Progress**: Caption "X/4 fields set" — validation: all selections are optional, at least one recommended

4. **CTA**
   - Button (full-width, h-12, rounded-xl): "Continue" + ArrowRight
   - Button (ghost): "Skip for now"

**Explainer**: help text "How it works — home size helps us estimate the right service level for your property."
**Loading**: Skeleton pill rows while sizing data loads
**Success**: Toast "Home size saved."
**Error State**: "Home size details couldn't be saved — you can skip this step and update later in Settings."

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

4. **Loading**: 3 skeleton cards (h-56 each) with status badge showing "Loading plans..."
5. **Skip Option**: Button (ghost, sm): "Skip for now — browse plans later from your dashboard"

**Empty State**: Shield icon + "Your plan details will appear here once you select a membership."
**Success**: Toast "Plan selected — let's confirm your subscription."
**Error State**: "Plans couldn't be loaded — check your connection and pull down to refresh."

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
4. **Skip Option**: Button (ghost, sm): "Skip for now — subscribe when you're ready"

**Explainer**: help text "How it works — confirm your plan and we'll set up your subscription. Cancel anytime."
**Empty State**: CreditCard icon + "Your membership details will appear here once you select a plan."

**Post-Checkout State**: Spinner + H2 "Verifying your subscription…" + Caption "This usually takes just a few seconds." — status badge showing "Processing"
**Success**: Toast "Subscription confirmed — welcome to your membership."
**Error State**: "Payment failed — verify your card details and try again. No charge will apply until payment succeeds."

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
   - Status badge on recommended day: "System Recommended" (accent)

**Loading State**: Spinner + "Finding the best route day for your area…"
**Empty State**: CalendarCheck icon + "Your service day recommendation will appear here once we analyze your area."
**Success**: Toast "Service day confirmed — your routine starts next cycle."
**Error State**: "Service day assignment failed — we're having trouble matching your area. Try again or skip to set this up later."

### Screen 5.9: Step 7 — Routine

**Sections**:

1. **Header** (centered)
   - Sparkles icon (accent, 40×40)
   - H2: "Build your routine"
   - Caption: "Choose which services you'd like on your regular visits. You can always swap, add, or remove services later from your dashboard."

2. **CTAs**
   - Button (full-width): "Continue to Complete Setup"
   - Button (ghost): "Skip for now"

**Loading**: Skeleton header while routine status loads

### Screen 5.10: Step 8 — Complete

**Layout**: centered, max-w-lg

**Sections**:

1. **Success Icon**: CheckCircle (accent, 64×64)
2. **H2**: "You're all set!"
3. **Body**: "Welcome to Handled Home. Your first service day is coming up — we'll send you a reminder."
4. **CTAs** (pt-4, stacked):
   - Button (full-width): "Go to Dashboard"
   - Button (outline, full-width): "Review My Routine"
   - Skip option: You can dismiss this screen and return to dashboard

**Loading**: Skeleton success card while setup finalizes
**Explainer**: help text "How it works — your home is set up and ready. Your first service will be scheduled automatically."
**Error State**: "Your setup couldn't be finalized — but don't worry, your progress is saved. Tap below to continue."

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
- Help text: info tooltip on Handle Balance bar explaining "Handles are your included service credits each cycle."

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
    - One AI-suggested service card with Button (accent, sm): "Add to Routine"
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

**Empty State**: Home icon + "Welcome to your home dashboard — your next service and routine status will appear here once set up."
**Error State**: "Your home dashboard couldn't load — pull down to refresh. Your services are still running as scheduled."

---

# FLOW 8: Plans & Subscription

### Screen 8.1: Browse Plans

**Route**: `/customer/plans`
**Entry**: Tab bar "Plans" tab, or redirect from gated features

**Sections**:

1. **Header**
   - ChevronLeft back → previous screen (More menu or onboarding)
   - H2: "Pick your membership"
   - Body: "One simple plan — we handle the rest."

2. **Gated Alert** (conditional, if `?gated=1`)
   - Alert with Info icon: "You need an active membership to access that feature. Pick a plan to get started."

3. **Handles Explainer** (education component)

4. **Plan Cards** (stacked)
   - Each card: tier name (Essential / Plus / Premium), tier tagline, price, handles, outcome-based highlights, recommended badge, zone availability
   - Tier taglines: Essential → "The basics, handled." | Plus → "More covered, less to think about." | Premium → "Your home, fully handled." with status badge on recommended plan
   - Highlights should frame outcomes ("Recurring lawn + pest care") not line items ("2 anchor services")
   - CTA per card: Button (outline, sm): "Preview" and Button (accent, sm): "Build Routine"

5. **Footer**
   - Caption: "All plans bill every 4 weeks. Change or cancel anytime — changes take effect next cycle."

**Loading**: 3 skeleton cards
**Success**: Toast "Plan details loaded — browse and compare."
**Empty**: "No plans available at the moment."
**Error State**: "Plans couldn't be loaded right now — check your connection and try again."

### Screen 8.2: Plan Detail

**Route**: `/customer/plans/:planId`
**Entry**: "Preview" button from plan card

**Sections**:
1. **Back Button**: ChevronLeft + "Plans" (muted)
2. **Plan Hero** (name, price, tagline)
3. **Handles Callout Card**
4. **Included Services Card**
5. **Available as Extras Card**
6. **Not Available Card**
7. **Change Policy Info Card** — explainer: "How it works" section with plan change and cancellation policies, status badge showing current plan tier
8. **Bottom CTA Bar** (fixed, blur bg): Button (accent, xl, full-width): "Subscribe to This Plan"

**Empty State**: FileText icon + "Plan details will appear here once the plan data loads."
**Loading**: Skeleton hero card and service lists while plan details load
**Success**: Toast "Added to your routine builder."
**Error State**: "Plan details couldn't be loaded — go back to plans and try again."

### Screen 8.3: Subscription Management

**Route**: `/customer/subscription`

**Sections**:

1. **Header**: ChevronLeft + "Back" | H2 "Your Subscription"

2. **No Subscription State**: "No Active Subscription" + "You don't have a subscription yet — browse plans to get started." + Button (accent, lg, full-width): "Browse Plans"

3. **Active State**:
   - Fix Payment Panel (if past_due): destructive card with Button (destructive, lg): "Update Payment Method"
   - Subscription Status Panel: plan name, status badge, billing cycle, next renewal
   - Pause Panel: pause/resume controls with confirmation dialog
   - Plan Change Panel: Button (outline, lg): "Change Plan" (hidden if paused/canceling)
   - Cancellation Flow: Button (ghost, destructive): "Cancel Subscription" (hidden if paused)

**Explainer**: help text "How it works — manage your subscription, pause, or change plans. Changes take effect next cycle."
**Loading**: Skeleton status panel while subscription data loads

---

# FLOW 9: Routine Management

### Screen 9.1: Routine Builder

**Route**: `/customer/routine`
**Entry**: Tab bar "Routine" tab

**Gate**: Requires confirmed service day (shows gate screen if not confirmed)

**Sections**:

1. **Truth Banner** (sticky top info bar)
   - Shows: plan name, service weeks per cycle, service day, billing model, included credits
   - ChevronLeft back → Dashboard (for tab bar navigation context)

2. **Header**
   - H2: "Build Your Routine"
   - Caption: "Choose services and how often they happen."

3. **Entitlement Guardrails** (conditional)
   - Budget usage bar: credits used vs included vs max — progress bar with status badge
   - Button (accent, sm): "Auto-Fit" if over limit

4. **Service Items** (list of RoutineItemCards)
   - Each card: service name, level selector, cadence selector (weekly/biweekly/monthly), remove button
   - **Empty state**: Sparkles icon + "No services yet. Tap below to add your first." (or "Browse available services — subscribe when you're ready.")

5. **Routine Suggestion** (AI-suggested adjacent service)

6. **Seasonal Boosts Section** (conditional)

7. **4-Week Preview Timeline** (visual week-by-week schedule)

8. **Add Services Button** → opens AddServicesSheet — explainer on first visit: "How it works — add services, set frequency, and we'll build your schedule."

9. **Bottom CTA** (fixed above tab bar, blur bg)
   - If subscribed: "Review Routine" + ArrowRight (disabled if over limit)
   - If not subscribed: "Subscribe to continue" + ArrowRight

**Loading**: Skeleton blocks
**Success**: Toast "Service added to your routine."
**Error State**: "Your routine couldn't be loaded — pull down to refresh. Your service schedule is still active."
**Service Day Gate**: H2 "Confirm your Service Day" + "Lock in your weekly service day before building your routine." + Button "Set Service Day"

### Screen 9.2: Routine Review

**Route**: `/customer/routine/review`
**Purpose**: Review 4-week preview before confirming

**Sections**:

1. **Header**: ChevronLeft + "Back to Builder" | H2 "Review Your Routine"
2. **Service Summary Card**: list of selected services with level, cadence, and per-cycle cost
3. **4-Week Preview Timeline**: visual week-by-week schedule of upcoming visits
4. **Cost Breakdown**: included credits used, extras cost, total per cycle with help text explaining each line item — status badge showing "Within Budget" or "Over Limit"
5. **Bottom CTA** (fixed, blur bg): Button (accent, xl, full-width): "Confirm Routine"

**Empty State**: ListChecks icon + "Your routine review will appear here once you select services in the builder."
**Success**: Toast "Routine changes look good — confirm when ready."
**Loading**: Skeleton cards while routine preview generates
**Error State**: "Your routine preview couldn't be generated — go back to the builder and try again."

### Screen 9.3: Routine Confirm

**Route**: `/customer/routine/confirm`
**Purpose**: Final confirmation with effective date

**Sections**:

1. **Success Header** (centered): CheckCircle icon (success, 48×48) + H2 "Routine Confirmed"
2. **Effective Date Card**: "Your routine is effective next cycle." + next service date
3. **Back Button**: ChevronLeft + "Review" (navigate back to routine review)
4. **Summary**: services confirmed, cadence, estimated monthly cost
4. **Next Steps**: caption "Your provider will follow this routine on your service day." — explainer: "How it works — your routine repeats automatically each cycle until you change it."
5. **CTA**: Button (accent, lg, full-width): "View Your Schedule"

**Empty State**: CheckCircle icon + "Your routine confirmation details will appear here once changes are saved." — status badge showing "Pending Confirmation"
**Loading**: Spinner while routine changes are saved
**Error State**: "Your routine confirmation failed — your changes weren't saved. Go back to review and continue."

---

# FLOW 10: Service Day Management

### Screen 10.1: Service Day

**Route**: `/customer/service-day`

**Navigation**: ChevronLeft back → Schedule tab

**Success**: Toast "Service day confirmed — your schedule is all set."
**Error State**: "Service day couldn't be saved — try again or skip for now."
**Explainer**: info tooltip on recommended day explaining "How it works — we optimize routes for your neighborhood to deliver consistent, on-time service."

**States**:

1. **Loading**: Spinner + "We're matching you to the best route…"

2. **No Assignment**: Caption "Unable to generate a service day offer. Please ensure you have an active subscription."

3. **Offer Pending** (primary state):
   - ServiceDayOfferCard: shows offered day with capacity info and status badge, Button (accent, lg): "Confirm Day" / Button (outline, sm): "See Alternatives"
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
   - Navigation: ChevronLeft back to Home tab (iOS swipe-back gesture supported)

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
   - Button (ghost, sm): "Edit Routine" → `/customer/routine`

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
   - Help text: info tooltip "Your service day is optimized for route efficiency in your area."

**Success**: Toast "Schedule updated."
**Loading**: Skeleton calendar grid and placeholder visit cards
**Error State**: "Your schedule couldn't be loaded — pull down to refresh. Your service is still on track."

**Redirects**:
- `/customer/visits` → `/customer/schedule`
- `/customer/upcoming` → `/customer/schedule`

### Screen 11.2: Activity (Primary Tab)

**Route**: `/customer/activity`
**Tab**: Activity (4th tab, Clock icon)
**Purpose**: Show proof that services were done — reinforces subscription value and confirms your membership is working.

**Layout**:
- Bottom tab bar visible (Activity tab active)
- p-4, pb-24

**Sections (top to bottom)**:

1. **Header**
   - H2: "Activity"
   - Navigation: ChevronLeft back to Home tab (iOS swipe-back gesture supported)

2. **Stats Summary** (3-pill row, horizontal) with status badge on active membership
   - Shield icon: "{totalServices} services"
   - Camera icon: "{totalPhotos} photos"
   - Calendar icon: "{memberMonths} months"

3. **Value Card** (Card, accent/5 bg)
   - "Your home has received {totalServices} professional services since {joinDate}."
   - Badge: "Insured providers · Proof on every visit"
   - Help text: tooltip explaining "How it works — every visit includes a photo receipt and checklist verification."

4. **Recent Receipt Highlight** (Card, if last completed job exists)
   - Latest completed visit card with photo thumbnail
   - Service names, date, provider name
   - Button (ghost, sm): "View Receipt"
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

**Validation**: Feedback submissions require a selection before saving
**Loading**: Skeleton stat pills and timeline placeholder cards
**Error State**: "Your activity history couldn't be loaded — your home records are safe. Check your connection and try again."

**Redirects**:
- `/customer/history` → `/customer/activity`
- `/customer/timeline` → `/customer/activity`

### Screen 11.3: Visit Detail (Receipt)

**Route**: `/customer/visits/:jobId`
**Purpose**: Proof-first receipt confirming your membership value — photos and checklist before narrative

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
    - Help text: explainer "How it works — if anything looks off, report it and we'll resolve within 24 hours."

**Sheets**:
- ReportIssueSheet: structured issue reporting with reason categories
- ShareCardSheet: generate shareable receipt link

**Empty State**: Camera icon + "Your visit receipt and proof photos will appear here once the service is complete."
**Loading**: Skeleton header and photo grid placeholders
**Error State**: "Your visit receipt couldn't be loaded — your service record is still saved. Go back and try again."

### Screen 11.4: Appointment Picker

**Route**: `/customer/appointment/:visitId`
**Purpose**: Pick time window for a specific upcoming visit

---

# FLOW 12: Property Management

### Screen 12.1: Property Profile

**Route**: `/customer/property`

**Sections**:

1. **Header**
   - ChevronLeft back → More menu
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

**Validation**: Street address required, city required, state max 2 characters, zip code must be 5 digits
**Success**: Toast "Property details saved."
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

1. **Header**: ChevronLeft back → More menu | H2 "Billing"

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
   - Help text: info tooltip "Your plan bills every 4 weeks. Changes take effect next cycle."

**Success**: Toast "Payment method updated."
**Validation**: Payment method changes require card number validation before save
**Loading**: Skeleton plan card and payment method row
**Empty State**: Wallet icon + "No billing activity yet — your first invoice will appear here once your membership begins."
**Error State**: "Your billing information couldn't be loaded — your membership is still active. Try again in a moment."

### Screen 13.2: Payment Methods

**Route**: `/customer/billing/methods`
**Purpose**: Manage saved payment methods, add new cards, set default

### Screen 13.3: Billing History

**Route**: `/customer/billing/history`
**Purpose**: List of invoices with dates, amounts, status badges

**Empty State**: Receipt icon + "No invoices yet — your billing history will appear here once your membership cycle starts."
**Error State**: "Billing history couldn't be loaded — your invoices are still available. Try again in a moment."

### Screen 13.4: Receipt Detail

**Route**: `/customer/billing/receipts/:invoiceId`
**Purpose**: Individual invoice/receipt detail with line items

---

# FLOW 14: Customer Support

### Screen 14.1: Support Home

**Route**: `/customer/support`

**Sections**:

1. **Header**
   - ChevronLeft back → More menu
   - H2: "Support"
   - Caption: "Get help or resolve an issue"

2. **Resolve CTA Card** (accent border + bg tint, tappable)
   - MessageCirclePlus icon (accent, in rounded bg) + "Resolve something now" + "Get an instant resolution for most issues" + ChevronRight
   - Help text: explainer "How it works — select a recent visit, describe the issue, and we'll resolve it within 24 hours."

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

**Success**: Toast "Ticket submitted — we'll respond within 24 hours."
**Validation**: Issue resolution form requires category selection
**Loading**: Skeleton cards for resolve CTA and ticket list
**Error State**: "Your support information couldn't be loaded — we'll still respond to your open tickets. Try again."

### Screen 14.2: New Ticket

**Route**: `/customer/support/new`
**Purpose**: Structured issue submission with reason categories (not freeform chat)

**Validation**: Issue category required, description min 10 characters, visit selection required if reporting a service issue
**Error State**: "Your ticket couldn't be submitted — check your connection and try again. No duplicate will be created."

**Empty State**: MessageCirclePlus icon + "Select a visit to report an issue, or describe your concern below."

### Screen 14.3: Ticket List

**Route**: `/customer/support/tickets`
**Purpose**: Filterable list with status pills (Open | Resolved | All)

**Empty State**: Inbox icon + "No support tickets — your home is on track. If an issue comes up, we'll handle it."
**Error State**: "Tickets couldn't be loaded — your open tickets are still being tracked. Pull down to refresh."

### Screen 14.4: Ticket Detail

**Route**: `/customer/support/tickets/:ticketId`
**Purpose**: Individual ticket view with status, notes, resolution

**Empty State**: FileText icon + "No updates on this ticket yet — we'll post a resolution here once reviewed."
**Error State**: "Ticket details couldn't be loaded — go back to your tickets list and try again."

---

# FLOW 15: Customer Referrals

### Screen 15.1: Referrals Hub

**Route**: `/customer/referrals`

**Sections**:

1. **Header**: ChevronLeft back → More menu | H2 "Referrals"

2. **Share & Earn Card**
   - Users icon + "Share & Earn"
   - Description: "Invite friends and earn credits when they subscribe."
   - Referral code display: monospace code in muted bg + Copy button
   - Uses count: "X referrals used"
   - If no code: Button (accent, sm): "Generate Referral Code"

3. **Credits Summary** (2-column grid)
   - Card 1: Gift icon + earned amount + "Earned"
   - Card 2: Clock icon (amber) + pending amount + "Pending"

4. **Referral List**
   - H3: "Your Referrals"
   - Cards per referral: ID preview + status badge (Signed up, Subscribed, First visit, Paid cycle)
   - Empty: "No referrals yet. Share your code to get started!"

**Explainer**: help text "How it works — share your code, earn credits when friends subscribe, and unlock milestone rewards."
**Success**: Toast "Referral code generated — share it to start earning."
**Loading**: Skeleton share card and credit summary grid
**Error State**: "Your referral details couldn't be loaded — your earned credits are safe. Try refreshing."

---

# FLOW 16: Customer More & Settings

### Screen 16.1: More Menu

**Route**: `/customer/more`

**Sections**:

1. **Header**: H2 "More"
   - Navigation: ChevronLeft back to Home tab (swipe-back supported)

2. **Role Switcher** (conditional, if user has multiple roles)

3. **Menu Sections** (grouped cards with dividers):
   - **Account**: Plans & Subscription (CreditCard) | Property (MapPin) | Billing (Wallet)
   - **Community**: Referrals (Users) | Support (HelpCircle)
   - **Preferences**: Settings (Settings)

4. **Appearance**
   - Dark/Light mode toggle with Moon/Sun icon + Switch — validated preference saved locally

5. **Sign Out** (destructive card)
   - LogOut icon + Button (ghost, destructive): "Sign Out" with confirmation dialog

Each menu item: icon + label + ChevronRight, tappable

**Empty State**: MoreHorizontal icon + "Your account menu will appear here — manage your home, billing, and preferences." — status badge showing role
**Explainer**: help text on Role Switcher "How it works — switch between customer and provider accounts if you have both."
**Loading**: Skeleton menu rows
**Error State**: "Menu couldn't load — try closing and reopening the app."
**Note**: "Plans & Subscription" replaces the former Plans primary tab. It links to `/customer/plans` which serves as both plan browsing (for new/upgrading customers) and subscription management (for active subscribers).

### Screen 16.2: Account Settings

**Route**: `/customer/settings`

**Sections**:

1. **Header**: ChevronLeft back → More menu | H2 "Account Settings"

2. **Avatar + Email**
   - Avatar circle (14×14) with initials, accent bg
   - Mail icon + email address

3. **Profile Form**: Full name, phone (editable)
4. **Change Password Form**: Current + new password
5. **Notification Preferences**: Toggle switches
6. **Role Switcher** (if multi-role)
7. **Preview As Card** (dev/admin tool)
8. **Sign Out Button** (destructive, full-width): LogOut icon + "Sign Out"

**Loading**: Skeleton profile form while account data loads
**Validation**: Full name required, phone must be valid, new password min 8 characters
**Success**: Toast "Settings updated."
**Explainer**: info tooltip on Change Password — "Your password must be at least 8 characters."

### Screen 16.3: Notification Inbox

**Route**: `/customer/notifications`
**Purpose**: Chronological notification list (shared component across all roles)

**Empty State**: Bell icon + "No notifications yet — we'll let you know when there's activity on your home."
**Error State**: "Notifications couldn't be loaded — you'll still receive push alerts. Pull down to refresh."

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
   - Validation: code required, format HANDLED-XXXX pattern
   - Button (full-width): "Verify Code" + ChevronRight
   - Status badge on input showing code format status
   - Button (ghost, sm): "Skip — I'll enter my code later"

**Empty State**: Shield icon + "Enter your invite code above to begin your provider application."
**States**:
- **Loading org**: Full-screen spinner
- **Active org**: Redirects to dashboard
- **Suspended**: AlertTriangle icon (destructive) + H2 "Account Suspended" + "Please contact support" + Button "Contact Support"
- **Pending Review**: Clock icon + H2 "Under Review" + Submission date + Checklist (all checkmarks + warning for missing docs) + "We'll notify you"
- **Draft (Resume)**: Shield icon + H2 "Continue Your Application" + Button "Continue Application" (navigates to next incomplete step)

### Screen 17.2: Step 1 — Organization Setup

**Route**: `/provider/onboarding/org`
**Purpose**: Enter your business details so we can set up your provider profile

**Sections**:

1. **Progress Indicator**: ArrowLeft back + Step 1 of 6 progress bar (accent fill)
2. **Header**: H2 "Your Business Details"
3. **Form Fields**: Business name (required), phone (required, validated), zip code (required, 5-digit pattern), website (optional) — tooltip on zip code: "We use this to match you with nearby service zones."
4. **Skip Option**: Button (ghost, sm): "Skip for now — complete later in Settings"
5. **Bottom CTA**: Button (accent, xl, full-width): "Save and Continue"

**Empty State**: Building2 icon + "Enter your business details below — we'll use this to set up your provider profile."
**Success**: Toast "Business details saved — continuing to next step."
**Loading**: Skeleton form fields while profile data loads
**Error State**: "Unable to save your details — check your connection and try again."

### Screen 17.3: Step 2 — Coverage Zones

**Route**: `/provider/onboarding/coverage`
**Purpose**: Select which zones to operate in (from allowed zones)

**Sections**:

1. **Progress Indicator**: ArrowLeft back + Step 2 of 6 progress bar
2. **Header**: H2 "Select Your Coverage Zones"
3. **Zone Map**: interactive map with selectable hex zones
4. **Selected Zones List**: badges showing chosen zones with remove option
5. **Help Text**: "Choose zones near you for better route density and shorter drive times."
6. **Skip Option**: Button (ghost, sm): "Skip for now"
7. **Bottom CTA**: Button (accent, xl, full-width): "Save and Continue"

**Success**: Toast "Coverage zones saved."
**Error State**: "Zone selection couldn't be saved — check your connection and try again."
**Loading**: Skeleton shimmer while zones load
**Empty State**: MapPin icon + "No zones available in your area yet. We'll notify you when your region opens."

### Screen 17.4: Step 3 — Capabilities

**Route**: `/provider/onboarding/capabilities`
**Purpose**: Select service categories (lawn care, landscaping, etc.)

**Sections**:

1. **Progress Indicator**: ArrowLeft back + Step 3 of 6 progress bar
2. **Header**: H2 "What Services Do You Offer?"
3. **Service Category Grid**: checkable cards — Lawn Care, Landscaping, Pool, Pest Control, etc.
4. **Explainer**: info tooltip "Select all categories your team can handle. You can update these anytime."
5. **Skip Option**: Button (ghost, sm): "Skip for now"
6. **Bottom CTA**: Button (accent, xl, full-width): "Save and Continue"

**Empty State**: Wrench icon + "Select the service categories your team can handle — you can update these anytime."
**Success**: Toast "Service capabilities saved."
**Error State**: "Capabilities couldn't be saved — check your connection and try again."
**Loading**: Skeleton category grid while service options load

### Screen 17.5: Step 4 — Compliance

**Route**: `/provider/onboarding/compliance`
**Purpose**: Terms acceptance, insurance + tax document upload

**Sections**:

1. **Progress Indicator**: ArrowLeft back + Step 4 of 6 progress bar
2. **Header**: H2 "Compliance Documents"
3. **Insurance Upload**: file upload card — "Upload proof of general liability insurance" with accepted formats note
4. **Tax Document Upload**: file upload card — "Upload W-9 or equivalent tax form"
5. **Validation**: required markers on both uploads, max file size 10MB
6. **Skip Option**: Button (ghost, sm): "Skip for now — required before first job"
7. **Bottom CTA**: Button (accent, xl, full-width): "Save and Continue"

**Empty State**: Upload icon + "Upload your compliance documents below — we'll keep them securely on file."
**Success**: Toast "Documents uploaded — continuing to agreement."
**Explainer**: info tooltip "How it works — upload your documents once and we'll keep them on file."
**Loading**: Skeleton upload cards while compliance status loads
**Error State**: "Upload failed — check your file size (max 10MB) and try again."

### Screen 17.6: Step 5 — Agreement

**Route**: `/provider/onboarding/agreement`
**Purpose**: Read and accept service agreement

**Sections**:

1. **Progress Indicator**: ArrowLeft back + Step 5 of 6 progress bar
2. **Header**: H2 "Service Agreement"
3. **Agreement Text**: scrollable card with full agreement text
4. **Acceptance Checkbox**: "I have read and agree to the Handled service provider agreement" — help text: "This agreement covers service standards, payout terms, and quality expectations."
5. **Bottom CTA**: Button (accent, xl, full-width): "Accept and Continue" (disabled until checkbox checked)

**Empty State**: FileText icon + "Your service agreement will load below — read through before accepting."
**Success**: Toast "Agreement accepted."
**Error State**: "Agreement couldn't be loaded — check your connection and refresh."
**Loading**: Skeleton text block while agreement loads

### Screen 17.7: Step 6 — Review

**Route**: `/provider/onboarding/review`
**Purpose**: Final review of all submitted information before submission

**Sections**:

1. **Progress Indicator**: ArrowLeft back + Step 6 of 6 progress bar (complete)
2. **Header**: H2 "Review Your Application"
3. **Business Details Card**: summary of org info with Edit button (ghost)
4. **Coverage Card**: selected zones summary with Edit button (ghost)
5. **Capabilities Card**: selected services with Edit button (ghost)
6. **Compliance Card**: uploaded documents status with Edit button (ghost)
7. **Agreement Card**: acceptance status (CheckCircle icon)
8. **Bottom CTA**: Button (accent, xl, full-width): "Submit Application"

**Validation**: All required steps must be completed before submission
**Error State**: "Application submission failed — your data is saved. Check your connection and try again."
**Empty State**: ClipboardCheck icon + "Your application summary will appear here once all steps are complete."
**Explainer**: help text "How it works — review all your details before submitting. You can edit any section."
**Loading**: Skeleton summary cards while application data loads
**Success Feedback**: Toast "Application submitted — we'll review within 2 business days."

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

2. **Notification Banners** (SLA alerts, compliance warnings) — each dismissible with X button

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
   - Empty: MapPin icon + "No jobs scheduled for today" + "Your next assignment will appear here when ready."

10. **Daily Recap Card** (`DailyRecapCard`, added Batch 1)
    - Shows end-of-day summary: jobs completed, total earnings, avg per job
    - Only visible after provider has completed at least one job today

11. **Coming Up**
    - H3: "Coming Up"
    - Card with upcoming 3 jobs: CalendarDays icon + address + date + service count

**Explainer**: help text on Stats Grid — "How it works — your daily stats update in real time as you complete jobs."
**Loading**: Skeleton greeting, stat grid placeholders, and job card shimmers
**Error State**: "Your dashboard couldn't load — pull down to refresh. Your route and jobs are on track."

---

# FLOW 19: Provider Job Execution

### Screen 19.1: Job List

**Route**: `/provider/jobs`

**Sections**:
1. **Header**: H2 "Your Jobs" (ChevronLeft back to Dashboard from deep links)
2. **Tabs**: Today | This Week | All
3. **Today's Loadout Summary**: total stops, estimated minutes, status badge showing completion
4. **Day Plan Summary**: overview of today's route
5. **Job Cards** (repeating): rank, address, services, status badge, duration, reorder buttons — tap to open job
6. **Map/List View Toggle**: segmented control
7. **Route Optimization Button**: Button (outline, sm): "Optimize Route" — tooltip: "How it works — reorders your stops for the shortest drive time."
8. **Week Due Queue**: upcoming jobs preview
9. **Primary CTA**: Button (accent, lg, full-width): "Start Next Job" (navigates to first incomplete job)

**Loading**: Skeleton cards while jobs load
**Error State**: "Your job list couldn't load — pull down to refresh. Your route is unaffected."
**Empty State**: Briefcase icon + "No jobs scheduled for today — your next assignment will appear here once dispatched. Ready when you are."

### Screen 19.2: Job Detail

**Route**: `/provider/jobs/:jobId`
**Purpose**: Full job info — property details, checklist, photos required, navigation

**Sections**:
1. **Back Button**: ChevronLeft + "Jobs" (muted)
2. **Queue Breadcrumb**: "Stop X of Y today" with prev/next navigation arrows (ChevronLeft/ChevronRight)
3. **Property Details Card**: address, gate code, dog alert, parking notes
4. **SKU Checklist**: items with proof-required indicators and status badges
5. **Report Issue**: Button (outline, sm): "Report Issue" — opens action sheet with help text "How it works — report access issues, hazards, or problems and we'll help resolve them."
6. **Sticky Action Bar** (fixed bottom-16, pb-48): Button (accent, xl, full-width): "Start Job" / "View Checklist" / "Complete Job" (changes based on job status)

**Empty State**: Briefcase icon + "Job details will appear here once the assignment is loaded."
**Loading**: Skeleton shimmer while job details load
**Error State**: "Unable to load job details — pull down to refresh or go back to your job list."

### Screen 19.3: Job Checklist

**Route**: `/provider/jobs/:jobId/checklist`
**Purpose**: Complete checklist items one by one (guided, one action at a time)

**Sections**:
1. **Back Button**: ChevronLeft + "Job Detail"
2. **Progress Counter**: "Item X of Y" with progress bar — explainer on first use: "How it works — complete each item, then mark it done to continue."
3. **Current Task Card**: service name, task description, proof-required badge if applicable
4. **Action Area**: checkbox or toggle to mark item complete
5. **Bottom CTA**: Button (accent, xl, full-width): "Mark Complete and Continue" / "Finish Checklist" (on last item)

**Empty State**: ClipboardList icon + "Your checklist items will appear here once the job data loads."
**Loading**: Skeleton while checklist loads
**Error State**: "Checklist failed to load — go back and try again."

### Screen 19.4: Job Photos

**Route**: `/provider/jobs/:jobId/photos`
**Purpose**: Upload required before/after photos per SKU

**Sections**:
1. **Back Button**: ChevronLeft + "Checklist"
2. **Header**: H2 "Upload Photos"
3. **Required Photos Grid**: cards per SKU showing before/after slots, Camera icon tap to capture — help text: "How it works — take clear before and after photos for each service as proof of work."
4. **Upload Progress**: progress bar per photo during upload
5. **Validation**: required markers on mandatory photos
6. **Bottom CTA**: Button (accent, xl, full-width): "Submit Photos and Complete"

**Empty State**: Camera icon + "Your required photos will appear here once the job's proof requirements load."
**Loading**: Skeleton photo grid while required photos load
**Error State**: "Photo upload failed — check your connection and retry."

### Screen 19.5: Job Complete

**Route**: `/provider/jobs/:jobId/complete`
**Purpose**: Confirmation and celebration screen after marking job complete

**Sections**:
1. **Back Button**: ChevronLeft + "Jobs" (return to job list)
2. **Celebration Header**: PartyPopper icon (48×48) + H2 "Job Complete!"
2. **Earnings Display**: base pay + modifier breakdown with `formatCents` utility
3. **Route Progress Bar**: segmented stops showing completed vs remaining, trophy when all done
4. **Level Sufficiency Form**: quality feedback form (LevelSufficiencyForm) — explainer: "How it works — rate if the service level was sufficient for this property."
5. **Notes**: Textarea for optional completion notes (max 500 characters validated)
6. **Next Stop CTA**: Button (accent, xl, full-width): "Continue to Next Stop" / "View Your Earnings" (if day complete)
7. **Day Complete State**: Trophy card + "All stops finished — great work today!" when all jobs done

**Empty State**: PartyPopper icon + "Your earnings and completion details will appear here once the job is submitted."
**Loading**: Spinner while job completion is processed
**Error State**: "Job completion couldn't be saved — your work is recorded locally. Try submitting again."

---

# FLOW 20: Provider BYOC Center

### Screen 20.1: BYOC Center

**Route**: `/provider/byoc`

**Sections**:

1. **Header**
   - ChevronLeft back → More menu
   - H2: "BYOC Center" + Caption: "Bring Your Own Customers" — status badge showing link count
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
**Explainer**: help text "How it works — create invite links, share with your existing customers, and earn bonuses when they join."
**Success**: Toast "Invite link created — share it with your customers."
**Loading**: Skeleton stats grid and link cards
**Error State**: "Your BYOC data couldn't be loaded — your invite links are still active. Pull down to refresh."

### Screen 20.2: Create BYOC Link

**Route**: `/provider/byoc/create-link`
**Purpose**: Form to create new invite link (select category, zone, cadence)

**Header**: ChevronLeft back → `/provider/byoc` | H2 "Create Invite Link" | Caption "Generate a link for your existing customers"

**Validation**: Category required, zone required — cadence defaults to service standard
**Empty State**: Link2 icon + "Fill in the details below to generate your first invite link."
**Error State**: "Link couldn't be created — check your connection and try again."

---

# FLOW 21: Provider Earnings & Payouts

### Screen 21.1: Earnings Dashboard

**Route**: `/provider/earnings`

**Sections**:

1. **Header**: ChevronLeft back → Earn tab | H2 "Earnings" + Caption "Track your earnings and payouts"

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
   - PauseCircle (warning): "Payout account not set up" + Button (accent, sm): "Set Up Payout Account"

6. **Earnings/Payouts Tabs**
   - Tab "Earnings": Earning cards with address, date, status badge, base/modifier/net breakdown (expandable)
     - **Modifier explanation labels** (added Batch 1): Each modifier shows a human-readable reason ("Quality tier bonus", "Rush / high-demand bonus", "Adjustment — issue reported")
     - **Expandable earning cards**: Tap to expand and see full base + modifier + net breakdown
   - Tab "Payouts": Payout cards with date, status badge, amount
   - All payout amounts are per-job, set by SKU + Level + zone. Providers never see customer pricing.

7. **Held Earnings Detail** (added Batch 1)
   - Expandable section showing held earnings with hold reason labels, info tooltip: "How it works — earnings are held briefly for quality review, then released to your payout account."
   - Hold reasons: "New provider review period", "Under review — service issue reported", "Payout account setup required"
   - Estimated release timeline when available

**Empty (earnings)**: DollarSign icon + "No earnings for this period" + "Complete jobs to start earning"
**Empty (payouts)**: Banknote icon + "No payouts yet"

**Loading**: Skeleton stats grid and earnings card placeholders
**Error State**: "Your earnings data couldn't be loaded — your payouts are on track. Pull down to refresh."
**Design note**: Provider earnings screens should reinforce the value of predictable, guaranteed payouts and denser routes — the core provider value prop. See `operating-model.md` → Provider Payout Logic.

---

# FLOW 22: Provider Performance & Quality

### Screen 22.1: Quality Score

**Route**: `/provider/quality` or `/provider/performance`
**Purpose**: Quality rating breakdown, feedback summary, performance metrics

**Validation**: Feedback form requires rating before submission
**Empty State**: Star icon + "Your score will appear after your first three completed jobs. We'll track your performance automatically."
**Error State**: "Quality score couldn't be loaded — your rating is unaffected. Pull down to refresh."

### Screen 22.2: Insights

**Route**: `/provider/insights`
**Purpose**: Business insights and growth recommendations

**Empty State**: Lightbulb icon + "Your insights will appear here once we have enough job data to spot trends. Continue completing jobs."
**Error State**: "Insights couldn't be generated right now — check back after your next completed job."

### Screen 22.3: Insights History

**Route**: `/provider/insights/history`
**Purpose**: Historical insights archive

**Empty State**: Archive icon + "No past insights yet — your historical trends will build here over time."
**Error State**: "Insights history couldn't be loaded — try again in a moment."

---

# FLOW 23: Provider Organization & Setup

### Screen 23.1: Organization

**Route**: `/provider/organization`
**Purpose**: Business profile — name, phone, website, team members

**Header**: ChevronLeft back → `/provider/settings` | H2 "Organization" | Caption "Manage your team and organization details"

**Sections**: Org profile card, team members list, compliance status

**States**: Loading skeleton | Error (QueryErrorCard) | No org (empty state with Building2 icon) | Populated

### Screen 23.2: Coverage

**Route**: `/provider/coverage`
**Purpose**: Zone map and capacity assignments

**Header**: ChevronLeft back → `/provider/settings` | H2 "Coverage & Capacity" | Caption "Your zones, availability, and service capabilities"

**Sections**: Zone selection tabs, availability section, SKU capabilities

**Empty State**: Map icon + "No zones selected yet — browse available zones near you to start receiving managed jobs."
**Error State**: "Coverage zones couldn't be loaded — your current zones are still active. Try refreshing."

### Screen 23.3: Authorized SKUs

**Route**: `/provider/skus`
**Purpose**: Services this provider is authorized to perform

**Header**: H2 "Service Catalog" (no back nav — accessible from tab flow)

**Sections**: Search input (validated — min 2 characters), category-grouped SKU cards with detail sheet

**Empty State**: ClipboardList icon + "No authorized services yet — complete onboarding to unlock your service catalog."
**Error State**: "Service catalog couldn't be loaded — check your connection and try again."

### Screen 23.4: Work Setup

**Route**: `/provider/work-setup`
**Purpose**: Working hours, availability preferences

**Header**: ChevronLeft back → `/provider/coverage` | H2 "Work Setup" | Caption "Help us build efficient routes for your area"

**Sections**: 3-step wizard (Location → Services → Schedule)

**Empty State**: Settings icon + "No work preferences set yet — configure your location, services, and schedule."
**Error State**: "Work setup preferences couldn't be saved — check your connection and try again."

### Screen 23.5: Availability

**Route**: `/provider/availability`
**Purpose**: Schedule availability calendar

**Header**: ChevronLeft back → `/provider/coverage` | H2 "Availability" | Caption "Manage your schedule and blocked windows"

**Sections**: Weekly schedule grid, blocked windows list with add/delete

**Empty State**: Calendar icon + "No availability windows set — add your schedule to start receiving automatic job assignments."
**Error State**: "Availability schedule couldn't be loaded — your current availability is unchanged. Try refreshing."

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

**Validation**: Appearance toggle validated before save
**Empty State**: MoreHorizontal icon + "Your menu will load shortly — if this persists, restart the app."
**Error State**: "Menu couldn't be loaded — try closing and reopening the app."

### Screen 24.2: Provider Settings

**Route**: `/provider/settings`
**Purpose**: Account settings, notification preferences (same pattern as customer settings)

**Header**: H2 "Account Settings" (no back nav — top-level More menu destination)

**Empty State**: Settings icon + "Your account settings will appear once your profile is fully set up."
**Error State**: "Settings couldn't be loaded — your preferences are unchanged. Try again."

### Screen 24.3: Provider Support

**Route**: `/provider/support`
**Purpose**: Support tickets for providers

**Header**: H2 "Support" | Caption "Claims and disputes involving your jobs" (no back nav — top-level More menu destination)

**Validation**: Ticket submissions require category and description (min 10 characters)
**Empty State**: HelpCircle icon + "No support tickets — if a job issue comes up, we'll help you resolve it here."
**Error State**: "Support tickets couldn't be loaded — your open tickets are unaffected. Pull down to refresh."

### Screen 24.3.1: Support Ticket Detail

**Route**: `/provider/support/tickets/:ticketId`
**Purpose**: Individual ticket detail with actions

**Header**: ChevronLeft back → `/provider/support` | H2 "Support Ticket"

**Sections**: Status chip + date, ticket subject, timeline/events, statement form, review request form

### Screen 24.4: Provider Referrals

**Route**: `/provider/referrals`
**Purpose**: Provider referral program + customer invites

**Header**: H2 "Growth Hub" (page title)

**Empty State**: Users icon + "No referral activity yet — share your link and you'll earn bonuses when your referrals join."
**Error State**: "Referral data couldn't be loaded — your referral credits are safe. Try refreshing."

---

# FLOW 25: Admin Dashboard & Ops

### Screen 25.1: Admin Dashboard

**Route**: `/admin`
**Layout**: Sidebar navigation (AdminShell), not bottom tabs
**Purpose**: Overview metrics — active subscriptions, jobs today, provider count, revenue

**Empty State**: BarChart3 icon + "No data yet — metrics will populate as customers and providers onboard."
**Error State**: "Dashboard metrics couldn't be loaded — data may be stale. Refresh to see latest numbers."

### Screen 25.2: Ops Cockpit

**Route**: `/admin/ops`
**Purpose**: Real-time operational health dashboard with drill-down links

### Screen 25.3: Zone Health

**Route**: `/admin/ops/zones`
**Purpose**: Zone-by-zone capacity, provider coverage, service day distribution

**Empty State**: Map icon + "No zones configured — create zones in the Zone Builder to see health metrics."
**Error State**: "Zone health data couldn't be loaded — check the database connection and retry."

### Screen 25.4: Zone Detail

**Route**: `/admin/ops/zones/:zoneId`

### Screen 25.5: Jobs & Proof Health

**Route**: `/admin/ops/jobs`
**Purpose**: Active/completed/failed jobs metrics

**Empty State**: Briefcase icon + "No job activity recorded yet — metrics will appear once jobs are dispatched."

### Screen 25.6: Billing Health

**Route**: `/admin/ops/billing`
**Purpose**: Payment success rates, failed payments, revenue metrics

### Screen 25.7: Growth Health

**Route**: `/admin/ops/growth`
**Purpose**: Signup funnel, BYOC activations, referral conversion

**Empty State**: TrendingUp icon + "No growth events recorded yet — metrics will appear as signups and activations come in."
**Error State**: "Growth metrics failed to load — analytics pipeline may be delayed. Try again in a few minutes."

### Screen 25.8: Support Health

**Route**: `/admin/ops/support`
**Purpose**: Ticket volume, resolution time, SLA compliance

**Empty State**: HeadphonesIcon + "No support tickets yet — SLA metrics will appear once tickets are created."
**Error State**: "Support health data couldn't be loaded — check the analytics service and retry."

---

# FLOW 26: Admin Provider Management

### Screen 26.1: Provider List

**Route**: `/admin/providers`
**Purpose**: Searchable, filterable provider directory

**Empty State**: Users icon + "No providers onboarded yet — approved applications will appear here."
**Error State**: "Provider list failed to load — try refreshing or narrow your search filters."

### Screen 26.2: Provider Detail

**Route**: `/admin/providers/:id`
**Purpose**: Full provider profile — org info, coverage, capabilities, quality, earnings

**Empty State**: User icon + "Provider profile is loading — details will appear once the provider record is fetched."
**Error State**: "Provider profile couldn't be loaded — the provider record may be incomplete. Go back and try again."

### Screen 26.3: Application Queue

**Route**: `/admin/providers/applications`
**Purpose**: Pending provider applications for review

**Empty State**: FileStack icon + "No pending applications — new submissions will appear here for review."
**Error State**: "Application queue failed to load — pending applications are not lost. Refresh to retry."

### Screen 26.4: Application Detail

**Route**: `/admin/providers/applications/:id`
**Purpose**: Individual application review with approve/reject actions

**Empty State**: FileText icon + "Application details will appear here once the record is loaded."
**Error State**: "Application details couldn't be loaded — go back to the queue and try again."

---

# FLOW 27: Admin Service Configuration

### Screen 27.1: Regions & Zones

**Route**: `/admin/zones`
**Purpose**: Create/edit zones, assign zip codes

### Screen 27.2: Zone Builder

**Route**: `/admin/zones/builder`
**Purpose**: Map-based zone creation tool

### Screen 27.3: SKU Catalog

**Route**: `/admin/skus`
**Purpose**: Service type definitions — names, durations, levels, checklist templates

**Empty State**: Package icon + "No service types defined yet — add SKUs to start building the catalog."
**Error State**: "SKU catalog failed to load — existing service definitions are unaffected. Retry to see latest changes."

### Screen 27.4: Subscription Plans

**Route**: `/admin/plans`
**Purpose**: Subscription plan configuration — pricing, handles, zone availability

### Screen 27.5: Bundles / Routines

**Route**: `/admin/bundles`
**Purpose**: Service bundle configuration

### Screen 27.6: Service Days

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

**Empty State**: Briefcase icon + "No jobs match your filters — try adjusting the date range or status filter."
**Error State**: "Job list failed to load — try narrowing your date range or filters."

### Screen 28.2: Job Detail

**Route**: `/admin/jobs/:jobId`
**Purpose**: Full job view with admin actions

**Empty State**: Briefcase icon + "Job details will load once the record is fetched."
**Error State**: "Job record couldn't be loaded — the job ID may be invalid. Go back to the job list."

### Screen 28.3: Exception Queue

**Route**: `/admin/exceptions`
**Purpose**: Severity-sorted exception queue (failed payments, missed jobs, provider issues)

**Empty State**: CheckCircle icon + "No active exceptions — all jobs and payments are on track."

### Screen 28.4: Exception Analytics

**Route**: `/admin/ops/exception-analytics`
**Purpose**: Exception patterns and trends

### Screen 28.5: Dispatcher Queues

**Route**: `/admin/ops/dispatch`
**Purpose**: Job dispatch management

**Empty State**: Truck icon + "No pending dispatches — all jobs are currently assigned."
**Error State**: "Dispatch queues failed to load — active dispatches are still running. Check the scheduler service."

---

# FLOW 29: Admin Billing & Payouts

### Screen 29.1: Billing Overview

**Route**: `/admin/billing`
**Purpose**: Revenue overview, subscription status distribution

### Screen 29.2: Customer Ledger

**Route**: `/admin/billing/customers/:customerId`
**Purpose**: Individual customer financial history — invoices, credits, payments

**Empty State**: Receipt icon + "No financial activity for this customer yet — transactions will appear after their first billing cycle."
**Error State**: "Customer ledger couldn't be loaded — check the customer ID or billing service status."

### Screen 29.3: Payout Overview

**Route**: `/admin/payouts`
**Purpose**: Provider payout status, pending amounts, payout schedule

**Empty State**: Banknote icon + "No payouts processed yet — your provider payouts will appear here once your first earnings cycle completes."
**Error State**: "Payout overview failed to load — scheduled payouts are unaffected. Retry to see current status."

### Screen 29.4: Provider Ledger

**Route**: `/admin/payouts/providers/:providerOrgId`
**Purpose**: Individual provider earnings history — earnings, holds, payouts

**Empty State**: DollarSign icon + "No earnings recorded for this provider yet — activity will appear after their first job."
**Error State**: "Provider ledger couldn't be loaded — check the provider ID or try again."

### Screen 29.5: Pricing Control

**Route**: `/admin/control/pricing`
**Purpose**: System-wide pricing configuration

### Screen 29.6: Payout Control

**Route**: `/admin/control/payouts`
**Purpose**: Payout frequency, hold policies, minimum thresholds

**Empty State**: Sliders icon + "No payout policies configured — set up frequency and hold rules to start."
**Error State**: "Payout control settings couldn't be loaded — current policies remain in effect. Retry."

---

# FLOW 30: Admin Support & Growth

### Screen 30.1: Support Console

**Route**: `/admin/support`
**Purpose**: All support tickets with filters, assignment, bulk actions

**Empty State**: MessageSquare icon + "No support tickets in queue — all current issues have been taken care of."
**Error State**: "Support console couldn't be loaded — open tickets are still being tracked. Refresh to retry."

### Screen 30.2: Support Ticket Detail

**Route**: `/admin/support/tickets/:ticketId`
**Purpose**: Full ticket view with admin resolution tools

**Empty State**: MessageCircle icon + "Ticket details will appear once the record is loaded."
**Error State**: "Ticket details failed to load — the ticket may have been merged or deleted. Go back to the console."

### Screen 30.3: Support Policies

**Route**: `/admin/support/policies`
**Purpose**: Auto-resolution rules, SLA targets, escalation paths

### Screen 30.4: Response Macros

**Route**: `/admin/support/macros`
**Purpose**: Pre-written support response templates

### Screen 30.5: Growth Console

**Route**: `/admin/growth`
**Purpose**: Viral loop metrics, BYOC performance, referral conversion

**Empty State**: Rocket icon + "No growth events yet — your signups, BYOC activations, and referral conversions will appear here."
**Validation**: Date range filters required for analytics queries
**Error State**: "Growth data couldn't be loaded — analytics pipeline may be delayed. Check back shortly."

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

**Validation**: Program configuration requires name, type, and reward amount
**Empty State**: Gift icon + "No incentive programs configured — create referral or BYOC bonus rules to get started."
**Error State**: "Incentive program data couldn't be loaded — active programs are still running. Retry."

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

**CTA**: Button (accent, sm): "View Your Plan"
**Empty State**: PiggyBank icon + "Your savings breakdown will appear based on your selected plan."
**Error State**: "Savings calculation couldn't be loaded — your plan pricing is unaffected."
**Success**: Toast "Savings breakdown loaded — see how your membership compares."
**Loading**: Skeleton savings rows
**Dismiss**: X button to dismiss card

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
5. **Primary CTA**: Button (default, lg, full-width): "View Your Receipt" (ArrowRight icon)
6. **Secondary CTA**: Button (outline, lg, full-width): "Share the News" (Share2 icon)
7. **Dismiss**: Button (ghost, sm): "Continue to Dashboard"

**Trigger**: Once only (localStorage flag). Shown when `lastCompletedJob` exists and flag not set.

**Explainer**: help text "How it works — we celebrate your first completed service with a recap and proof-of-work receipt." — status badge showing "First Service"
**Empty State**: PartyPopper icon + "Your celebration will appear once your first service completes."
**Loading**: Shimmer animation on celebration icon and cards
**Error State**: "Celebration details couldn't load — you can view your receipt from the Activity tab."

---

# FLOW 33: Home Timeline

**Route**: `/customer/timeline`
**Who**: Customer
**Purpose**: Chronological service history confirming your subscription value and membership benefits

### Screen 33.1: Home Timeline Page

**Purpose**: Confirm your subscription value with a chronological service history and membership proof
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
5. **Bottom CTA**: Button (outline, lg): "View All Photos" (Camera icon) — back/dismiss navigation available

**Empty state**: Calendar icon + "No completed services yet" + subtext

**Explainer**: help text "How it works — your timeline shows every service completed on your home, with proof photos and verification." — status badge showing member duration
**Loading**: Skeleton stat row and timeline group placeholders
**Error State**: "Your home timeline couldn't be loaded — your service history is still safely stored. Pull down to refresh."

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

**Empty State**: Target icon + "Your earnings projection will appear once you have enough job history."
**Error State**: "Earnings projection temporarily unavailable — your earnings are unaffected."

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

**Empty State**: TrendingUp icon + "Your earnings potential will appear once we have zone data for your area."
**Error State**: "Earnings estimate couldn't be calculated — complete a few more jobs and we'll generate your projection."

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
**Purpose**: Reduce cold-funnel fear during onboarding with trust signals

### Screen 36.1: Trust Bar

**Purpose**: Onboarding social proof to confirm your membership guarantees
**Validation**: Trust signals validated from active provider network data
**Layout**:
- Horizontal flex, centered, py-2.5 px-3, bg-muted/50 rounded-xl
- 3 items separated by 12px-tall vertical dividers (bg-border)

**Items**:
1. Shield icon (primary) + "Insured providers"
2. Clock icon (accent) + "Satisfaction guarantee"
3. XCircle icon (muted) + "Cancel anytime"

**Typography**: 12px, muted-foreground

**Empty State**: Shield icon + "Your coverage guarantees will appear here."
**Error State**: "Trust information couldn't be loaded — your coverage guarantees are still in effect."

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

**CTA**: Button (accent, sm): "Share Your Code" — dismiss option to close card
**Success**: Toast "Code shared — you'll earn credits when your friend subscribes."
**Empty State**: Target icon + "Your milestone progress will appear here once you start referring friends."
**Loading**: Skeleton progress bar and tier grid placeholders
**Error State**: "Milestone progress couldn't be loaded — your referral credits are safe. Try refreshing."

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
