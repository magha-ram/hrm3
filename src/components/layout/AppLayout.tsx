import { Outlet } from 'react-router-dom';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { AppHeader } from './AppHeader';
import { FrozenBanner } from './FrozenBanner';
import { TrialBanner } from './TrialBanner';
import { ImpersonationBanner } from '@/components/platform/ImpersonationBanner';
import { SubdomainHealthBanner } from '@/components/domain/SubdomainHealthBanner';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { Loader2 } from 'lucide-react';

export function AppLayout() {
  const { isLoading } = useRequireAuth({ requireCompany: true });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <SidebarInset className="flex-1 flex flex-col">
          <ImpersonationBanner />
          <SubdomainHealthBanner />
          <AppHeader />
          <FrozenBanner />
          <TrialBanner />
          <main className="flex-1 overflow-auto">
            <Outlet />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
