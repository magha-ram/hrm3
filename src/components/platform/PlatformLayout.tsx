import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { PlatformSidebar } from './PlatformSidebar';
import { PlatformHeader } from './PlatformHeader';
import { AppFooter } from '@/components/layout/AppFooter';
import { usePlatformFooter } from '@/hooks/usePlatformFooter';

export function PlatformLayout() {
  const { isLoading, isAuthenticated, isPlatformAdmin } = useAuth();
  const { showFooter } = usePlatformFooter();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  if (!isPlatformAdmin) {
    return <Navigate to="/app/dashboard" replace />;
  }

  return (
    <div className="h-screen flex w-full overflow-hidden bg-background">
      <PlatformSidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Fixed header */}
        <div className="shrink-0">
          <PlatformHeader />
        </div>
        {/* Scrollable main content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden min-w-0 p-6">
          <Outlet />
        </main>
        {/* Fixed footer */}
        <AppFooter showFooter={showFooter} />
      </div>
    </div>
  );
}
