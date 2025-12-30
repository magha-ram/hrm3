import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import Landing from '@/pages/Landing';

export function RootRedirect() {
  const { isAuthenticated, isLoading, user, currentCompanyId, isPlatformAdmin } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Show landing page for unauthenticated users
  if (!isAuthenticated) {
    return <Landing />;
  }

  // Wait for user context to load before deciding redirect
  // user being null means context is still loading
  if (user === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Platform admins go to platform dashboard
  if (isPlatformAdmin) {
    return <Navigate to="/platform/dashboard" replace />;
  }

  // Check if user has any companies
  const hasCompanies = user.companies && user.companies.length > 0;

  // Redirect to onboarding only if user has NO companies
  if (!hasCompanies) {
    return <Navigate to="/onboarding" replace />;
  }

  // Redirect to dashboard if authenticated with company
  return <Navigate to="/app/dashboard" replace />;
}