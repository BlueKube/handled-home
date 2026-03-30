import React, { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "next-themes";

import { AppLayout } from "@/components/AppLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { CustomerPropertyGate } from "@/components/CustomerPropertyGate";
import { AdminShell } from "@/components/admin/AdminShell";
import MoreMenuPage from "@/components/MoreMenu";

// Pages (lazy-loaded)
const AuthPage = lazy(() => import("@/pages/AuthPage"));
const NotFound = lazy(() => import("@/pages/NotFound"));

// Customer pages
const CustomerDashboard = lazy(() => import("@/pages/customer/Dashboard"));
const CustomerBuild = lazy(() => import("@/pages/customer/Build"));
const CustomerVisitDetail = lazy(() => import("@/pages/customer/VisitDetail"));
const CustomerIssues = lazy(() => import("@/pages/customer/Issues"));
const CustomerSubscription = lazy(() => import("@/pages/customer/Subscription"));
const CustomerProperty = lazy(() => import("@/pages/customer/Property"));
const CustomerBilling = lazy(() => import("@/pages/customer/Billing"));
const CustomerBillingMethods = lazy(() => import("@/pages/customer/BillingMethods"));
const CustomerBillingHistory = lazy(() => import("@/pages/customer/BillingHistory"));
const CustomerBillingReceipt = lazy(() => import("@/pages/customer/BillingReceipt"));
const CustomerReferrals = lazy(() => import("@/pages/customer/Referrals"));
const CustomerSupport = lazy(() => import("@/pages/customer/Support"));
const CustomerSupportNew = lazy(() => import("@/pages/customer/SupportNew"));
const CustomerSupportTickets = lazy(() => import("@/pages/customer/SupportTickets"));
const CustomerSupportTicketDetail = lazy(() => import("@/pages/customer/SupportTicketDetail"));
const CustomerSettings = lazy(() => import("@/pages/customer/Settings"));
const CustomerServices = lazy(() => import("@/pages/customer/Services"));
const CustomerPlans = lazy(() => import("@/pages/customer/Plans"));
const CustomerPlanDetail = lazy(() => import("@/pages/customer/PlanDetail"));
const CustomerRoutine = lazy(() => import("@/pages/customer/Routine"));
const CustomerSubscribe = lazy(() => import("@/pages/customer/Subscribe"));
const CustomerServiceDay = lazy(() => import("@/pages/customer/ServiceDay"));
const CustomerRoutineReview = lazy(() => import("@/pages/customer/RoutineReview"));
const CustomerRoutineConfirm = lazy(() => import("@/pages/customer/RoutineConfirm"));
const CustomerOnboardingWizard = lazy(() => import("@/pages/customer/OnboardingWizard"));
const CustomerByocOnboardingWizard = lazy(() => import("@/pages/customer/ByocOnboardingWizard"));
const CustomerPhotoTimeline = lazy(() => import("@/pages/customer/PhotoTimeline"));
const CustomerHomeAssistant = lazy(() => import("@/pages/customer/HomeAssistant"));
const CustomerCoverageMap = lazy(() => import("@/pages/customer/CoverageMap"));
const CustomerPropertySizing = lazy(() => import("@/pages/customer/PropertySizing"));
const CustomerAppointmentPicker = lazy(() => import("@/pages/customer/AppointmentPicker"));
const CustomerSchedule = lazy(() => import("@/pages/customer/Schedule"));
const CustomerActivity = lazy(() => import("@/pages/customer/Activity"));
const CustomerReschedule = lazy(() => import("@/pages/customer/Reschedule"));
const CustomerRecommendProvider = lazy(() => import("@/pages/customer/RecommendProvider"));
const CustomerRecommendProviderStatus = lazy(() => import("@/pages/customer/RecommendProviderStatus"));

// Provider pages
const ProviderDashboard = lazy(() => import("@/pages/provider/Dashboard"));
const ProviderJobs = lazy(() => import("@/pages/provider/Jobs"));
const ProviderSKUs = lazy(() => import("@/pages/provider/SKUs"));
const ProviderEarnings = lazy(() => import("@/pages/provider/Earnings"));
const ProviderPayouts = lazy(() => import("@/pages/provider/Payouts"));
const ProviderPayoutHistory = lazy(() => import("@/pages/provider/PayoutHistory"));
const ProviderPerformance = lazy(() => import("@/pages/provider/Performance"));
const ProviderOrganization = lazy(() => import("@/pages/provider/Organization"));
const ProviderCoverage = lazy(() => import("@/pages/provider/Coverage"));
const ProviderSettings = lazy(() => import("@/pages/provider/Settings"));
const ProviderHistory = lazy(() => import("@/pages/provider/History"));
const ProviderJobDetail = lazy(() => import("@/pages/provider/JobDetail"));
const ProviderJobChecklist = lazy(() => import("@/pages/provider/JobChecklist"));
const ProviderJobPhotos = lazy(() => import("@/pages/provider/JobPhotos"));
const ProviderJobComplete = lazy(() => import("@/pages/provider/JobComplete"));
const ProviderOnboarding = lazy(() => import("@/pages/provider/Onboarding"));
const ProviderOnboardingOrg = lazy(() => import("@/pages/provider/OnboardingOrg"));
const ProviderOnboardingCoverage = lazy(() => import("@/pages/provider/OnboardingCoverage"));
const ProviderOnboardingCapabilities = lazy(() => import("@/pages/provider/OnboardingCapabilities"));
const ProviderOnboardingCompliance = lazy(() => import("@/pages/provider/OnboardingCompliance"));
const ProviderOnboardingAgreement = lazy(() => import("@/pages/provider/OnboardingAgreement"));
const ProviderOnboardingReview = lazy(() => import("@/pages/provider/OnboardingReview"));
const ProviderWorkSetup = lazy(() => import("@/pages/provider/WorkSetup"));
const ProviderAvailability = lazy(() => import("@/pages/provider/Availability"));
const ProviderSupport = lazy(() => import("@/pages/provider/Support"));
const ProviderSupportNew = lazy(() => import("@/pages/provider/SupportNew"));
const ProviderSupportTicketDetail = lazy(() => import("@/pages/provider/SupportTicketDetail"));
const ProviderReferrals = lazy(() => import("@/pages/provider/Referrals"));
const ProviderInviteCustomers = lazy(() => import("@/pages/provider/InviteCustomers"));
const ProviderApply = lazy(() => import("@/pages/provider/Apply"));
const ProviderByocCenter = lazy(() => import("@/pages/provider/ByocCenter"));
const ProviderByocCreateLink = lazy(() => import("@/pages/provider/ByocCreateLink"));
const ProviderInsights = lazy(() => import("@/pages/provider/Insights"));
const ProviderInsightsHistory = lazy(() => import("@/pages/provider/InsightsHistory"));
const ProviderQualityScore = lazy(() => import("@/pages/provider/QualityScore"));
const InviteLanding = lazy(() => import("@/pages/InviteLanding"));
const ShareLanding = lazy(() => import("@/pages/ShareLanding"));
const ByocActivate = lazy(() => import("@/pages/ByocActivate"));

// Admin pages
const AdminDashboard = lazy(() => import("@/pages/admin/Dashboard"));
const AdminZones = lazy(() => import("@/pages/admin/Zones"));
const AdminZoneBuilder = lazy(() => import("@/pages/admin/ZoneBuilder"));
const AdminCapacity = lazy(() => import("@/pages/admin/Capacity"));
const AdminSKUs = lazy(() => import("@/pages/admin/SKUs"));
const AdminPlans = lazy(() => import("@/pages/admin/Plans"));
const AdminSubscriptions = lazy(() => import("@/pages/admin/Subscriptions"));
const AdminProviders = lazy(() => import("@/pages/admin/Providers"));
const AdminProviderDetail = lazy(() => import("@/pages/admin/ProviderDetail"));
const AdminApplications = lazy(() => import("@/pages/admin/Applications"));
const AdminApplicationDetail = lazy(() => import("@/pages/admin/ApplicationDetail"));
const AdminScheduling = lazy(() => import("@/pages/admin/Scheduling"));
const AdminSupport = lazy(() => import("@/pages/admin/Support"));
const AdminSupportTicketDetail = lazy(() => import("@/pages/admin/SupportTicketDetail"));
const AdminIncentives = lazy(() => import("@/pages/admin/Incentives"));
const AdminReports = lazy(() => import("@/pages/admin/Reports"));
const AdminAudit = lazy(() => import("@/pages/admin/Audit"));
const AdminSettings = lazy(() => import("@/pages/admin/Settings"));
const AdminOpsCockpit = lazy(() => import("@/pages/admin/OpsCockpit"));
const AdminOpsZones = lazy(() => import("@/pages/admin/OpsZones"));
const AdminOpsZoneDetail = lazy(() => import("@/pages/admin/OpsZoneDetail"));
const AdminOpsServiceDays = lazy(() => import("@/pages/admin/OpsServiceDays"));
const AdminOpsJobs = lazy(() => import("@/pages/admin/OpsJobs"));
const AdminOpsBilling = lazy(() => import("@/pages/admin/OpsBilling"));
const AdminOpsSupport = lazy(() => import("@/pages/admin/OpsSupport"));
const AdminOpsGrowth = lazy(() => import("@/pages/admin/OpsGrowth"));
const AdminOpsDefinitions = lazy(() => import("@/pages/admin/OpsDefinitions"));
const AdminLevelAnalytics = lazy(() => import("@/pages/admin/LevelAnalytics"));
const AdminServiceDays = lazy(() => import("@/pages/admin/ServiceDays"));
const AdminBundles = lazy(() => import("@/pages/admin/Bundles"));
const AdminJobs = lazy(() => import("@/pages/admin/Jobs"));
const AdminJobDetail = lazy(() => import("@/pages/admin/JobDetail"));
const AdminBilling = lazy(() => import("@/pages/admin/Billing"));
const AdminPayouts = lazy(() => import("@/pages/admin/Payouts"));
const AdminExceptions = lazy(() => import("@/pages/admin/Exceptions"));
const AdminOpsExceptions = lazy(() => import("@/pages/admin/OpsExceptions"));
const AdminExceptionAnalytics = lazy(() => import("@/pages/admin/ExceptionAnalytics"));
const AdminCustomerLedger = lazy(() => import("@/pages/admin/CustomerLedger"));
const AdminProviderLedger = lazy(() => import("@/pages/admin/ProviderLedger"));
const AdminSupportPolicies = lazy(() => import("@/pages/admin/SupportPolicies"));
const AdminSupportMacros = lazy(() => import("@/pages/admin/SupportMacros"));
const AdminGrowth = lazy(() => import("@/pages/admin/Growth"));
const AdminTestToggles = lazy(() => import("@/pages/admin/TestToggles"));
const AdminNotificationHealth = lazy(() => import("@/pages/admin/NotificationHealth"));
const AdminFeedback = lazy(() => import("@/pages/admin/Feedback"));
const AdminDispatcherQueues = lazy(() => import("@/pages/admin/DispatcherQueues"));
const AdminControlPricing = lazy(() => import("@/pages/admin/ControlPricing"));
const AdminControlPayouts = lazy(() => import("@/pages/admin/ControlPayouts"));
const AdminControlChangeRequests = lazy(() => import("@/pages/admin/ControlChangeRequests"));
const AdminControlChangeLog = lazy(() => import("@/pages/admin/ControlChangeLog"));
const AdminControlConfig = lazy(() => import("@/pages/admin/ControlConfig"));
const AdminPlaybooks = lazy(() => import("@/pages/admin/Playbooks"));
const AdminSkuCalibration = lazy(() => import("@/pages/admin/SkuCalibration"));
const AdminCronHealth = lazy(() => import("@/pages/admin/CronHealth"));
const AdminSchedulingPolicy = lazy(() => import("@/pages/admin/SchedulingPolicy"));
const AdminPlannerDashboard = lazy(() => import("@/pages/admin/PlannerDashboard"));
const AdminAssignmentDashboard = lazy(() => import("@/pages/admin/AssignmentDashboard"));
const AdminAssignmentConfig = lazy(() => import("@/pages/admin/AssignmentConfig"));
const AdminWindowTemplates = lazy(() => import("@/pages/admin/WindowTemplates"));
const AdminSchedulingExceptions = lazy(() => import("@/pages/admin/SchedulingExceptions"));

// Shared pages
const SharedNotifications = lazy(() => import("@/pages/shared/Notifications"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 300_000,
    },
  },
});

