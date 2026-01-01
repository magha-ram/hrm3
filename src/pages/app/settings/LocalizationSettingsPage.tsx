import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Español' },
  { value: 'fr', label: 'Français' },
  { value: 'de', label: 'Deutsch' },
  { value: 'pt', label: 'Português' },
  { value: 'ar', label: 'العربية' },
  { value: 'zh', label: '中文' },
  { value: 'ja', label: '日本語' },
];

const DATE_FORMATS = [
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (12/31/2024)' },
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (31/12/2024)' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (2024-12-31)' },
  { value: 'DD.MM.YYYY', label: 'DD.MM.YYYY (31.12.2024)' },
];

const TIME_FORMATS = [
  { value: '12h', label: '12-hour (3:30 PM)' },
  { value: '24h', label: '24-hour (15:30)' },
];

const FIRST_DAY_OPTIONS = [
  { value: 'sunday', label: 'Sunday' },
  { value: 'monday', label: 'Monday' },
  { value: 'saturday', label: 'Saturday' },
];

const CURRENCY_FORMATS = [
  { value: 'USD', label: 'US Dollar ($)' },
  { value: 'EUR', label: 'Euro (€)' },
  { value: 'GBP', label: 'British Pound (£)' },
  { value: 'INR', label: 'Indian Rupee (₹)' },
  { value: 'JPY', label: 'Japanese Yen (¥)' },
  { value: 'AUD', label: 'Australian Dollar (A$)' },
  { value: 'CAD', label: 'Canadian Dollar (C$)' },
];

const TIMEZONES = [
  { value: 'UTC', label: 'UTC' },
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'Europe/London', label: 'London (GMT)' },
  { value: 'Europe/Paris', label: 'Paris (CET)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'Asia/Shanghai', label: 'Shanghai (CST)' },
  { value: 'Asia/Dubai', label: 'Dubai (GST)' },
  { value: 'Asia/Kolkata', label: 'India (IST)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST)' },
];

export function LocalizationSettingsPage() {
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState({
    language: 'en',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h',
    firstDayOfWeek: 'sunday',
    currency: 'USD',
    timezone: 'UTC',
  });

  useEffect(() => {
    // Load saved preferences
    const savedSettings = localStorage.getItem('localization-settings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  const handleChange = (key: keyof typeof settings, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Save to localStorage (in a real app, this would be saved to the database)
      localStorage.setItem('localization-settings', JSON.stringify(settings));
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API call
      toast.success('Localization settings saved');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Localization</h2>
        <p className="text-muted-foreground">Configure language, date, time, and regional settings</p>
      </div>

      {/* Language */}
      <Card>
        <CardHeader>
          <CardTitle>Language</CardTitle>
          <CardDescription>Select your preferred language</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={settings.language} onValueChange={(v) => handleChange('language', v)}>
            <SelectTrigger className="w-[280px]">
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGES.map(lang => (
                <SelectItem key={lang.value} value={lang.value}>
                  {lang.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Date & Time */}
      <Card>
        <CardHeader>
          <CardTitle>Date & Time</CardTitle>
          <CardDescription>Configure how dates and times are displayed</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Date Format</Label>
              <Select value={settings.dateFormat} onValueChange={(v) => handleChange('dateFormat', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select date format" />
                </SelectTrigger>
                <SelectContent>
                  {DATE_FORMATS.map(format => (
                    <SelectItem key={format.value} value={format.value}>
                      {format.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Time Format</Label>
              <Select value={settings.timeFormat} onValueChange={(v) => handleChange('timeFormat', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select time format" />
                </SelectTrigger>
                <SelectContent>
                  {TIME_FORMATS.map(format => (
                    <SelectItem key={format.value} value={format.value}>
                      {format.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>First Day of Week</Label>
              <Select value={settings.firstDayOfWeek} onValueChange={(v) => handleChange('firstDayOfWeek', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select first day" />
                </SelectTrigger>
                <SelectContent>
                  {FIRST_DAY_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Timezone</Label>
              <Select value={settings.timezone} onValueChange={(v) => handleChange('timezone', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map(tz => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Currency */}
      <Card>
        <CardHeader>
          <CardTitle>Currency</CardTitle>
          <CardDescription>Set your default currency for monetary values</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={settings.currency} onValueChange={(v) => handleChange('currency', v)}>
            <SelectTrigger className="w-[280px]">
              <SelectValue placeholder="Select currency" />
            </SelectTrigger>
            <SelectContent>
              {CURRENCY_FORMATS.map(currency => (
                <SelectItem key={currency.value} value={currency.value}>
                  {currency.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Save Changes
        </Button>
      </div>
    </div>
  );
}

export default LocalizationSettingsPage;