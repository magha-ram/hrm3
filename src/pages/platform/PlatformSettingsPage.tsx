import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings } from 'lucide-react';

export default function PlatformSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Platform Settings</h2>
        <p className="text-muted-foreground">Configure platform-wide settings</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Coming Soon</CardTitle>
          <CardDescription>
            Platform settings are under development
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Settings className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              Settings Coming Soon
            </h3>
            <p className="text-muted-foreground max-w-md">
              We're working on platform configuration options including email settings, 
              default plans, branding, and more.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
