import { useTenant } from '@/contexts/TenantContext';
import { Clock } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export function TrialBanner() {
  const { isTrialing, trialDaysRemaining, isAdmin, planName } = useTenant();

  if (!isTrialing || trialDaysRemaining === null) return null;

  const urgency = trialDaysRemaining <= 3 ? 'destructive' : 'default';
  const message = trialDaysRemaining === 0
    ? 'Your trial ends today!'
    : trialDaysRemaining === 1
    ? 'Your trial ends tomorrow!'
    : `${trialDaysRemaining} days left in your ${planName || 'trial'} trial.`;

  return (
    <Alert variant={urgency} className="rounded-none border-x-0 border-t-0 bg-primary/10 text-primary border-primary/20">
      <Clock className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between flex-wrap gap-2">
        <span>{message}</span>
        {isAdmin && (
          <Link to="/settings/billing">
            <Button size="sm" variant="default">
              Upgrade Now
            </Button>
          </Link>
        )}
      </AlertDescription>
    </Alert>
  );
}
