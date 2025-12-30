import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

// Lazy load app pages
import { lazy, Suspense } from "react";
const PayrollPage = lazy(() => import("./pages/app/PayrollPage"));
const AuditLogPage = lazy(() => import("./pages/app/AuditLogPage"));
const CompliancePage = lazy(() => import("./pages/app/CompliancePage"));
const IntegrationsPage = lazy(() => import("./pages/app/IntegrationsPage"));

const queryClient = new QueryClient();

const PageLoader = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/payroll" element={<PayrollPage />} />
            <Route path="/audit" element={<AuditLogPage />} />
            <Route path="/compliance" element={<CompliancePage />} />
            <Route path="/integrations" element={<IntegrationsPage />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
