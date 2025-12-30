import { useTenant } from '@/contexts/TenantContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Crown } from 'lucide-react';

export default function BillingSettingsPage() {
  const { planName, isTrialing, trialDaysRemaining, isFrozen } = useTenant();

  const plans = [
    { name: 'Free', price: '$0', features: ['10 employees', 'Basic directory'] },
    { name: 'Basic', price: '$29/mo', features: ['50 employees', 'Leave management', 'Time tracking'] },
    { name: 'Pro', price: '$79/mo', features: ['200 employees', 'All modules', 'Priority support'] },
    { name: 'Enterprise', price: 'Custom', features: ['Unlimited', 'SSO', 'API access', 'Dedicated support'] },
  ];

  return (
    <div className="space-y-6">
      {isFrozen && (
        <Card className="border-destructive bg-destructive/10">
          <CardHeader>
            <CardTitle className="text-destructive">Account Frozen</CardTitle>
            <CardDescription>
              Please update your payment method to reactivate your account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button>Update Payment Method</Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
          <CardDescription>
            You are currently on the{' '}
            <span className="font-medium">{planName || 'Free'}</span> plan
            {isTrialing && trialDaysRemaining !== null && (
              <span className="text-primary"> • {trialDaysRemaining} days left in trial</span>
            )}
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {plans.map((plan) => (
          <Card key={plan.name} className={plan.name === planName ? 'border-primary' : ''}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{plan.name}</CardTitle>
                {plan.name === planName && (
                  <Badge variant="default">Current</Badge>
                )}
              </div>
              <CardDescription className="text-2xl font-bold">{plan.price}</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    {feature}
                  </li>
                ))}
              </ul>
              {plan.name !== planName && (
                <Button variant="outline" className="w-full mt-4">
                  {plan.name === 'Enterprise' ? 'Contact Sales' : 'Upgrade'}
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
