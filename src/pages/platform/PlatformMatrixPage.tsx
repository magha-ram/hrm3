import { useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SystemMatrixGrid, ActiveAlertsPanel } from '@/components/platform/matrix';
import { AlertRulesManager } from '@/components/platform/alerts/AlertRulesManager';
import { AlertHistoryTable } from '@/components/platform/alerts/AlertHistoryTable';
import { MonitoringConfigPanel } from '@/components/platform/monitoring/MonitoringConfigPanel';
import { LayoutGrid, AlertTriangle, Settings, History } from 'lucide-react';

export default function PlatformMatrixPage() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="flex-1 space-y-6 p-6">
      <PageHeader
        title="System Matrix"
        description="Complete visibility, monitoring, and alerts for all system components"
      />
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="dashboard" className="gap-2">
            <LayoutGrid className="h-4 w-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </TabsTrigger>
          <TabsTrigger value="alerts" className="gap-2">
            <AlertTriangle className="h-4 w-4" />
            <span className="hidden sm:inline">Alerts</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <History className="h-4 w-4" />
            <span className="hidden sm:inline">History</span>
          </TabsTrigger>
          <TabsTrigger value="config" className="gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Config</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="dashboard" className="space-y-6">
          <SystemMatrixGrid onAlertClick={() => setActiveTab('alerts')} />
          <ActiveAlertsPanel />
        </TabsContent>
        
        <TabsContent value="alerts" className="space-y-6">
          <ActiveAlertsPanel />
          <AlertRulesManager />
        </TabsContent>
        
        <TabsContent value="history">
          <AlertHistoryTable />
        </TabsContent>
        
        <TabsContent value="config">
          <MonitoringConfigPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
