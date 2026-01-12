import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type BackendStatus = 'checking' | 'healthy' | 'unhealthy' | 'error';

interface BackendHealthState {
  status: BackendStatus;
  lastChecked: Date | null;
  errorMessage: string | null;
  retryCount: number;
}

export function useBackendHealth(checkOnMount = true, checkIntervalMs = 60000) {
  const [state, setState] = useState<BackendHealthState>({
    status: 'checking',
    lastChecked: null,
    errorMessage: null,
    retryCount: 0,
  });

  const checkHealth = useCallback(async () => {
    setState(prev => ({ ...prev, status: 'checking' }));
    
    try {
      // Simple health check - try to reach the Supabase REST API
      // We use a lightweight query that doesn't require auth
      const startTime = Date.now();
      
      // Try to fetch from the API - this is a lightweight check
      const { error } = await supabase
        .from('platform_settings')
        .select('id')
        .limit(1)
        .maybeSingle();
      
      const responseTime = Date.now() - startTime;
      
      // If we get a response (even an RLS error), the backend is reachable
      // RLS errors mean the backend is working, just no permission
      if (!error || error.code === 'PGRST116' || error.message?.includes('permission')) {
        setState({
          status: 'healthy',
          lastChecked: new Date(),
          errorMessage: null,
          retryCount: 0,
        });
        return true;
      }
      
      // Network/connection errors indicate backend issues
      if (error.message?.includes('Failed to fetch') || 
          error.message?.includes('NetworkError') ||
          error.message?.includes('timeout') ||
          error.message?.includes('ECONNREFUSED')) {
        setState(prev => ({
          status: 'unhealthy',
          lastChecked: new Date(),
          errorMessage: 'Backend is unreachable. Please check your connection or try again later.',
          retryCount: prev.retryCount + 1,
        }));
        return false;
      }
      
      // Other errors - backend is reachable but something else is wrong
      setState({
        status: 'healthy',
        lastChecked: new Date(),
        errorMessage: null,
        retryCount: 0,
      });
      return true;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setState(prev => ({
        status: 'error',
        lastChecked: new Date(),
        errorMessage: `Connection error: ${errorMessage}`,
        retryCount: prev.retryCount + 1,
      }));
      return false;
    }
  }, []);

  // Check on mount
  useEffect(() => {
    if (checkOnMount) {
      checkHealth();
    }
  }, [checkOnMount, checkHealth]);

  // Periodic health checks
  useEffect(() => {
    if (checkIntervalMs <= 0) return;
    
    const interval = setInterval(() => {
      checkHealth();
    }, checkIntervalMs);
    
    return () => clearInterval(interval);
  }, [checkIntervalMs, checkHealth]);

  return {
    ...state,
    isHealthy: state.status === 'healthy',
    isChecking: state.status === 'checking',
    isUnhealthy: state.status === 'unhealthy' || state.status === 'error',
    checkHealth,
  };
}
