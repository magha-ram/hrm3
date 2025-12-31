import { AlertTriangle, X, RefreshCw, ExternalLink, Clock, CheckCircle, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSubdomainHealth } from '@/hooks/useSubdomainHealth';
import { useDomainCompany } from '@/hooks/useDomainCompany';

export function SubdomainHealthBanner() {
  const { isDomainBased, subdomain, baseDomain } = useDomainCompany();
  const { health, isChecking, isDismissed, checkHealth, dismiss } = useSubdomainHealth();

  // Don't show if not accessing via subdomain
  if (!isDomainBased || !subdomain) {
    return null;
  }

  // Don't show if dismissed or still checking initial state
  if (isDismissed) {
    return null;
  }

  // Don't show if healthy or no health data yet (still loading)
  if (!health || health.isHealthy) {
    return null;
  }

  const fullDomain = `${subdomain}.${baseDomain}`;
  const isPropagating = health.propagationStatus === 'pending' || health.propagationStatus === 'partial';

  // Get status icon and color
  const getStatusDisplay = () => {
    switch (health.propagationStatus) {
      case 'complete':
        return { icon: CheckCircle, color: 'text-green-500', bgColor: 'bg-green-500/10', borderColor: 'border-green-500/20' };
      case 'partial':
        return { icon: Clock, color: 'text-amber-500', bgColor: 'bg-amber-500/10', borderColor: 'border-amber-500/20' };
      case 'pending':
      default:
        return { icon: AlertTriangle, color: 'text-amber-500', bgColor: 'bg-amber-500/10', borderColor: 'border-amber-500/20' };
    }
  };

  const status = getStatusDisplay();
  const StatusIcon = status.icon;

  return (
    <div className={`${status.bgColor} border-b ${status.borderColor} px-4 py-3`}>
      <div className="flex items-start gap-3 max-w-7xl mx-auto">
        <StatusIcon className={`h-5 w-5 ${status.color} flex-shrink-0 mt-0.5`} />
        
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
            {isPropagating ? 'DNS Propagation In Progress' : 'Subdomain DNS Configuration Issue'}
          </p>
          
          <p className="text-sm text-amber-600 dark:text-amber-500 mt-1">
            <span className="font-mono">{fullDomain}</span>
            {isPropagating ? (
              <span> is propagating globally. This can take 24-72 hours after changing nameservers.</span>
            ) : (
              <span> is not properly configured.</span>
            )}
          </p>

          {/* DNS Provider Status */}
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <Globe className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">Checked via:</span>
              <span className="font-medium">{health.checkSource}</span>
            </div>
            
            {health.googleDnsIp && (
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground">Google:</span>
                <span className={`font-mono ${health.googleDnsIp === health.expectedIp ? 'text-green-600' : 'text-amber-600'}`}>
                  {health.googleDnsIp}
                </span>
              </div>
            )}
            
            {health.cloudflareDnsIp && (
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground">Cloudflare:</span>
                <span className={`font-mono ${health.cloudflareDnsIp === health.expectedIp ? 'text-green-600' : 'text-amber-600'}`}>
                  {health.cloudflareDnsIp}
                </span>
              </div>
            )}
            
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">Expected:</span>
              <span className="font-mono text-green-600">{health.expectedIp}</span>
            </div>
          </div>

          {/* Propagation Progress */}
          {isPropagating && (
            <div className="mt-3 p-2 rounded bg-background/50 border border-border/50">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-amber-500 animate-pulse" />
                <span className="font-medium">
                  {health.propagationStatus === 'partial' 
                    ? 'Partial propagation - some DNS servers updated' 
                    : 'Waiting for DNS propagation'}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                DNS changes take time to propagate across global servers. 
                {health.propagationStatus === 'partial' 
                  ? ' Your subdomain may already work in some regions.'
                  : ' Please wait and check again in a few hours.'}
              </p>
            </div>
          )}
          
          {!isPropagating && (
            <div className="mt-2 text-sm text-amber-600 dark:text-amber-500">
              <p className="font-medium">To fix this:</p>
              <ol className="list-decimal list-inside mt-1 space-y-1">
                <li>Go to your domain registrar's DNS settings for <span className="font-mono">{baseDomain}</span></li>
                <li>Add or update an A record: <span className="font-mono">*</span> → <span className="font-mono">{health.expectedIp}</span></li>
                <li>Wait 5-30 minutes for DNS propagation</li>
              </ol>
            </div>
          )}

          <div className="flex items-center gap-2 mt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={checkHealth}
              disabled={isChecking}
              className="border-amber-500/30 text-amber-700 dark:text-amber-400 hover:bg-amber-500/10"
            >
              <RefreshCw className={`h-4 w-4 mr-1.5 ${isChecking ? 'animate-spin' : ''}`} />
              Check Again
            </Button>
            <a
              href={`https://dnschecker.org/#A/${fullDomain}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-amber-600 dark:text-amber-500 hover:underline inline-flex items-center gap-1"
            >
              Check global propagation
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={dismiss}
          className="text-amber-500 hover:text-amber-700 hover:bg-amber-500/10 flex-shrink-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
