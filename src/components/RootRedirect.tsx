import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import Landing from '@/pages/Landing';

export function RootRedirect() {
  const { isAuthenticated, isLoading, currentCompanyId } = useAuth();

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

  // Redirect to onboarding if no company
  if (!currentCompanyId) {
    return <Navigate to="/onboarding" replace />;
  }

  // Redirect to dashboard if authenticated with company
  return <Navigate to="/app/dashboard" replace />;
}