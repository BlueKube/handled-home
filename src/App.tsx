import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "next-themes";

import AuthPage from "@/pages/AuthPage";
import NotFound from "@/pages/NotFound";
import { AppLayout } from "@/components/AppLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { CustomerPropertyGate } from "@/components/CustomerPropertyGate";
import { AdminShell } from "@/components/admin/AdminShell";
import MoreMenuPage from "@/components/MoreMenu";

// Customer pages
import CustomerDashboard from "@/pages/customer/Dashboard";
import CustomerBuild from "@/pages/customer/Build";
import CustomerVisitDetail from "@/pages/customer/VisitDetail";
import CustomerIssues from "@/pages/customer/Issues";
import CustomerSubscription from "@/pages/customer/Subscription";
import CustomerProperty from "@/pages/customer/Property";
import CustomerBilling from "@/pages/customer/Billing";
import CustomerBillingMethods from "@/pages/customer/BillingMethods";
import CustomerBillingHistory from "@/pages/customer/BillingHistory";
import CustomerBillingReceipt from "@/pages/customer/BillingReceipt";
import CustomerReferrals from "@/pages/customer/Referrals";
import CustomerSupport from "@/pages/customer/Support";
import CustomerSupportNew from "@/pages/customer/SupportNew";
import CustomerSupportTickets from "@/pages/customer/SupportTickets";
import CustomerSupportTicketDetail from "@/pages/customer/SupportTicketDetail";
import CustomerSettings from "@/pages/customer/Settings";
import CustomerServices from "@/pages/customer/Services";
import CustomerPlans from "@/pages/customer/Plans";
import CustomerPlanDetail from "@/pages/customer/PlanDetail";
import CustomerRoutine from "@/pages/customer/Routine";
import CustomerSubscribe from "@/pages/customer/Subscribe";
import CustomerServiceDay from "@/pages/customer/ServiceDay";
import CustomerRoutineReview from "@/pages/customer/RoutineReview";
import CustomerRoutineConfirm from "@/pages/customer/RoutineConfirm";
import CustomerOnboardingWizard from "@/pages/customer/OnboardingWizard";
import CustomerByocOnboardingWizard from "@/pages/customer/ByocOnboardingWizard";
import CustomerPhotoTimeline from "@/pages/customer/PhotoTimeline";
import CustomerHomeAssistant from "@/pages/customer/HomeAssistant";
import CustomerCoverageMap from "@/pages/customer/CoverageMap";
import CustomerPropertySizing from "@/pages/customer/PropertySizing";
import CustomerAppointmentPicker from "@/pages/customer/AppointmentPicker";
import CustomerSchedule from "@/pages/customer/Schedule";
import CustomerActivity from "@/pages/customer/Activity";
import CustomerReschedule from "@/pages/customer/Reschedule";
// Provider pages
import ProviderDashboard from "@/pages/provider/Dashboard";
import ProviderJobs from "@/pages/provider/Jobs";
import ProviderSKUs from "@/pages/provider/SKUs";
import ProviderEarnings from "@/pages/provider/Earnings";
import ProviderPayouts from "@/pages/provider/Payouts";
import ProviderPayoutHistory from "@/pages/provider/PayoutHistory";
import ProviderPerformance from "@/pages/provider/Performance";
import ProviderOrganization from "@/pages/provider/Organization";
import ProviderCoverage from "@/pages/provider/Coverage";
import ProviderSettings from "@/pages/provider/Settings";
import ProviderHistory from "@/pages/provider/History";
import ProviderJobDetail from "@/pages/provider/JobDetail";
import ProviderJobChecklist from "@/pages/provider/JobChecklist";
import ProviderJobPhotos from "@/pages/provider/JobPhotos";
import ProviderJobComplete from "@/pages/provider/JobComplete";
import ProviderOnboarding from "@/pages/provider/Onboarding";
import ProviderOnboardingOrg from "@/pages/provider/OnboardingOrg";
import ProviderOnboardingCoverage from "@/pages/provider/OnboardingCoverage";
import ProviderOnboardingCapabilities from "@/pages/provider/OnboardingCapabilities";
import ProviderOnboardingCompliance from "@/pages/provider/OnboardingCompliance";
import ProviderOnboardingAgreement from "@/pages/provider/OnboardingAgreement";
import ProviderOnboardingReview from "@/pages/provider/OnboardingReview";
import ProviderWorkSetup from "@/pages/provider/WorkSetup";
import ProviderAvailability from "@/pages/provider/Availability";
import ProviderSupport from "@/pages/provider/Support";
import ProviderSupportTicketDetail from "@/pages/provider/SupportTicketDetail";
import ProviderReferrals from "@/pages/provider/Referrals";
import ProviderInviteCustomers from "@/pages/provider/InviteCustomers";
import ProviderApply from "@/pages/provider/Apply";
import ProviderByocCenter from "@/pages/provider/ByocCenter";
import ProviderByocCreateLink from "@/pages/provider/ByocCreateLink";
import InviteLanding from "@/pages/InviteLanding";
import ShareLanding from "@/pages/ShareLanding";
import ByocActivate from "@/pages/ByocActivate";

