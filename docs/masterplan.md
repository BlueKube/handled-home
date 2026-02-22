# masterplan.md

## 30-Second Elevator Pitch
Handled Home is a subscription-only home services platform that turns maintenance into a predictable routine. 
Homeowners receive an assigned recurring Service Day based on their zone and bundle standardized services (SKUs) for that cycle. 
By clustering homes geographically, Handled Home creates route density—delivering lower cost and higher reliability than one-off bookings.

---

## Problem and Mission

### Problem
- Home maintenance is reactive and fragmented.
- Homeowners coordinate multiple vendors manually.
- Scheduling is unpredictable.
- Service quality is inconsistent.
- Providers lose margin to drive time and sales overhead.

### Mission
Make home upkeep automatic and predictable.

Core promise:
> “Your home is handled.”

---

## Target Audience

### Primary
- Busy suburban homeowners
- Dual-income households
- Homeowners who value predictability over price shopping

### Secondary
- Light multi-property owners
- High-trust neighborhoods
- Service providers seeking consistent route density

---

## Core Features

### Customer Experience
- Zone-based recurring Service Day assignment
- Controlled rejection flow (2–3 alternatives only)
- Subscription-first billing
- Bundle builder per cycle
- Standardized SKU transparency
- Before/after photo proof
- Line-item ratings
- Structured issue resolution

### Provider Experience
- Daily job list
- Checklist enforcement
- Required photo uploads
- Exception handling
- Performance metrics dashboard
- Earnings transparency

### Admin Experience
- Regions and zip-based zones
- Capacity guardrails (stops + minutes)
- SKU governance system
- Subscription plan configuration
- Provider onboarding + enforcement
- Support tooling (refunds, redos, impersonation)
- Analytics dashboards

---

## High-Level Tech Stack

### Frontend
- React Native (Customer + Provider)
- Next.js (Admin Console)

### Backend
- Node.js (NestJS preferred)
- Postgres (relational integrity)
- Redis + job queue (scheduled tasks)

### Infra
- AWS or GCP
- S3/GCS for photo storage
- Stripe for subscriptions
- Mapbox or Google Maps

---

## Conceptual Data Model (ERD in Words)

- User (roles: Customer, ProviderMember, Admin)
- Household → has many Users
- Property → belongs to Household and Zone
- Zone → has default Service Days + capacity caps
- Subscription → belongs to Household
- SKU → governed service definition
- Bundle → per-cycle service selection
- Job → provider execution unit
- ChecklistResponse + PhotoEvidence
- ProviderOrg + ProviderMembers
- SupportTicket
- Payout
- AuditLog

---

## UI Principles

- One visible promise at all times
- No open calendar browsing
- Clear scope definitions
- Calm defaults
- Design for forgiveness
- Reduce cognitive load

---

## Security Notes

- TLS everywhere
- Role-based access control
- Encrypted sensitive data
- Signed photo URLs
- Immutable audit logs
- Stripe tokenization only

---

## Roadmap

### MVP
- 1 city
- 3–5 SKUs
- Zone density proof
- Manual admin oversight

### V1
- Utilization dashboards
- Enforcement automation
- Referral system

### V2
- Multi-city
- Polygon zones
- Additional verticals (pest, pool)
- Managed crews in dense zones

---

## Risks and Mitigations

- Service debt → rollover caps + expiry
- Quality variance → mandatory photo enforcement
- Density failure → geo focus strategy
- Operational override creep → strict audit logging
- Weather volatility → weather mode

---

## Future Expansion

- Property health score
- Predictive maintenance
- Insurance integrations
- Fleet optimization
- National scaling

