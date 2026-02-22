import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

import AuthPage from "@/pages/AuthPage";
import NotFound from "@/pages/NotFound";
import { AppLayout } from "@/components/AppLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";

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

// Provider pages
import ProviderDashboard from "@/pages/provider/Dashboard";
import ProviderJobs from "@/pages/provider/Jobs";
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
import AdminProviders from "@/pages/admin/Providers";
import AdminScheduling from "@/pages/admin/Scheduling";
import AdminSupport from "@/pages/admin/Support";
import AdminIncentives from "@/pages/admin/Incentives";
import AdminReports from "@/pages/admin/Reports";
import AdminAudit from "@/pages/admin/Audit";
import AdminSettings from "@/pages/admin/Settings";

const queryClient = new QueryClient();

function RootRedirect() {
  const { user, loading, activeRole } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/auth" replace />;
  return <Navigate to={`/${activeRole}`} replace />;
}

const App = () => (
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
              <Route path="/customer" element={<CustomerDashboard />} />
              <Route path="/customer/build" element={<CustomerBuild />} />
              <Route path="/customer/history" element={<CustomerHistory />} />
              <Route path="/customer/subscription" element={<CustomerSubscription />} />
              <Route path="/customer/property" element={<CustomerProperty />} />
              <Route path="/customer/billing" element={<CustomerBilling />} />
              <Route path="/customer/referrals" element={<CustomerReferrals />} />
              <Route path="/customer/support" element={<CustomerSupport />} />
              <Route path="/customer/settings" element={<CustomerSettings />} />
            </Route>

            {/* Provider App */}
            <Route element={<ProtectedRoute requiredRole="provider"><AppLayout /></ProtectedRoute>}>
              <Route path="/provider" element={<ProviderDashboard />} />
              <Route path="/provider/jobs" element={<ProviderJobs />} />
              <Route path="/provider/earnings" element={<ProviderEarnings />} />
              <Route path="/provider/performance" element={<ProviderPerformance />} />
              <Route path="/provider/organization" element={<ProviderOrganization />} />
              <Route path="/provider/coverage" element={<ProviderCoverage />} />
              <Route path="/provider/settings" element={<ProviderSettings />} />
            </Route>

            {/* Admin Console */}
            <Route element={<ProtectedRoute requiredRole="admin"><AppLayout /></ProtectedRoute>}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/zones" element={<AdminZones />} />
              <Route path="/admin/capacity" element={<AdminCapacity />} />
              <Route path="/admin/skus" element={<AdminSKUs />} />
              <Route path="/admin/plans" element={<AdminPlans />} />
              <Route path="/admin/providers" element={<AdminProviders />} />
              <Route path="/admin/scheduling" element={<AdminScheduling />} />
              <Route path="/admin/support" element={<AdminSupport />} />
              <Route path="/admin/incentives" element={<AdminIncentives />} />
              <Route path="/admin/reports" element={<AdminReports />} />
              <Route path="/admin/audit" element={<AdminAudit />} />
              <Route path="/admin/settings" element={<AdminSettings />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