// Admin pages
import AdminDashboard from "@/pages/admin/Dashboard";
import AdminZones from "@/pages/admin/Zones";
import AdminZoneBuilder from "@/pages/admin/ZoneBuilder";
import AdminCapacity from "@/pages/admin/Capacity";
import AdminSKUs from "@/pages/admin/SKUs";
import AdminPlans from "@/pages/admin/Plans";
import AdminSubscriptions from "@/pages/admin/Subscriptions";
import AdminProviders from "@/pages/admin/Providers";
import AdminProviderDetail from "@/pages/admin/ProviderDetail";
import AdminApplications from "@/pages/admin/Applications";
import AdminApplicationDetail from "@/pages/admin/ApplicationDetail";
import AdminScheduling from "@/pages/admin/Scheduling";
import AdminSupport from "@/pages/admin/Support";
import AdminSupportTicketDetail from "@/pages/admin/SupportTicketDetail";
import AdminIncentives from "@/pages/admin/Incentives";
import AdminReports from "@/pages/admin/Reports";
import AdminAudit from "@/pages/admin/Audit";
import AdminSettings from "@/pages/admin/Settings";
import AdminOpsCockpit from "@/pages/admin/OpsCockpit";
import AdminOpsZones from "@/pages/admin/OpsZones";
import AdminOpsZoneDetail from "@/pages/admin/OpsZoneDetail";
import AdminOpsServiceDays from "@/pages/admin/OpsServiceDays";
import AdminOpsJobs from "@/pages/admin/OpsJobs";
import AdminOpsBilling from "@/pages/admin/OpsBilling";
import AdminOpsSupport from "@/pages/admin/OpsSupport";
import AdminOpsGrowth from "@/pages/admin/OpsGrowth";
import AdminOpsDefinitions from "@/pages/admin/OpsDefinitions";
import AdminLevelAnalytics from "@/pages/admin/LevelAnalytics";
import ProviderInsights from "@/pages/provider/Insights";
import ProviderInsightsHistory from "@/pages/provider/InsightsHistory";
import AdminServiceDays from "@/pages/admin/ServiceDays";
import AdminBundles from "@/pages/admin/Bundles";
import AdminJobs from "@/pages/admin/Jobs";
import AdminJobDetail from "@/pages/admin/JobDetail";
import AdminBilling from "@/pages/admin/Billing";
import AdminPayouts from "@/pages/admin/Payouts";
import AdminExceptions from "@/pages/admin/Exceptions";
import AdminOpsExceptions from "@/pages/admin/OpsExceptions";
import AdminExceptionAnalytics from "@/pages/admin/ExceptionAnalytics";
import AdminCustomerLedger from "@/pages/admin/CustomerLedger";
import AdminProviderLedger from "@/pages/admin/ProviderLedger";
import AdminSupportPolicies from "@/pages/admin/SupportPolicies";
import AdminSupportMacros from "@/pages/admin/SupportMacros";
import AdminGrowth from "@/pages/admin/Growth";
import AdminTestToggles from "@/pages/admin/TestToggles";
import AdminNotificationHealth from "@/pages/admin/NotificationHealth";
import AdminFeedback from "@/pages/admin/Feedback";
import SharedNotifications from "@/pages/shared/Notifications";
import ProviderQualityScore from "@/pages/provider/QualityScore";
import AdminDispatcherQueues from "@/pages/admin/DispatcherQueues";
import AdminControlPricing from "@/pages/admin/ControlPricing";
import AdminControlPayouts from "@/pages/admin/ControlPayouts";
import AdminControlChangeRequests from "@/pages/admin/ControlChangeRequests";
import AdminControlChangeLog from "@/pages/admin/ControlChangeLog";
import AdminControlConfig from "@/pages/admin/ControlConfig";
import AdminPlaybooks from "@/pages/admin/Playbooks";
import AdminCronHealth from "@/pages/admin/CronHealth";
import AdminSchedulingPolicy from "@/pages/admin/SchedulingPolicy";
import AdminPlannerDashboard from "@/pages/admin/PlannerDashboard";
import AdminAssignmentDashboard from "@/pages/admin/AssignmentDashboard";
import AdminAssignmentConfig from "@/pages/admin/AssignmentConfig";
import AdminWindowTemplates from "@/pages/admin/WindowTemplates";
import AdminSchedulingExceptions from "@/pages/admin/SchedulingExceptions";

const queryClient = new QueryClient();

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
                <Route path="/admin/cron-health" element={<AdminCronHealth />} />
                <Route path="/admin/notifications" element={<SharedNotifications />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
