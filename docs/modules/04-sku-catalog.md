# Module 04: SKU Catalog (Services Library)
**Handled Home — PRD (Standardized Service Definitions, Pricing Flexible)**  
**Customer + Provider:** Mobile-only  
**Admin Console:** Mobile-optimized, operationally usable  
**Primary Admin Route:** `/admin/skus` (or `/admin/catalog` if already used in repo)  
**Last updated:** 2026-02-21  

> **This module intentionally keeps pricing flexible.** SKUs define *what* a service is and *how it’s executed*. Tier pricing and “services allowed” logic comes later.

---

## 0) Why this module exists

Handled Home only works if services are:
- Consistent
- Predictable
- Auditable (photos + scope)
- Easy to scale across zones and providers

The SKU Catalog is the **single source of truth** for:
- What a service is
- What’s included/excluded
- How long it takes
- How it can be fulfilled (timing rules)
- What proof is required (photos)
- What “done” means (checklists)

This module creates the catalog and governance layer.  
It does **not** implement subscription selection or tier pricing (Module 05+).

---

## 1) Core intent (how this should feel)

### Admin should feel
> “I can define a service once and trust it everywhere.”

### Customers should feel
> “This is clear. I know what I’m getting.”

### Providers should feel
> “I can execute this without guessing.”

### Product qualities
- Clear scope boundaries
- Operationally enforceable requirements
- Minimal ambiguity
- Built for scanning

---

## 2) Scope

### In scope (Module 04 delivers)
- Admin CRUD of **Service SKUs**
- Structured scope:
  - Inclusions
  - Exclusions
  - Notes / constraints
- Execution requirements:
  - Duration minutes
  - Weather sensitivity flag
  - Required photos (structured)
  - Checklist items (structured)
- Fulfillment mode governance (timing rules, not scheduling)
- Customer “catalog browse” surface (read-only list + details)
- Provider “SKU details” surface (read-only reference)
- Status lifecycle:
  - draft → active → paused → archived
- Optional **pricing metadata** that is **non-binding** and **non-computational**

### Explicitly out of scope
- Subscription tiers, totals, checkout
- Add-ons, bundles, tiered pricing
- Scheduling, service-day generation, route optimization
- Job execution flows

---

## 3) Definitions (shared language)

### SKU
A standardized service definition that can be sold and executed consistently.

### Fulfillment mode (governance only)
Defines *how strictly* the service needs to occur relative to the Service Day assignment.

- `same_day_preferred`  
  Best performed on the assigned Service Day. Can slip only with explicit ops override (future).
  Example: “Trash bins to curb”

- `same_week_allowed`  
  Can be done within the same service week without harming customer experience.
  Example: “Filter replacement”

- `independent_cadence`  
  Runs on its own cadence (e.g., monthly/quarterly) independent of weekly service day.
  Example: “Deep clean fridge coils”

> Module 04 stores these rules; Module 06+ enforces them.

---

## 4) User stories

### Admin
- Create a SKU with clear scope and requirements.
- Edit SKU safely without breaking downstream modules.
- Pause a SKU to stop new selection but preserve history.
- Archive SKUs that should never be used again.
- Duplicate a SKU when scope changes materially.

### Customer
- Browse available services with clear inclusions/exclusions.
- Understand what proof is required and what “done” means.

### Provider
- View SKU requirements (photos, checklist, notes) before execution.
- Avoid ambiguity: inclusions/exclusions are crisp.

---

## 5) Admin Console requirements

### 5.1 Route + IA
Route: `/admin/skus`

Layout (mobile-friendly):
- Top: Search + Filter bar
- Tabs (segmented control):
  1) **All**
  2) **Active**
  3) **Draft**
  4) **Paused/Archived**

Primary CTA: **“New SKU”**

---

### 5.2 SKU list (scannable row design)
Each row shows:
- SKU name
- Status pill
- Duration minutes
- Fulfillment mode (short label)
- Photo req count (e.g., “3 photos”)
- Optional: “Price hint” badge if pricing metadata exists (e.g., “$29 est.”)

Row tap opens **SKU Detail** (sheet modal preferred on mobile).

---

### 5.3 Create / Edit SKU form (single column)
Sections (collapsed by default except “Basics”):

#### A) Basics
- **Name** (required)
- **Short description** (required; 1–2 lines)
- **Category** (optional but recommended; e.g., Exterior, Kitchen, Utilities)
- **Status** (draft/active/paused/archived)

#### B) Scope (the most important part)
- **Inclusions** (required, list input)
  - UX: “Add inclusion” chip/list rows
  - Example: “Wipe exterior of trash bins”
- **Exclusions** (required, list input)
  - Example: “No hazardous waste removal”
- **Edge-case notes** (optional)
  - Example: “If bins contain loose liquids, mark as blocked and photo.”

Rules:
- Inclusions and exclusions must be **short**, **actionable**, and **verifiable**.
- Each line should start with a verb.

#### C) Execution rules
- **Duration minutes** (required, integer)
- **Fulfillment mode** (required enum)
- **Weather sensitive** (toggle)
  - Helper: “If weather blocks execution, provider must mark blocked and photo.”

#### D) Proof requirements (photos)
- **Required photos** (structured list)
  Each item:
  - `label` (required): e.g., “Before — front yard”
  - `when` (required): `before` | `after` | `both`
  - `count` (required): integer (default 1)
  - `notes` (optional): “Must include house number if visible”

#### E) Checklist (task verification)
- **Checklist items** (structured list)
  Each item:
  - `label` (required): “Confirm gate code used”
  - `required` (toggle; default true)

