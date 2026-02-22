# 02-property-profiles.md  
**Handled Home — Module 02 PRD (Expanded, Production-Ready)**  
**Platform:** Mobile-only (iOS + Android) via Capacitor  
**Backend:** Supabase (Postgres + RLS)  
**Last updated:** 2026-02-21  

> System context + constraints apply to every decision in this module.  
> Module concept source of truth for scope/intent.  

---

## 0) What this module does (and does not do)

### In scope
- Customer can **create + edit** their **primary** Property Profile (single "home" for now)
- Property Profile screen at: **`/customer/property`**
- **Zone coverage indicator** (read-only) based on entered **Zip Code**
- **Onboarding gate:** customer cannot use other customer pages until a property exists
- Mobile-first, single-column form UX with clear validation + friendly tone
- Uses existing database tables (no breaking migrations)

### Out of scope (must not be implemented here)
- Subscription purchase / billing logic
- Service Day assignment, rescheduling, or capacity enforcement
- SKU selection / bundle builder
- Provider/admin tooling beyond what's strictly required to keep customer gating coherent
- Multi-property management UI (add/switch/delete multiple homes)

---

## 1) Goals and success criteria

### Goal
Collect the minimum home details needed to operate the subscription-based "Home Operating System," without feeling like a long form.

### Success criteria (Definition of Done)
- Customer can save a property with required address fields
- Returning customer sees property **prefilled** and can update it
- Entering a zip code shows a **clear coverage indicator**:
  - "Zone: {Zone Name}" when covered
  - "Not currently serviced in this area" when not covered
- Customer route gating works:
  - No property → redirected to `/customer/property`
  - Has property → normal navigation, no loops
- UI remains mobile-only: single-column, thumb-friendly controls

---

## 2) Key user stories

### Customer
- As a customer, I can add my home address so Handled Home can serve me.
- As a customer, I can add access instructions (gate code, parking, pets) to prevent day-of-service confusion.
- As a customer, I can tell whether my zip code is currently serviced.

### Ops/support (implicit)
- As ops, property inputs should be structured enough to reduce support back-and-forth.

---

## 3) Business rules (authoritative)

### 3.1 Single primary property (MVP)
- The app behaves as if there is exactly **one** customer home.
- If multiple property rows exist (legacy/testing), the UI:
  - Loads the **most recently updated** property
  - Saves updates to that same record
  - Does **not** expose multi-property selection

### 3.2 Property required gate
- If `activeRole === customer` AND the customer has **no property record**, then:
  - Any attempt to access customer routes **redirects** to `/customer/property`
  - Exception: `/customer/property` itself (to avoid loops)

**UX note:** This should feel intentional, not like a bug:
- Add a small banner on gated entry: "Add your home details to continue."

### 3.3 Zone coverage indicator (read-only)
- When Zip Code is present and valid (5 digits):
  - Lookup zone by checking whether zip exists in zone zip list
  - Display one of:
    - **Covered:** `Zone: {zone.name}`
    - **Not covered:** `Not currently serviced in this area`
