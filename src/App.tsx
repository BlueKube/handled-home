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
import MoreMenuPage from "@/components/MoreMenu";

// Customer pages
import CustomerDashboard from "@/pages/customer/Dashboard";
import CustomerBuild from "@/pages/customer/Build";
import CustomerHistory from "@/pages/customer/History";
import CustomerSubscription from "@/pages/customer/Subscription";
import CustomerProperty from "@/pages/customer/Property";
import CustomerBilling from "@/pages/customer/Billing";
import CustomerReferrals from "@/pages/customer/Referrals";
import CustomerSupport from "@/pages/customer/Support";
import CustomerSettings from "@/pages/customer/Settings";
import CustomerServices from "@/pages/customer/Services";
import CustomerPlans from "@/pages/customer/Plans";
import CustomerPlanDetail from "@/pages/customer/PlanDetail";
import CustomerRoutine from "@/pages/customer/Routine";
import CustomerSubscribe from "@/pages/customer/Subscribe";
import CustomerServiceDay from "@/pages/customer/ServiceDay";
import CustomerRoutineReview from "@/pages/customer/RoutineReview";
import CustomerRoutineConfirm from "@/pages/customer/RoutineConfirm";

// Provider pages
import ProviderDashboard from "@/pages/provider/Dashboard";
import ProviderJobs from "@/pages/provider/Jobs";
import ProviderSKUs from "@/pages/provider/SKUs";
import ProviderEarnings from "@/pages/provider/Earnings";
import ProviderPerformance from "@/pages/provider/Performance";
import ProviderOrganization from "@/pages/provider/Organization";
import ProviderCoverage from "@/pages/provider/Coverage";
import ProviderSettings from "@/pages/provider/Settings";

// Admin pages
import AdminDashboard from "@/pages/admin/Dashboard";
import AdminZones from "@/pages/admin/Zones";
import AdminCapacity from "@/pages/admin/Capacity";
import AdminSKUs from "@/pages/admin/SKUs";
import AdminPlans from "@/pages/admin/Plans";
import AdminSubscriptions from "@/pages/admin/Subscriptions";
import AdminProviders from "@/pages/admin/Providers";
import AdminScheduling from "@/pages/admin/Scheduling";
import AdminSupport from "@/pages/admin/Support";
import AdminIncentives from "@/pages/admin/Incentives";
import AdminReports from "@/pages/admin/Reports";
import AdminAudit from "@/pages/admin/Audit";
import AdminSettings from "@/pages/admin/Settings";
import AdminServiceDays from "@/pages/admin/ServiceDays";
import AdminBundles from "@/pages/admin/Bundles";

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

              {/* Customer App */}
              <Route element={<ProtectedRoute requiredRole="customer"><AppLayout /></ProtectedRoute>}>
                <Route path="/customer/property" element={<CustomerProperty />} />
                <Route path="/customer/plans" element={<CustomerPlans />} />
                <Route path="/customer/plans/:planId" element={<CustomerPlanDetail />} />
                <Route path="/customer/routine" element={<CustomerPropertyGate><CustomerRoutine /></CustomerPropertyGate>} />
                <Route path="/customer/routine/review" element={<CustomerPropertyGate><CustomerRoutineReview /></CustomerPropertyGate>} />
                <Route path="/customer/routine/confirm" element={<CustomerPropertyGate><CustomerRoutineConfirm /></CustomerPropertyGate>} />
                <Route path="/customer/subscribe" element={<CustomerSubscribe />} />
                <Route path="/customer/service-day" element={<CustomerPropertyGate><CustomerServiceDay /></CustomerPropertyGate>} />
                <Route path="/customer" element={<CustomerPropertyGate><CustomerDashboard /></CustomerPropertyGate>} />
                <Route path="/customer/build" element={<CustomerPropertyGate><CustomerBuild /></CustomerPropertyGate>} />
                <Route path="/customer/history" element={<CustomerPropertyGate><CustomerHistory /></CustomerPropertyGate>} />
                <Route path="/customer/subscription" element={<CustomerPropertyGate><CustomerSubscription /></CustomerPropertyGate>} />
                <Route path="/customer/billing" element={<CustomerPropertyGate><CustomerBilling /></CustomerPropertyGate>} />
                <Route path="/customer/referrals" element={<CustomerPropertyGate><CustomerReferrals /></CustomerPropertyGate>} />
                <Route path="/customer/support" element={<CustomerPropertyGate><CustomerSupport /></CustomerPropertyGate>} />
                <Route path="/customer/settings" element={<CustomerPropertyGate><CustomerSettings /></CustomerPropertyGate>} />
                <Route path="/customer/services" element={<CustomerPropertyGate><CustomerServices /></CustomerPropertyGate>} />
                <Route path="/customer/more" element={<CustomerPropertyGate><MoreMenuPage /></CustomerPropertyGate>} />
              </Route>

              {/* Provider App */}
              <Route element={<ProtectedRoute requiredRole="provider"><AppLayout /></ProtectedRoute>}>
                <Route path="/provider" element={<ProviderDashboard />} />
                <Route path="/provider/jobs" element={<ProviderJobs />} />
                <Route path="/provider/skus" element={<ProviderSKUs />} />
                <Route path="/provider/earnings" element={<ProviderEarnings />} />
                <Route path="/provider/performance" element={<ProviderPerformance />} />
                <Route path="/provider/organization" element={<ProviderOrganization />} />
                <Route path="/provider/coverage" element={<ProviderCoverage />} />
                <Route path="/provider/settings" element={<ProviderSettings />} />
                <Route path="/provider/more" element={<MoreMenuPage />} />
              </Route>

              {/* Admin Console */}
              <Route element={<ProtectedRoute requiredRole="admin"><AppLayout /></ProtectedRoute>}>
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/zones" element={<AdminZones />} />
                <Route path="/admin/capacity" element={<AdminCapacity />} />
                <Route path="/admin/skus" element={<AdminSKUs />} />
                <Route path="/admin/plans" element={<AdminPlans />} />
                <Route path="/admin/subscriptions" element={<AdminSubscriptions />} />
                <Route path="/admin/providers" element={<AdminProviders />} />
                <Route path="/admin/scheduling" element={<AdminScheduling />} />
                <Route path="/admin/service-days" element={<AdminServiceDays />} />
                <Route path="/admin/bundles" element={<AdminBundles />} />
                <Route path="/admin/support" element={<AdminSupport />} />
                <Route path="/admin/incentives" element={<AdminIncentives />} />
                <Route path="/admin/reports" element={<AdminReports />} />
                <Route path="/admin/audit" element={<AdminAudit />} />
                <Route path="/admin/settings" element={<AdminSettings />} />
                <Route path="/admin/more" element={<MoreMenuPage />} />
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
