import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Calendar,
  Clock,
  Users,
  UserPlus,
  DollarSign,
  CheckCircle,
  FileText,
  Settings,
  ChevronRight,
} from 'lucide-react';
import type { QuickGuide } from '@/config/help-center';

const ICON_MAP: Record<string, React.ElementType> = {
  Calendar,
  Clock,
  Users,
  UserPlus,
  DollarSign,
  CheckCircle,
  FileText,
  Settings,
};

interface QuickGuideCardProps {
  guide: QuickGuide;
}

export function QuickGuideCard({ guide }: QuickGuideCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const Icon = ICON_MAP[guide.icon] || FileText;

  return (
    <>
      <Card
        className="cursor-pointer hover:shadow-md hover:border-primary/50 transition-all"
        onClick={() => setIsOpen(true)}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium mb-0.5">{guide.title}</h4>
              <p className="text-sm text-muted-foreground line-clamp-1">
                {guide.description}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="secondary" className="text-xs">
                  {guide.steps.length} steps
                </Badge>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <DialogTitle>{guide.title}</DialogTitle>
                <DialogDescription>{guide.description}</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {guide.steps.map((step, index) => (
              <div key={step.step} className="flex gap-3">
                <div className="flex-shrink-0">
                  <div className="h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                    {step.step}
                  </div>
                  {index < guide.steps.length - 1 && (
                    <div className="w-px h-full bg-border ml-3.5 mt-1" />
                  )}
                </div>
                <div className="pb-4">
                  <p className="font-medium text-sm">{step.title}</p>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end mt-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
