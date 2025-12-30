import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';

export default function PlatformAnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Analytics</h2>
        <p className="text-muted-foreground">Platform-wide analytics and insights</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Coming Soon</CardTitle>
          <CardDescription>
            Analytics dashboard is under development
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <BarChart3 className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              Analytics Coming Soon
            </h3>
            <p className="text-muted-foreground max-w-md">
              We're working on comprehensive analytics to help you understand platform usage, 
              revenue trends, and company engagement metrics.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
