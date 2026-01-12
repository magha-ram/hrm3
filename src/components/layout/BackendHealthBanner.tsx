import { AlertTriangle, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useBackendHealth } from '@/hooks/useBackendHealth';
import { cn } from '@/lib/utils';

interface BackendHealthBannerProps {
  className?: string;
}

export function BackendHealthBanner({ className }: BackendHealthBannerProps) {
  const { status, errorMessage, isChecking, isUnhealthy, checkHealth, retryCount } = useBackendHealth(true, 30000);

  // Only show banner when unhealthy
  if (!isUnhealthy) {
    return null;
  }

  return (
    <Alert 
      variant="destructive" 
      className={cn(
        "rounded-none border-x-0 border-t-0 bg-destructive/10",
        className
      )}
    >
      <WifiOff className="h-4 w-4" />
      <AlertTitle className="flex items-center gap-2">
        Backend Unavailable
        {retryCount > 2 && (
          <span className="text-xs font-normal text-muted-foreground">
            (Retry {retryCount})
          </span>
        )}
      </AlertTitle>
      <AlertDescription className="flex items-center justify-between gap-4 flex-wrap">
        <span className="text-sm">
          {errorMessage || 'Unable to connect to the backend. Some features may not work.'}
        </span>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={checkHealth}
          disabled={isChecking}
          className="shrink-0"
        >
          {isChecking ? (
            <>
              <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
              Checking...
            </>
          ) : (
            <>
              <RefreshCw className="h-3 w-3 mr-1" />
              Retry Connection
            </>
          )}
        </Button>
      </AlertDescription>
    </Alert>
  );
}
