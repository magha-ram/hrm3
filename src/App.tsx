import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthProvider } from "@/contexts/AuthContext";
import { TenantProvider } from "@/contexts/TenantContext";
import { ImpersonationProvider } from "@/contexts/ImpersonationContext";
import { SessionTimeoutWarning } from "@/components/SessionTimeoutWarning";
import { lazy, Suspense } from "react";

// Core pages (not lazy - needed immediately)
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import NotFound from "./pages/NotFound";
import Unauthorized from "./pages/Unauthorized";
import Setup from "./pages/Setup";
import { RootRedirect } from "@/components/RootRedirect";

// App layout
import { AppLayout } from "@/components/layout/AppLayout";
import { PlatformLayout } from "@/components/platform/PlatformLayout";

// Lazy load app pages
const DashboardPage = lazy(() => import("./pages/app/DashboardPage"));
const EmployeesPage = lazy(() => import("./pages/app/EmployeesPage"));
const DepartmentsPage = lazy(() => import("./pages/app/DepartmentsPage"));
const LeavePage = lazy(() => import("./pages/app/LeavePage"));
const TimePage = lazy(() => import("./pages/app/TimePage"));
const PayrollPage = lazy(() => import("./pages/app/PayrollPage"));
const RecruitmentPage = lazy(() => import("./pages/app/RecruitmentPage"));
const PerformancePage = lazy(() => import("./pages/app/PerformancePage"));
const DocumentsPage = lazy(() => import("./pages/app/DocumentsPage"));
const SettingsPage = lazy(() => import("./pages/app/SettingsPage"));
const AuditLogPage = lazy(() => import("./pages/app/AuditLogPage"));
const CompliancePage = lazy(() => import("./pages/app/CompliancePage"));
const IntegrationsPage = lazy(() => import("./pages/app/IntegrationsPage"));

// Settings sub-pages
const CompanySettingsPage = lazy(() => import("./pages/app/settings/CompanySettingsPage"));
const BillingSettingsPage = lazy(() => import("./pages/app/settings/BillingSettingsPage"));
const UsersSettingsPage = lazy(() => import("./pages/app/settings/UsersSettingsPage"));
const SecuritySettingsPage = lazy(() => import("./pages/app/settings/SecuritySettingsPage"));

// Utility pages
const HelpPage = lazy(() => import("./pages/app/HelpPage"));
// Platform admin pages
const PlatformDashboardPage = lazy(() => import("./pages/platform/PlatformDashboardPage"));
const PlatformAdminsPage = lazy(() => import("./pages/platform/PlatformAdminsPage"));
const PlatformCompaniesPage = lazy(() => import("./pages/platform/PlatformCompaniesPage"));
const PlatformCompanyDetailPage = lazy(() => import("./pages/platform/PlatformCompanyDetailPage"));
const PlatformPlansPage = lazy(() => import("./pages/platform/PlatformPlansPage"));
const PlatformAnalyticsPage = lazy(() => import("./pages/platform/PlatformAnalyticsPage"));
const PlatformSettingsPage = lazy(() => import("./pages/platform/PlatformSettingsPage"));
const PlatformAuditLogsPage = lazy(() => import("./pages/platform/PlatformAuditLogsPage"));
const PlatformImpersonationLogsPage = lazy(() => import("./pages/platform/PlatformImpersonationLogsPage"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: (failureCount, error) => {
        if (error instanceof Error && error.message.includes('permission')) {
          return false;
        }
        return failureCount < 3;
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
});

const PageLoader = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <ImpersonationProvider>
              <TenantProvider>
                <SessionTimeoutWarning />
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  {/* Public routes */}
                  <Route path="/" element={<RootRedirect />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/setup" element={<Setup />} />
                  <Route path="/onboarding" element={<Onboarding />} />
                  <Route path="/unauthorized" element={<Unauthorized />} />

                  {/* Platform admin routes */}
                  <Route path="/platform" element={<PlatformLayout />}>
                    <Route index element={<Navigate to="/platform/dashboard" replace />} />
                    <Route path="dashboard" element={<PlatformDashboardPage />} />
                    <Route path="admins" element={<PlatformAdminsPage />} />
                    <Route path="companies" element={<PlatformCompaniesPage />} />
                    <Route path="companies/:companyId" element={<PlatformCompanyDetailPage />} />
                    <Route path="plans" element={<PlatformPlansPage />} />
                    <Route path="analytics" element={<PlatformAnalyticsPage />} />
                    <Route path="audit-logs" element={<PlatformAuditLogsPage />} />
                    <Route path="impersonation-logs" element={<PlatformImpersonationLogsPage />} />
                    <Route path="settings" element={<PlatformSettingsPage />} />
                  </Route>

                  {/* Protected app routes */}
                  <Route path="/app" element={<AppLayout />}>
                    <Route index element={<Navigate to="/app/dashboard" replace />} />
                    <Route path="dashboard" element={<DashboardPage />} />
                    <Route path="employees" element={<EmployeesPage />} />
                    <Route path="departments" element={<DepartmentsPage />} />
                    <Route path="leave" element={<LeavePage />} />
                    <Route path="time" element={<TimePage />} />
                    <Route path="payroll" element={<PayrollPage />} />
                    <Route path="recruitment" element={<RecruitmentPage />} />
                    <Route path="performance" element={<PerformancePage />} />
                    <Route path="documents" element={<DocumentsPage />} />
                    <Route path="audit" element={<AuditLogPage />} />
                    <Route path="compliance" element={<CompliancePage />} />
                    <Route path="integrations" element={<IntegrationsPage />} />
                    <Route path="settings" element={<SettingsPage />}>
                      <Route index element={<Navigate to="/app/settings/company" replace />} />
                      <Route path="company" element={<CompanySettingsPage />} />
                      <Route path="billing" element={<BillingSettingsPage />} />
                      <Route path="users" element={<UsersSettingsPage />} />
                      <Route path="security" element={<SecuritySettingsPage />} />
                    </Route>
                    <Route path="help" element={<HelpPage />} />
                  </Route>

                  {/* Catch-all */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </TenantProvider>
          </ImpersonationProvider>
        </AuthProvider>
      </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;