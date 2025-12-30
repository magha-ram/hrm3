import { useTenant } from '@/contexts/TenantContext';
import { Clock, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export function TrialBanner() {
  const { isTrialing, isPastDue, trialDaysRemaining, isAdmin, planName } = useTenant();

  // Show past-due warning (takes priority over trial)
  if (isPastDue) {
    return (
      <Alert variant="destructive" className="rounded-none border-x-0 border-t-0">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between flex-wrap gap-2">
          <span>Your payment is past due. Please update your billing to avoid service interruption.</span>
          {isAdmin && (
            <Link to="/settings/billing">
              <Button size="sm" variant="outline" className="bg-background">
                Update Billing
              </Button>
            </Link>
          )}
        </AlertDescription>
      </Alert>
    );
  }

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