- This indicator does **not** block saving the property in Module 02.
  - (Coverage enforcement can arrive later; here it's informational.)

### 3.4 Validation rules
- Required:
  - Street Address
  - City
  - State (default "CA", editable)
  - Zip Code (exactly 5 digits)
- Inline validation:
  - Show errors next to the field (no generic "Save failed" only)
  - Zip code should accept digits only; strip spaces/dashes

---

## 4) Data model and constraints

### 4.1 Tables (assumed existing; do not redesign)
#### `properties`
Expected fields (already present in schema; use as-is):
- `id`, `user_id`
- `street_address`, `city`, `state`, `zip_code`
- Optional logistics:
  - `gate_code`
  - `access_instructions`
  - `parking_instructions`
  - `pets` (jsonb array; store as `["dog", "cat"]` etc)
  - `lot_size` (optional; keep if present but do not force in UI)
  - `notes`
- `created_at`, `updated_at`

#### `zones`
Used only for the read-only indicator:
- `name`
- `zip_codes` (text array)
- (Other capacity fields exist but are not used here)

### 4.2 Data discipline rules
- Do **not** add new tables for "property profiles"
- Do **not** add new columns unless absolutely required for this module's UI
- No breaking migrations
- Always scope property reads/writes to the current authenticated user

---

## 5) Security model (RLS + trust boundaries)

### 5.1 Trust boundaries
- Client is untrusted; all ownership rules rely on Supabase RLS
- Customer can only read/write their own property rows
- Zones are readable by authenticated users (read-only)

### 5.2 Minimum required policies (confirm, don't reinvent)
- `properties`: user can SELECT/INSERT/UPDATE where `auth.uid() = user_id`
- `zones`: authenticated can SELECT

---

## 6) UX requirements (mobile-only)

**Emotional tone:** calm, confident, supportive.  
Design should reflect "kindness in design": clear defaults, forgiving inputs, supportive errors.  

### 6.1 Visual constraints
- Single-column layout
- Large tap targets (minimum 44px height)
- Keep the form scannable:
  - Short sections
  - Helpful labels + microcopy
  - Avoid walls of text

### 6.2 Screen: Property Profile
**Route:** `/customer/property`

#### Header
- Title: "Your Home"
- Subtitle: "A few details so we can serve you smoothly."

#### Section A — Address (required)
Fields:
- Street Address (text)
- City (text)
- State (text; default "CA")
- Zip Code (numeric text, 5 digits)

Zip helper line (below the zip input):
- Loading state: "Checking coverage…"
- Covered: `Zone: {Zone Name}`
- Not covered: "Not currently serviced in this area"

#### Section B — Access & Logistics (optional)
Fields:
- Gate code (text)
- Access instructions (short textarea)
- Parking notes (short textarea)
- Pets (simple input)
  - UX: single text input with helper "Example: dog, cat"
  - Save format: split by comma → trim → lowercase (recommended)
- Anything else / notes (textarea)

#### Primary action
- Sticky bottom button preferred (mobile-friendly):
  - Label: "Save"
  - Disabled until required fields are valid
- Success:
  - Brief toast: "Home details saved"
- Failure:
  - Actionable error toast + inline field errors where applicable

#### Prefill behavior
- On load:
  - Fetch the most recently updated property for the current user
  - If found → prefill fields
  - If not found → show empty form with default state=CA

---

## 7) Backend interaction contracts (Supabase)

### 7.1 Fetch current property (latest)
- Query: `properties`
- Filter: `user_id = auth.uid()`
- Sort: `updated_at desc`
- Take: `1`

Expected UI states:
- Loading skeleton
- Empty (no property yet)
- Filled (edit mode)

### 7.2 Save behavior (safe upsert)
- If existing property `id` loaded:
  - Update that record
- Else:
  - Insert a new property with `user_id = auth.uid()`

Payload rules:
- Always write required address fields
- Optional fields: write `null` when empty (or empty string if pattern already used in codebase—pick one and be consistent)
- Pets:
  - Store as json array of strings (`["dog", "cat"]`)
  - If empty → `[]`

### 7.3 Zone lookup (read-only)
- Trigger:
  - When Zip Code is **valid (5 digits)** and changes
- Query `zones` where zip exists in `zip_codes`

Notes:
- Keep it fast:
  - Debounce zip input (e.g., 300–500ms)
  - Cancel previous requests on change
- If multiple zones match (shouldn't happen, but possible):
  - Show the first match and log a warning event (optional)

---

## 8) Customer onboarding gate (routing)

### 8.1 Gate rule
If:
- `activeRole === "customer"`
- AND property query returns **no records**
Then:
- Redirect to `/customer/property`
- Except when already on `/customer/property`

### 8.2 Where the gate should live
Centralize gating to avoid duplication:
- Option A (recommended): Extend `ProtectedRoute` to support an optional `requiresProperty` flag for customer routes
- Option B: Create `CustomerPropertyGate` wrapper used only around customer routes

Must avoid redirect loops:
- Gate must check the current pathname before redirecting

### 8.3 UX on gated redirect
On `/customer/property`, when user arrived via gate:
- Show a small dismissible banner:
  - "Add your home details to continue."

(Implement as a simple query param like `?gated=1`, or internal state—keep it minimal.)

---

## 9) Error states and edge cases

- Zip entered but zones table empty:
  - Show "Not currently serviced…" (and log event)
- User loses auth session mid-save:
  - Redirect to `/auth` and show "Please sign in again"
- Save fails due to validation:
  - Inline errors, keep user input
- Save fails due to network:
  - Toast: "Couldn't save. Check your connection and try again."
- Multiple property rows exist:
  - Load the latest updated only (no multi-property UI)
- Zip input with non-digits:
  - Strip non-digits and enforce max length 5

---

## 10) Analytics events (recommended)
Keep events lightweight and consistent:

- `property_viewed`
  - `{ mode: "create" | "edit", gated: boolean }`
- `property_saved`
  - `{ mode: "create" | "edit" }`
- `property_save_failed`
  - `{ reason: "validation" | "network" | "unknown" }`
- `zone_lookup_result`
  - `{ status: "covered" | "not_covered", zone_name?: string }`
- `customer_gated_to_property`
  - `{ from_path: string }`

---

## 11) Accessibility requirements
- Inputs have visible labels (not placeholder-only)
- Error text is associated with inputs (ARIA where applicable)
- Buttons have clear states (disabled vs enabled)
- Toasts should not be the only way errors are communicated (inline errors required)

---

## 12) Acceptance tests (manual scenarios)

1) **First-time customer flow (gate)**
- Given I am logged in as a customer with no property  
- When I navigate to `/customer` (or any customer page)  
- Then I am redirected to `/customer/property` (no loop)

2) **Create property**
- Given I am on `/customer/property` with no saved property  
- When I enter required address fields and tap Save  
- Then the property is saved and I see "Home details saved"

3) **Edit property**
- Given I already saved a property  
- When I return to `/customer/property`  
- Then fields are prefilled  
- And edits persist after saving + reloading the page

4) **Zone indicator (covered)**
- Given I enter a valid zip that exists in a zone  
- Then I see `Zone: {Zone Name}` under the zip field

5) **Zone indicator (not covered)**
- Given I enter a valid zip not in any zone  
- Then I see "Not currently serviced in this area"

6) **Gate removed after property exists**
- Given I have a saved property  
- When I navigate across customer routes  
- Then I am not redirected to `/customer/property`

7) **Mobile-only constraint**
- All layouts remain single-column and thumb-friendly; no desktop-only patterns