#### F) Pricing metadata (optional, flexible)
This is **not used for totals** in Module 04.

- **Estimated price hint (cents)** (optional)
  - Label it clearly: “Price hint (optional)”
  - Helper: “For internal reference only. Tiers decide final pricing later.”
- **Pricing notes** (optional)
  - Example: “Typically included in Standard tier.”

Rules:
- No calculations or enforcement.
- No “required price” to activate a SKU.
- If you don’t know pricing: leave it blank.

---

### 5.4 Editing guardrails (future-safe)
Rules:
- Never hard-delete SKUs
- Prefer **Duplicate SKU** for major scope changes
- Confirm when changing:
  - Fulfillment mode
  - Required photos / checklist count

Module 04 requirement:
- Provide “Duplicate SKU” action in admin UI:
  - Copies all fields
  - Sets status to `draft`
  - Appends “(Copy)” to name

---

## 6) Customer experience (read-only catalog)

### 6.1 Routes (suggested)
- `/customer/services` — list
- `/customer/services/:skuId` — detail

### 6.2 List behavior
- Show only `active` SKUs
- Simple filters (optional):
  - Category
  - Weather sensitive badge
  - Fulfillment mode label

### 6.3 Detail page content (customer-friendly)
- Name
- Short description
- “What’s included” bullets
- “What’s not included” bullets
- Typical timing:
  - Duration estimate
  - Fulfillment mode (plain-English)
- “How we confirm it’s done”
  - photo requirement summary (e.g., “Before/after photos”)

Pricing:
- If price hint exists, show as “Estimated” (optional).
- Otherwise, show no pricing at all.

---

## 7) Provider experience (read-only SKU reference)

Minimum surface:
- Scope (inclusions/exclusions)
- Checklist items
- Required photos list
- Weather sensitivity
- Edge-case notes

Module 04 delivers the data + a reusable detail view component.

---

## 8) Data model (Supabase)

### 8.1 Primary table: `service_skus`
Fields (align with existing schema; extend only if needed):
- `id` UUID PK
- `name` TEXT NOT NULL
- `description` TEXT NOT NULL
- `category` TEXT NULL
- `inclusions` TEXT[] NOT NULL DEFAULT '{}'
- `exclusions` TEXT[] NOT NULL DEFAULT '{}'
- `duration_minutes` INT NOT NULL
- `fulfillment_mode` TEXT NOT NULL  
  Allowed: `same_day_preferred` | `same_week_allowed` | `independent_cadence`
- `weather_sensitive` BOOLEAN NOT NULL DEFAULT false
- `required_photos` JSONB NOT NULL DEFAULT '[]'
- `checklist` JSONB NOT NULL DEFAULT '[]'
- **`price_hint_cents` INT NULL**  ← optional, non-binding
- `pricing_notes` TEXT NULL
- `status` TEXT NOT NULL DEFAULT 'draft'  
  Allowed: `draft` | `active` | `paused` | `archived`
- `created_at` TIMESTAMPTZ NOT NULL DEFAULT now()
- `updated_at` TIMESTAMPTZ NOT NULL DEFAULT now()

### 8.2 JSON shapes (must be consistent)
#### `required_photos` item
```json
{
  "label": "Before — front yard",
  "when": "before",
  "count": 1,
  "notes": "Include house number if visible"
}
```

#### `checklist` item
```json
{
  "label": "Confirm gate code used",
  "required": true
}
```

---

## 9) Security & RLS

### 9.1 Read access
- Authenticated customers/providers: can read `active` SKUs
- Admins: can read all SKUs (including draft/paused/archived)

### 9.2 Write access
- Admins only:
  - Create
  - Update
  - Pause
  - Archive
  - Duplicate

---

## 10) Operational rules

### 10.1 Status semantics
- `draft`: only visible to admins
- `active`: visible to customers/providers
- `paused`: hidden from customers/providers (but preserved)
- `archived`: hidden from customers/providers; never used for new selections

### 10.2 Never do these
- Never hard-delete SKUs
- Never require pricing to activate a SKU
- Never silently reduce proof requirements (confirm)

---

## 11) QA: error states & edge cases

- Empty inclusions/exclusions:
  - Block save; require at least 1 inclusion and 1 exclusion
- Duration not set:
  - Block save
- Invalid list entries:
  - Auto-trim; prevent blank lines
- Status changes:
  - Confirm when moving `active → paused` or `active → archived`

---

## 12) Acceptance tests (Module 04)

### Admin
1) Admin can create a SKU with inclusions, exclusions, duration, fulfillment mode, status.
2) Admin can edit SKU fields and changes persist.
3) Admin can duplicate a SKU; clone saves as `draft`.
4) Admin can pause and archive SKUs.
5) SKU list filters work (Active, Draft, Paused/Archived).
6) Required photos + checklist render correctly in admin edit.
7) Pricing hint is optional; SKU can be `active` with no price.

### Customer
8) Customer sees only `active` SKUs in catalog list.
9) Customer can open SKU detail and view inclusions/exclusions clearly.
10) Customer sees plain-English fulfillment mode description.
11) If pricing hint exists, it is labeled “Estimated” (optional).

### Provider
12) Provider can view SKU scope + requirements without error.

---

## 13) Definition of done

The SKU catalog is the **single source of truth** for service definitions:
- Admin can manage SKUs quickly and safely.
- Customers can browse services with crystal-clear scope.
- Providers can rely on requirements (photos + checklist) with zero ambiguity.
- Pricing remains flexible and non-binding, ready for tier design later.
