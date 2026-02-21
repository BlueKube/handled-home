

# Handled Home — Skeleton Foundation + Documentation Setup

## Overview
Save the four uploaded reference documents into the project, create the module-by-module development guide structure, then build the full three-app skeleton with Supabase Auth, role-based routing, and foundational database schema.

---

## Phase 1: Documentation Structure

### Save Reference Docs
- `docs/masterplan.md` — Full vision & business model
- `docs/app-flow-pages-and-roles.md` — Pages, roles, journeys
- `docs/design-guidelines.md` — Typography, colors, spacing, voice
- `docs/implementation-plan.md` — MVP sequence & timeline

### Create Module Index
- `docs/modules/README.md` — How to use modules, development workflow, dependency map
- `docs/modules/01-auth-and-roles.md` — Auth, RBAC, profile creation
- `docs/modules/02-property-profiles.md` — Address, access info, pets, constraints
- `docs/modules/03-zones-and-capacity.md` — Regions, zip zones, service day assignment, capacity
- `docs/modules/04-sku-catalog.md` — Service definitions, fulfillment modes, photos, pricing
- `docs/modules/05-subscription-engine.md` — Plans, rollover, pause/cancel, Stripe
- `docs/modules/06-service-day-system.md` — Assignment, rejection, alternates, cutoffs
- `docs/modules/07-bundle-builder.md` — SKU selection per cycle, eligibility, prep
- `docs/modules/08-provider-onboarding.md` — Org setup, coverage, insurance, vetting
- `docs/modules/09-job-execution.md` — Checklists, photos, status transitions, exceptions
- `docs/modules/10-visit-tracking-photos.md` — Real-time status, before/after, ratings
- `docs/modules/11-billing-and-payouts.md` — Payments, receipts, provider payouts
- `docs/modules/12-support-and-disputes.md` — Tickets, redos, refunds, escalation
- `docs/modules/13-referrals-and-incentives.md` — Referral links, density campaigns, rewards
- `docs/modules/14-reporting-and-analytics.md` — MRR, churn, utilization, density dashboards

Each module doc will contain: scope summary, tables involved, key user stories, dependencies, and acceptance criteria.

---

## Phase 2: Design System Setup

### Theme & Typography
- Apply Handled Home color palette from design guidelines:
  - Primary: deep navy `#0B1F3B`
  - Accent: teal `#14B8A6`
  - Surface: light gray `#F7F8FA`
  - Semantic colors for success/warning/error
- Import Inter font
- Configure 8pt spacing grid
- Ensure WCAG AA contrast compliance

### Shared Components
- Status badges (using global status enums for orders, providers, service days)
- Role-aware navigation wrapper
- Placeholder page template (module name + description + "coming soon" state)

---

## Phase 3: Authentication & Roles (Supabase)

### Database
- `profiles` table — name, phone, avatar, created_at
- `user_roles` table — user_id, role (customer/provider/admin), created_at
- `has_role()` PostgreSQL function (security definer) for RLS
- Auto-create profile trigger on auth signup
- RLS policies on both tables

### Auth Pages
- Login page (email/password)
- Signup page with initial role selection (dev convenience — later separated)
- Protected route wrapper that checks role

---

## Phase 4: App Shell & Navigation

### Shared Layout
- Top header with Handled Home logo, role switcher (dev tool), user menu
- Sidebar navigation that changes based on active role
- Main content area with breadcrumbs

### Customer App (`/customer/*`)
- Dashboard — "Your home is handled" hero, next service day countdown
- Build My Service Day — placeholder
- Service History — placeholder
- Subscription & Plan — placeholder
- Property Profile — placeholder
- Wallet & Billing — placeholder
- Referrals — placeholder
- Support — placeholder
- Account Settings — placeholder

### Provider App (`/provider/*`)
- Today's Jobs — placeholder with empty job list
- Job Detail — placeholder
- Earnings — placeholder
- Performance — placeholder
- Organization Settings — placeholder
- Coverage & Capacity — placeholder
- Account Settings — placeholder

### Admin Console (`/admin/*`)
- Overview Dashboard — placeholder with metric cards
- Regions & Zones — placeholder
- Capacity Engine — placeholder
- SKU Catalog — placeholder
- Subscription Plans — placeholder
- Providers — placeholder
- Scheduling Operations — placeholder
- Support Console — placeholder
- Incentives — placeholder
- Reporting & Analytics — placeholder
- Audit Logs — placeholder
- Admin Settings — placeholder

---

## Phase 5: Foundation Database Tables

### Geography
- `regions` — name, status
- `zones` — region_id, name, zip_codes (array), default_service_day, capacity config

### Properties
- `properties` — user_id, address fields, access_instructions, gate_code, pets, parking, lot_size

### Services
- `service_skus` — name, description, inclusions, exclusions, duration_minutes, fulfillment_mode (enum: same_day/same_week/independent), weather_sensitive, required_photos, status

### Subscriptions
- `subscription_plans` — name, service_days_per_month, rollover_max, rollover_expiry_days, price_cents, status

All tables with RLS enabled. Detailed transactional tables (orders, jobs, payouts, etc.) added per module.

---

## What This Delivers
A fully navigable three-app skeleton where you can sign up, log in, switch roles, and see every page that will exist — each with a clear label of which module will build it out. The `/docs/modules/` folder becomes the implementation roadmap: pick a module, read its spec, and build with full context window focus.

