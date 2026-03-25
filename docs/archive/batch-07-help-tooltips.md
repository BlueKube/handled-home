# Batch 7 — HelpTip Tooltips on 18 Pages

## Objective
Add contextual HelpTip tooltips to 18 pages (14 customer, 4 admin) to provide inline educational hints next to key headings and sections.

## Component
`HelpTip` from `@/components/ui/help-tip` — renders a small `HelpCircle` icon with a tap/hover tooltip.

## Changes

### Customer Pages (14)
| # | File | Placement | Tooltip Text |
|---|------|-----------|--------------|
| 1 | `Dashboard.tsx` | HandleBalanceBar section | Handles are your service allowances... |
| 2 | `Routine.tsx` | "Build Your Routine" h1 | How it works — add services... |
| 3 | `ServiceDay.tsx` | ServiceDayConfirmed/ServiceDayOfferCard area | Your recommended day is optimized... |
| 4 | `Activity.tsx` | Activity value card | Every visit includes a photo receipt... |
| 5 | `Plans.tsx` | "Pick your membership" h1 | Plans set how many handles... |
| 6 | `Billing.tsx` | "Billing" h1 | Your billing cycle renews automatically... |
| 7 | `Subscription.tsx` | "Subscription" h1 | Your subscription controls your plan tier... |
| 8 | `Referrals.tsx` | "Referrals" h1 | Share your code with neighbors... |
| 9 | `Property.tsx` | "Your Home" h1 | Your property details help providers... |
| 10 | `SupportHome.tsx` | "Support" h1 | Submit a ticket and we'll respond... |
| 11 | `Settings.tsx` | "Account Settings" h1 | Update your profile, notification preferences... |
| 12 | `Schedule.tsx` | "Schedule" h1 | Your schedule shows upcoming and past visits... |
| 13 | `RecommendProvider.tsx` | "Recommend a Provider" h1 | Know a great service provider?... |
| 14 | `VisitDetail.tsx` | Visit detail h1 | This is your visit receipt... |

### Admin Pages (4)
| # | File | Placement | Tooltip Text |
|---|------|-----------|--------------|
| 15 | `Dashboard.tsx` | "Admin Console" h1 | Admin dashboard shows key metrics... |
| 16 | `OpsCockpit.tsx` | "Ops Cockpit" h1 | The Ops Cockpit surfaces the metrics... |
| 17 | `Growth.tsx` | "Growth Console" h1 | Growth Console tracks viral loop... |
| 18 | `Reports.tsx` | "Reporting & Analytics" h1 | Reports provide historical views... |

## Implementation Pattern
1. Add `import { HelpTip } from "@/components/ui/help-tip"` if not present
2. Place `<HelpTip text="..." />` inline next to the heading text inside the h1/h2 element

## Validation
- `npx tsc --noEmit` — no type errors
- `npm run build` — clean production build
