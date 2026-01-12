import React, { createContext, useContext, ReactNode } from 'react';
import { useBackendHealth, BackendStatus } from '@/hooks/useBackendHealth';

interface BackendHealthContextType {
  status: BackendStatus;
  isHealthy: boolean;
  isUnhealthy: boolean;
  isChecking: boolean;
  errorMessage: string | null;
  lastChecked: Date | null;
  retryCount: number;
  checkHealth: () => Promise<boolean>;
}

const BackendHealthContext = createContext<BackendHealthContextType | undefined>(undefined);

interface BackendHealthProviderProps {
  children: ReactNode;
  checkIntervalMs?: number;
}

export function BackendHealthProvider({ 
  children, 
  checkIntervalMs = 60000 
}: BackendHealthProviderProps) {
  const health = useBackendHealth(true, checkIntervalMs);

  return (
    <BackendHealthContext.Provider value={health}>
      {children}
    </BackendHealthContext.Provider>
  );
}

export function useBackendHealthContext() {
  const context = useContext(BackendHealthContext);
  if (context === undefined) {
    throw new Error('useBackendHealthContext must be used within a BackendHealthProvider');
  }
  return context;
}
