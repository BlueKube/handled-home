# Handled Home — Implementation Reference

> **Purpose:** Tactical, file-level implementation guidance. Which files implement what, hook→page mappings, common patterns, edge function inventory.  
> **Source of truth for roadmap/tasks:** `docs/tasks.md`  
> **Source of truth for product vision:** `docs/masterplan.md`  
> **Last updated:** 2026-02-26

---

## 1) Architecture Overview

### Frontend Stack
- **Framework:** React 18 + Vite + TypeScript
- **Styling:** Tailwind CSS + shadcn/ui components
- **State:** TanStack Query (server state) + React Context (auth)
- **Routing:** react-router-dom v6 with role-based route trees
- **Mobile:** Capacitor (configured, no native builds yet)

### Backend Stack
- **Auth:** Lovable Cloud Auth (email/password)
- **Database:** PostgreSQL with RLS
- **Storage:** Lovable Cloud Storage (photo proof)
- **Edge Functions:** 20 deployed (see §6)
- **Payments:** Stripe (checkout, Connect, webhooks)

---

## 2) File Organization

### Page → Hook → Component Mapping

#### Customer Pages
| Page | Route | Primary Hook(s) | Key Components |
|------|-------|-----------------|----------------|
| Dashboard | `/customer` | `useCustomerJobs`, `useSubscription` | `NextVisitCard`, `WeekTimeline`, `SeasonalPlanCard` |
| Build | `/customer/build` | redirects to Routine | — |
| Routine | `/customer/routine` | `useRoutine`, `useDraftRoutine`, `useEntitlements` | `RoutineItemCard`, `AddServicesSheet`, `CadencePicker` |
| RoutineReview | `/customer/routine/review` | `useRoutinePreview`, `useFourWeekPreview` | `ReviewServiceCard`, `WeekPreviewTimeline` |
| RoutineConfirm | `/customer/routine/confirm` | — | `RoutineSuccessScreen` |
| ServiceDay | `/customer/service-day` | `useServiceDayAssignment` | `ServiceDayOffer`, `ServiceDayConfirmed`, `ServiceDayAlternatives` |
| History | `/customer/history` | `useCustomerJobs` | `VisitCard` |
| VisitDetail | `/customer/visits/:jobId` | `useCustomerVisitDetail` | `PhotoGallery`, `ReportIssueSheet` |
| Billing | `/customer/billing` | `useCustomerBilling` | `FixPaymentPanel`, `SubscriptionStatusPanel` |
| BillingHistory | `/customer/billing/history` | `useCustomerBilling` | — |
| BillingReceipt | `/customer/billing/receipts/:id` | `useCustomerBilling` | — |
| BillingMethods | `/customer/billing/methods` | `useCustomerBilling` | — |
| Plans | `/customer/plans` | `usePlans` | `PlanCard` |
| Subscribe | `/customer/subscribe` | `usePlans` | — |
| Subscription | `/customer/subscription` | `useSubscription` | — |
| Property | `/customer/property` | `useProperty` | — |
| Issues | `/customer/issues` | `useCustomerIssues` | — |
| Referrals | `/customer/referrals` | `useReferrals`, `useReferralCodes` | — |
| Support | `/customer/support` | — | `SupportCategoryTile` |
| SupportNew | `/customer/support/new` | `useCreateTicket`, `useSupportAiClassify` | — |
| SupportTickets | `/customer/support/tickets` | `useSupportTickets` | `TicketStatusChip` |
| SupportTicketDetail | `/customer/support/tickets/:id` | `useSupportTicketDetail` | `ResolutionOfferCard` |
| Settings | `/customer/settings` | `useNotificationPreferences` | `ProfileForm`, `ChangePasswordForm`, `PreviewAsCard` |
| Services | `/customer/services` | `useSkus` | `ServiceCard`, `SkuDetailView` |
| Notifications | `/customer/notifications` | `useNotifications` | — |