function RootRedirect() {
  const { user, loading, activeRole } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/auth" replace />;
  return <Navigate to={`/${activeRole}`} replace />;
}

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="h-8 w-8 border-2 border-accent border-t-transparent rounded-full animate-spin" /></div>}>
              <Routes>
                <Route path="/" element={<RootRedirect />} />
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/invite/:code" element={<InviteLanding />} />
                <Route path="/byoc/activate/:token" element={<ByocActivate />} />
                <Route path="/share/:shareCode" element={<ShareLanding />} />

                {/* Customer App */}
                <Route element={<ProtectedRoute requiredRole="customer"><AppLayout /></ProtectedRoute>}>
                  <Route path="/customer/onboarding" element={<CustomerOnboardingWizard />} />
                  <Route path="/customer/onboarding/byoc/:token" element={<CustomerByocOnboardingWizard />} />
                  <Route path="/customer/property" element={<CustomerProperty />} />
                  <Route path="/customer/coverage-map" element={<CustomerCoverageMap />} />
                  <Route path="/customer/property-sizing" element={<CustomerPropertySizing />} />
                  <Route path="/customer/plans" element={<CustomerPlans />} />
                  <Route path="/customer/plans/:planId" element={<CustomerPlanDetail />} />
                  <Route path="/customer/routine" element={<CustomerPropertyGate><CustomerRoutine /></CustomerPropertyGate>} />
                  <Route path="/customer/routine/review" element={<CustomerPropertyGate><CustomerRoutineReview /></CustomerPropertyGate>} />
                  <Route path="/customer/routine/confirm" element={<CustomerPropertyGate><CustomerRoutineConfirm /></CustomerPropertyGate>} />
                  <Route path="/customer/subscribe" element={<CustomerSubscribe />} />
                  <Route path="/customer/service-day" element={<CustomerPropertyGate><CustomerServiceDay /></CustomerPropertyGate>} />
                  <Route path="/customer" element={<CustomerPropertyGate><CustomerDashboard /></CustomerPropertyGate>} />
                  <Route path="/customer/schedule" element={<CustomerPropertyGate><CustomerSchedule /></CustomerPropertyGate>} />
                  <Route path="/customer/activity" element={<CustomerPropertyGate><CustomerActivity /></CustomerPropertyGate>} />
                  <Route path="/customer/build" element={<CustomerPropertyGate><CustomerBuild /></CustomerPropertyGate>} />
                  {/* Redirects for old routes (gated for parity with route table) */}
                  <Route path="/customer/history" element={<CustomerPropertyGate><Navigate to="/customer/activity" replace /></CustomerPropertyGate>} />
                  <Route path="/customer/visits" element={<CustomerPropertyGate><Navigate to="/customer/activity" replace /></CustomerPropertyGate>} />
                  <Route path="/customer/upcoming" element={<CustomerPropertyGate><Navigate to="/customer/schedule" replace /></CustomerPropertyGate>} />
                  <Route path="/customer/timeline" element={<CustomerPropertyGate><Navigate to="/customer/activity" replace /></CustomerPropertyGate>} />
                  <Route path="/customer/visits/:jobId" element={<CustomerPropertyGate><CustomerVisitDetail /></CustomerPropertyGate>} />
                  <Route path="/customer/appointment/:visitId" element={<CustomerPropertyGate><CustomerAppointmentPicker /></CustomerPropertyGate>} />
                  <Route path="/customer/reschedule/:visitId" element={<CustomerPropertyGate><CustomerReschedule /></CustomerPropertyGate>} />
                  <Route path="/customer/photos" element={<CustomerPropertyGate><CustomerPhotoTimeline /></CustomerPropertyGate>} />
                  <Route path="/customer/home-assistant" element={<CustomerPropertyGate><CustomerHomeAssistant /></CustomerPropertyGate>} />
                  <Route path="/customer/issues" element={<CustomerPropertyGate><CustomerIssues /></CustomerPropertyGate>} />
                  <Route path="/customer/subscription" element={<CustomerPropertyGate><CustomerSubscription /></CustomerPropertyGate>} />
                  <Route path="/customer/billing" element={<CustomerPropertyGate><CustomerBilling /></CustomerPropertyGate>} />
                  <Route path="/customer/billing/methods" element={<CustomerPropertyGate><CustomerBillingMethods /></CustomerPropertyGate>} />
                  <Route path="/customer/billing/history" element={<CustomerPropertyGate><CustomerBillingHistory /></CustomerPropertyGate>} />
                  <Route path="/customer/billing/receipts/:invoiceId" element={<CustomerPropertyGate><CustomerBillingReceipt /></CustomerPropertyGate>} />
                  <Route path="/customer/referrals" element={<CustomerPropertyGate><CustomerReferrals /></CustomerPropertyGate>} />
                  <Route path="/customer/support" element={<CustomerPropertyGate><CustomerSupport /></CustomerPropertyGate>} />
                  <Route path="/customer/support/new" element={<CustomerPropertyGate><CustomerSupportNew /></CustomerPropertyGate>} />
                  <Route path="/customer/support/tickets" element={<CustomerPropertyGate><CustomerSupportTickets /></CustomerPropertyGate>} />
                  <Route path="/customer/support/tickets/:ticketId" element={<CustomerPropertyGate><CustomerSupportTicketDetail /></CustomerPropertyGate>} />
                  <Route path="/customer/settings" element={<CustomerPropertyGate><CustomerSettings /></CustomerPropertyGate>} />
                  <Route path="/customer/services" element={<CustomerPropertyGate><CustomerServices /></CustomerPropertyGate>} />
                  <Route path="/customer/more" element={<CustomerPropertyGate><MoreMenuPage /></CustomerPropertyGate>} />
                  <Route path="/customer/notifications" element={<SharedNotifications />} />
                  <Route path="/customer/recommend-provider" element={<CustomerPropertyGate><CustomerRecommendProvider /></CustomerPropertyGate>} />
                  <Route path="/customer/recommend-provider/status" element={<CustomerPropertyGate><CustomerRecommendProviderStatus /></CustomerPropertyGate>} />
                </Route>

                {/* Provider App */}
                <Route element={<ProtectedRoute requiredRole="provider"><AppLayout /></ProtectedRoute>}>
                  <Route path="/provider" element={<ProviderDashboard />} />
                  <Route path="/provider/onboarding" element={<ProviderOnboarding />} />
                  <Route path="/provider/onboarding/org" element={<ProviderOnboardingOrg />} />
                  <Route path="/provider/onboarding/coverage" element={<ProviderOnboardingCoverage />} />
                  <Route path="/provider/onboarding/capabilities" element={<ProviderOnboardingCapabilities />} />
                  <Route path="/provider/onboarding/compliance" element={<ProviderOnboardingCompliance />} />
                  <Route path="/provider/onboarding/agreement" element={<ProviderOnboardingAgreement />} />
                  <Route path="/provider/onboarding/review" element={<ProviderOnboardingReview />} />
                  <Route path="/provider/jobs" element={<ProviderJobs />} />
                  <Route path="/provider/jobs/:jobId" element={<ProviderJobDetail />} />
                  <Route path="/provider/jobs/:jobId/checklist" element={<ProviderJobChecklist />} />
                  <Route path="/provider/jobs/:jobId/photos" element={<ProviderJobPhotos />} />
                  <Route path="/provider/jobs/:jobId/complete" element={<ProviderJobComplete />} />
                  <Route path="/provider/history" element={<ProviderHistory />} />
                  <Route path="/provider/skus" element={<ProviderSKUs />} />
                  <Route path="/provider/earnings" element={<ProviderEarnings />} />
                  <Route path="/provider/payouts" element={<ProviderPayouts />} />
                  <Route path="/provider/payouts/history" element={<ProviderPayoutHistory />} />
                  <Route path="/provider/performance" element={<ProviderPerformance />} />
                  <Route path="/provider/organization" element={<ProviderOrganization />} />
                  <Route path="/provider/coverage" element={<ProviderCoverage />} />
                  <Route path="/provider/settings" element={<ProviderSettings />} />
                  <Route path="/provider/support" element={<ProviderSupport />} />
                  <Route path="/provider/support/new" element={<ProviderSupportNew />} />
                  <Route path="/provider/support/tickets/:ticketId" element={<ProviderSupportTicketDetail />} />
                  <Route path="/provider/referrals" element={<ProviderReferrals />} />
                  <Route path="/provider/referrals/invite-customers" element={<ProviderInviteCustomers />} />
                  <Route path="/provider/insights" element={<ProviderInsights />} />
                  <Route path="/provider/insights/history" element={<ProviderInsightsHistory />} />
                  <Route path="/provider/apply" element={<ProviderApply />} />
                  <Route path="/provider/byoc" element={<ProviderByocCenter />} />
                  <Route path="/provider/byoc/create-link" element={<ProviderByocCreateLink />} />
                  <Route path="/provider/quality" element={<ProviderQualityScore />} />
                  <Route path="/provider/work-setup" element={<ProviderWorkSetup />} />
                  <Route path="/provider/availability" element={<ProviderAvailability />} />
                  <Route path="/provider/more" element={<MoreMenuPage />} />
                  <Route path="/provider/notifications" element={<SharedNotifications />} />
                </Route>

                {/* Admin Console */}
                <Route element={<ProtectedRoute requiredRole="admin"><AdminShell /></ProtectedRoute>}>
                  <Route path="/admin" element={<AdminDashboard />} />
                  <Route path="/admin/zones" element={<AdminZones />} />
                  <Route path="/admin/zones/builder" element={<AdminZoneBuilder />} />
                  <Route path="/admin/capacity" element={<AdminCapacity />} />
                  <Route path="/admin/skus" element={<AdminSKUs />} />
                  <Route path="/admin/plans" element={<AdminPlans />} />
                  <Route path="/admin/subscriptions" element={<AdminSubscriptions />} />
                  <Route path="/admin/providers" element={<AdminProviders />} />
                  <Route path="/admin/providers/:id" element={<AdminProviderDetail />} />
                  <Route path="/admin/providers/applications" element={<AdminApplications />} />
                  <Route path="/admin/providers/applications/:id" element={<AdminApplicationDetail />} />
                  <Route path="/admin/jobs" element={<AdminJobs />} />
                  <Route path="/admin/jobs/:jobId" element={<AdminJobDetail />} />
                  <Route path="/admin/scheduling" element={<AdminScheduling />} />
                  <Route path="/admin/scheduling/policy" element={<AdminSchedulingPolicy />} />
                  <Route path="/admin/scheduling/planner" element={<AdminPlannerDashboard />} />
                  <Route path="/admin/assignments" element={<AdminAssignmentDashboard />} />
                  <Route path="/admin/assignments/config" element={<AdminAssignmentConfig />} />
                  <Route path="/admin/scheduling/windows" element={<AdminWindowTemplates />} />
                  <Route path="/admin/scheduling/exceptions" element={<AdminSchedulingExceptions />} />
                  <Route path="/admin/service-days" element={<AdminServiceDays />} />
                  <Route path="/admin/bundles" element={<AdminBundles />} />
                  <Route path="/admin/support" element={<AdminSupport />} />
                  <Route path="/admin/support/tickets/:ticketId" element={<AdminSupportTicketDetail />} />
                  <Route path="/admin/support/policies" element={<AdminSupportPolicies />} />
                  <Route path="/admin/support/macros" element={<AdminSupportMacros />} />
                  <Route path="/admin/incentives" element={<AdminIncentives />} />
                  <Route path="/admin/growth" element={<AdminGrowth />} />
                  <Route path="/admin/notification-health" element={<AdminNotificationHealth />} />
                  <Route path="/admin/feedback" element={<AdminFeedback />} />
                  <Route path="/admin/test-toggles" element={<AdminTestToggles />} />
                  <Route path="/admin/ops" element={<AdminOpsCockpit />} />
                  <Route path="/admin/ops/dispatch" element={<AdminDispatcherQueues />} />
                  <Route path="/admin/ops/zones" element={<AdminOpsZones />} />
                  <Route path="/admin/ops/zones/:zoneId" element={<AdminOpsZoneDetail />} />
                  <Route path="/admin/ops/service-days" element={<AdminOpsServiceDays />} />
                  <Route path="/admin/ops/jobs" element={<AdminOpsJobs />} />
                  <Route path="/admin/ops/billing" element={<AdminOpsBilling />} />
                  <Route path="/admin/ops/support" element={<AdminOpsSupport />} />
                  <Route path="/admin/ops/growth" element={<AdminOpsGrowth />} />
                  <Route path="/admin/ops/definitions" element={<AdminOpsDefinitions />} />
                  <Route path="/admin/ops/levels" element={<AdminLevelAnalytics />} />
                  <Route path="/admin/reports" element={<AdminReports />} />
                  <Route path="/admin/audit" element={<AdminAudit />} />
                  <Route path="/admin/billing" element={<AdminBilling />} />
                  <Route path="/admin/billing/customers/:customerId" element={<AdminCustomerLedger />} />
                  <Route path="/admin/payouts" element={<AdminPayouts />} />
                  <Route path="/admin/payouts/providers/:providerOrgId" element={<AdminProviderLedger />} />
                  <Route path="/admin/exceptions" element={<AdminExceptions />} />
                  <Route path="/admin/ops/exceptions" element={<AdminOpsExceptions />} />
                  <Route path="/admin/ops/exception-analytics" element={<AdminExceptionAnalytics />} />
                  <Route path="/admin/settings" element={<AdminSettings />} />
                  <Route path="/admin/more" element={<MoreMenuPage />} />
                  <Route path="/admin/control/pricing" element={<AdminControlPricing />} />
                  <Route path="/admin/control/payouts" element={<AdminControlPayouts />} />
                  <Route path="/admin/control/change-requests" element={<AdminControlChangeRequests />} />
                  <Route path="/admin/control/change-log" element={<AdminControlChangeLog />} />
                  <Route path="/admin/control/config" element={<AdminControlConfig />} />
                  <Route path="/admin/playbooks" element={<AdminPlaybooks />} />
                  <Route path="/admin/sku-calibration" element={<AdminSkuCalibration />} />
                  <Route path="/admin/cron-health" element={<AdminCronHealth />} />
                  <Route path="/admin/notifications" element={<SharedNotifications />} />
                </Route>

                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
