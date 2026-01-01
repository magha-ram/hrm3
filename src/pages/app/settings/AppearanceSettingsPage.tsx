import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Sun, Moon, Monitor, Check } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const ACCENT_COLORS = [
  { name: 'Default', value: 'default', color: 'hsl(221.2 83.2% 53.3%)' },
  { name: 'Rose', value: 'rose', color: 'hsl(346.8 77.2% 49.8%)' },
  { name: 'Orange', value: 'orange', color: 'hsl(24.6 95% 53.1%)' },
  { name: 'Green', value: 'green', color: 'hsl(142.1 76.2% 36.3%)' },
  { name: 'Purple', value: 'purple', color: 'hsl(262.1 83.3% 57.8%)' },
  { name: 'Cyan', value: 'cyan', color: 'hsl(192 91% 36%)' },
];

export function AppearanceSettingsPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [accentColor, setAccentColor] = useState('default');
  const [compactMode, setCompactMode] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
    // Load saved preferences
    const savedAccent = localStorage.getItem('accent-color') || 'default';
    const savedCompact = localStorage.getItem('compact-mode') === 'true';
    setAccentColor(savedAccent);
    setCompactMode(savedCompact);
  }, []);

  const handleAccentChange = (value: string) => {
    setAccentColor(value);
    localStorage.setItem('accent-color', value);
    // In a real app, you'd apply the accent color to CSS variables here
    toast.success('Accent color updated');
  };

  const handleCompactModeChange = (checked: boolean) => {
    setCompactMode(checked);
    localStorage.setItem('compact-mode', String(checked));
    // In a real app, you'd apply compact mode styles here
    toast.success(`Compact mode ${checked ? 'enabled' : 'disabled'}`);
  };

  if (!mounted) return null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Appearance</h2>
        <p className="text-muted-foreground">Customize the look and feel of your workspace</p>
      </div>

      {/* Theme Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Theme</CardTitle>
          <CardDescription>Select your preferred color scheme</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={theme}
            onValueChange={setTheme}
            className="grid grid-cols-3 gap-4"
          >
            <Label
              htmlFor="theme-light"
              className={cn(
                "flex flex-col items-center justify-center gap-2 rounded-lg border-2 p-4 cursor-pointer hover:bg-muted/50 transition-colors",
                theme === 'light' ? 'border-primary bg-primary/5' : 'border-muted'
              )}
            >
              <RadioGroupItem value="light" id="theme-light" className="sr-only" />
              <Sun className="h-6 w-6" />
              <span className="text-sm font-medium">Light</span>
            </Label>
            <Label
              htmlFor="theme-dark"
              className={cn(
                "flex flex-col items-center justify-center gap-2 rounded-lg border-2 p-4 cursor-pointer hover:bg-muted/50 transition-colors",
                theme === 'dark' ? 'border-primary bg-primary/5' : 'border-muted'
              )}
            >
              <RadioGroupItem value="dark" id="theme-dark" className="sr-only" />
              <Moon className="h-6 w-6" />
              <span className="text-sm font-medium">Dark</span>
            </Label>
            <Label
              htmlFor="theme-system"
              className={cn(
                "flex flex-col items-center justify-center gap-2 rounded-lg border-2 p-4 cursor-pointer hover:bg-muted/50 transition-colors",
                theme === 'system' ? 'border-primary bg-primary/5' : 'border-muted'
              )}
            >
              <RadioGroupItem value="system" id="theme-system" className="sr-only" />
              <Monitor className="h-6 w-6" />
              <span className="text-sm font-medium">System</span>
            </Label>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Accent Color */}
      <Card>
        <CardHeader>
          <CardTitle>Accent Color</CardTitle>
          <CardDescription>Choose your primary accent color</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {ACCENT_COLORS.map((color) => (
              <button
                key={color.value}
                onClick={() => handleAccentChange(color.value)}
                className={cn(
                  "h-10 w-10 rounded-full flex items-center justify-center transition-transform hover:scale-110",
                  accentColor === color.value && "ring-2 ring-offset-2 ring-offset-background"
                )}
                style={{ backgroundColor: color.color }}
                title={color.name}
              >
                {accentColor === color.value && (
                  <Check className="h-5 w-5 text-white" />
                )}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Display Options */}
      <Card>
        <CardHeader>
          <CardTitle>Display Options</CardTitle>
          <CardDescription>Adjust how content is displayed</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="compact-mode">Compact Mode</Label>
              <p className="text-sm text-muted-foreground">
                Reduce spacing and padding for a denser interface
              </p>
            </div>
            <Switch
              id="compact-mode"
              checked={compactMode}
              onCheckedChange={handleCompactModeChange}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default AppearanceSettingsPage;