#### Provider Pages
| Page | Route | Primary Hook(s) | Key Components |
|------|-------|-----------------|----------------|
| Dashboard | `/provider` | `useProviderJobs` | — |
| Jobs | `/provider/jobs` | `useProviderJobs` | — |
| JobDetail | `/provider/jobs/:id` | `useJobDetail`, `useJobActions` | — |
| JobChecklist | `/provider/jobs/:id/checklist` | `useJobDetail` | — |
| JobPhotos | `/provider/jobs/:id/photos` | `useJobDetail` | — |
| JobComplete | `/provider/jobs/:id/complete` | `useJobDetail`, `useJobActions` | — |
| Earnings | `/provider/earnings` | `useProviderEarnings` | — |
| Payouts | `/provider/payouts` | `useProviderEarnings` | — |
| PayoutHistory | `/provider/payouts/history` | `useProviderEarnings` | — |
| Performance | `/provider/performance` | `useProviderPerformance` | `SparklineChart` |
| Organization | `/provider/organization` | `useProviderOrg`, `useProviderMembers`, `useProviderCompliance` | — |
| Coverage | `/provider/coverage` | `useProviderCoverage`, `useProviderCapabilities` | — |
| SKUs | `/provider/skus` | `useProviderCapabilities` | — |
| Insights | `/provider/insights` | `useProviderGrowthStats` | — |
| InsightsHistory | `/provider/insights/history` | `useProviderGrowthStats` | — |
| Onboarding | `/provider/onboarding/*` | `useProviderApplication` | 5 step pages |
| Support | `/provider/support` | `useSupportTickets` | — |
| Referrals | `/provider/referrals` | `useProviderInvite`, `useReferralCodes` | — |
| InviteCustomers | `/provider/referrals/invite-customers` | `useInviteScripts` | — |
| Apply | `/provider/apply` | `useProviderApplication` | — |
| Settings | `/provider/settings` | `useNotificationPreferences` | `ProfileForm`, `ChangePasswordForm`, `RoleSwitcher`, `PreviewAsCard` |
| Notifications | `/provider/notifications` | `useNotifications` | — |

#### Admin Pages
| Page | Route | Primary Hook(s) |
|------|-------|-----------------|
| Dashboard | `/admin` | `useOpsMetrics` |
| Zones | `/admin/zones` | `useZones`, `useRegions` |
| Capacity | `/admin/capacity` | `useServiceDayCapacity` |
| SKUs | `/admin/skus` | `useSkus` |
| Plans | `/admin/plans` | `usePlans` |
| Subscriptions | `/admin/subscriptions` | `useAdminSubscriptions` |
| Providers | `/admin/providers` | `useProviderAdmin` |
| ProviderDetail | `/admin/providers/:id` | `useProviderAdmin` |
| Scheduling | `/admin/scheduling` | `useServiceDayAdmin` |
| ServiceDays | `/admin/service-days` | `useServiceDayAdmin` |
| Jobs | `/admin/jobs` | `useAdminJobs` |
| JobDetail | `/admin/jobs/:id` | `useJobDetail` |
| Billing | `/admin/billing` | `useAdminBilling` |
| CustomerLedger | `/admin/billing/customers/:id` | `useAdminCustomerLedger` |
| Payouts | `/admin/payouts` | `useAdminBilling` |
| ProviderLedger | `/admin/payouts/providers/:id` | `useAdminProviderLedger` |
| Exceptions | `/admin/exceptions` | `useAdminBilling` |
| Support | `/admin/support` | `useSupportTickets` |
| SupportTicketDetail | `/admin/support/tickets/:id` | `useSupportTicketDetail`, `useTicketActions` |
| SupportPolicies | `/admin/support/policies` | `useSupportPolicies` |
| SupportMacros | `/admin/support/macros` | `useSupportMacros` |
| Growth | `/admin/growth` | `useGrowthEvents`, `useMarketHealth` |
| Incentives | `/admin/incentives` | `useReferralAdmin`, `useReferralPrograms` |
| Reports | `/admin/reports` | `useAdminBilling`, `useAdminSubscriptions` |
| Audit | `/admin/audit` | direct query |
| OpsCockpit | `/admin/ops` | `useOpsMetrics` |
| OpsZones | `/admin/ops/zones` | `useZoneHealth` |
| OpsZoneDetail | `/admin/ops/zones/:id` | `useZoneHealth`, `useZoneInsights` |
| OpsServiceDays | `/admin/ops/service-days` | `useServiceDayAdmin` |
| OpsJobs | `/admin/ops/jobs` | `useAdminJobs` |
| OpsBilling | `/admin/ops/billing` | `useAdminBilling` |
| OpsSupport | `/admin/ops/support` | `useSupportTickets` |
| OpsGrowth | `/admin/ops/growth` | `useGrowthEvents`, `useMarketZoneState` |
| OpsDefinitions | `/admin/ops/definitions` | `useSkus`, `usePlans` |
| TestToggles | `/admin/test-toggles` | — |
| Settings | `/admin/settings` | — |
| Notifications | `/admin/notifications` | `useNotifications` |

