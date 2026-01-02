import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sun, Moon, Monitor, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useAppearance, type AccentColor } from '@/hooks/useAppearance';

const ACCENT_COLORS: { name: string; value: AccentColor; color: string }[] = [
  { name: 'Default', value: 'default', color: 'hsl(221.2 83.2% 53.3%)' },
  { name: 'Rose', value: 'rose', color: 'hsl(346.8 77.2% 49.8%)' },
  { name: 'Orange', value: 'orange', color: 'hsl(24.6 95% 53.1%)' },
  { name: 'Green', value: 'green', color: 'hsl(142.1 76.2% 36.3%)' },
  { name: 'Purple', value: 'purple', color: 'hsl(262.1 83.3% 57.8%)' },
  { name: 'Cyan', value: 'cyan', color: 'hsl(192 91% 36%)' },
  { name: 'Amber', value: 'amber', color: 'hsl(38 92% 50%)' },
  { name: 'Indigo', value: 'indigo', color: 'hsl(239 84% 67%)' },
];

const FONT_SIZES = [
  { value: 'small', label: 'Small' },
  { value: 'default', label: 'Default' },
  { value: 'large', label: 'Large' },
];

const BORDER_RADIUS = [
  { value: 'none', label: 'None' },
  { value: 'small', label: 'Small' },
  { value: 'default', label: 'Default' },
  { value: 'large', label: 'Large' },
];

export function AppearanceSettingsPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { 
    settings, 
    isLoading, 
    updateAccentColor, 
    updateCompactMode,
    updateFontSize,
    updateBorderRadius 
  } = useAppearance();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleAccentChange = (value: AccentColor) => {
    updateAccentColor(value);
    toast.success('Accent color updated');
  };

  const handleCompactModeChange = (checked: boolean) => {
    updateCompactMode(checked);
    toast.success(`Compact mode ${checked ? 'enabled' : 'disabled'}`);
  };

  const handleFontSizeChange = (value: string) => {
    updateFontSize(value as 'small' | 'default' | 'large');
    toast.success('Font size updated');
  };

  const handleBorderRadiusChange = (value: string) => {
    updateBorderRadius(value as 'none' | 'small' | 'default' | 'large');
    toast.success('Border radius updated');
  };

  if (!mounted || isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

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
          <CardDescription>Choose your primary accent color for buttons, links, and highlights</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {ACCENT_COLORS.map((color) => (
              <button
                key={color.value}
                onClick={() => handleAccentChange(color.value)}
                className={cn(
                  "h-10 w-10 rounded-full flex items-center justify-center transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background",
                  settings.accentColor === color.value && "ring-2 ring-offset-2 ring-offset-background ring-foreground"
                )}
                style={{ backgroundColor: color.color }}
                title={color.name}
              >
                {settings.accentColor === color.value && (
                  <Check className="h-5 w-5 text-white drop-shadow-md" />
                )}
              </button>
            ))}
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            Selected: <span className="font-medium capitalize">{settings.accentColor}</span>
          </p>
        </CardContent>
      </Card>

      {/* Display Options */}
      <Card>
        <CardHeader>
          <CardTitle>Display Options</CardTitle>
          <CardDescription>Adjust how content is displayed</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="compact-mode">Compact Mode</Label>
              <p className="text-sm text-muted-foreground">
                Reduce spacing and padding for a denser interface
              </p>
            </div>
            <Switch
              id="compact-mode"
              checked={settings.compactMode}
              onCheckedChange={handleCompactModeChange}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Font Size</Label>
              <Select value={settings.fontSize} onValueChange={handleFontSizeChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FONT_SIZES.map((size) => (
                    <SelectItem key={size.value} value={size.value}>
                      {size.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Border Radius</Label>
              <Select value={settings.borderRadius} onValueChange={handleBorderRadiusChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BORDER_RADIUS.map((radius) => (
                    <SelectItem key={radius.value} value={radius.value}>
                      {radius.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default AppearanceSettingsPage;