---

## 3) Common Patterns

### Auth & Role Gating
- `AuthContext` provides `user`, `activeRole`, `effectiveRole`, `previewRole`
- `ProtectedRoute` wraps role-specific route trees
- `CustomerPropertyGate` ensures property exists before customer pages load
- `SubscriptionGate` ensures active subscription for gated features
- Admin Preview Mode: `PreviewAsCard` on Settings pages sets `previewRole`, `effectiveRole` drives UI without DB changes

### Data Fetching
- All hooks use TanStack Query with `useQuery`/`useMutation`
- Queries keyed by entity + user ID (e.g., `['provider-jobs', userId]`)
- Mutations invalidate related queries on success
- `QueryErrorCard` component for error state with retry button

### Notification Emission
- **Always use** `emit_notification_event()` RPC (or `emit_notification()` for direct inbox writes)
- **Never** direct INSERT into `notifications` table from application code
- Notification title = short label, body = explanation text
- All notification-related RPCs are SECURITY DEFINER

### Financial Safety
- All balance arithmetic uses `GREATEST(0, COALESCE(value, 0) - amount)`
- Every status UPDATE also sets `updated_at = now()`
- Invoice generation is idempotent via `idempotency_key`

### Audit Logging
- Money, access, scheduling, governance changes → `admin_audit_log` row
- Edge functions log to `cron_run_log` (function_name, started_at, status, error_message)

---

## 4) Key Shared Components

| Component | Location | Usage |
|-----------|----------|-------|
| `SparklineChart` | `src/components/SparklineChart.tsx` | Mini trend charts across dashboards |
| `StatCard` | `src/components/StatCard.tsx` | KPI display cards |
| `StatusBadge` | `src/components/StatusBadge.tsx` | Colored status pills |
| `QueryErrorCard` | `src/components/QueryErrorCard.tsx` | Error state with retry |
| `PageSkeleton` | `src/components/PageSkeleton.tsx` | Loading skeleton |
| `SkuDetailView` | `src/components/SkuDetailView.tsx` | SKU detail display |
| `NotificationBell` | `src/components/NotificationBell.tsx` | Header bell + unread badge |
| `NotificationPanel` | `src/components/NotificationPanel.tsx` | Slide-out notification list |
| `BottomTabBar` | `src/components/BottomTabBar.tsx` | Role-aware bottom navigation |
| `AppHeader` | `src/components/AppHeader.tsx` | Top bar with bell + back nav |
| `MoreMenu` | `src/components/MoreMenu.tsx` | Role-aware "More" tab page |

---

## 5) Database Patterns

### Key RPCs (SECURITY DEFINER)
- `emit_notification_event()` — async event bus emitter
- `emit_notification()` — direct notification writer
- `auto_assign_job()` — Primary→Backup job assignment
- `increment_service_week_usage()` — cycle tracking
- `is_holiday()` — holiday check helper
- `review_expansion_suggestion()` — admin expansion review
- `get_waitlist_summary()` — waitlist metrics
- `notify_waitlist_on_launch()` — waitlist notification

### Realtime-Enabled Tables
- `notifications` — live notification feed

---

## 6) Edge Function Inventory

See `docs/edge-function-inventory.md` for the complete inventory with triggers, secrets, and status.

---

## 7) Design System Quick Reference

### CSS Tokens (index.css)
- Use semantic tokens: `--background`, `--foreground`, `--primary`, `--accent`, `--muted`, etc.
- Never hardcode colors in components — always use Tailwind classes mapped to tokens

### Typography
- Display: system font stack
- Body: system font stack
- All text uses Tailwind's semantic text classes

### Mobile-First
- No desktop breakpoints
- Bottom tab bar navigation
- Safe area insets via `env(safe-area-inset-*)`
