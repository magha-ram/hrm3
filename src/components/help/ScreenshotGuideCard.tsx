import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Image, Layers } from 'lucide-react';
import type { HelpGuide } from '@/types/help-guides';

interface ScreenshotGuideCardProps {
  guide: HelpGuide;
  onClick: () => void;
}

export function ScreenshotGuideCard({ guide, onClick }: ScreenshotGuideCardProps) {
  const stepCount = guide.steps?.length || 0;
  const firstStep = guide.steps?.[0];
  const thumbnailUrl = firstStep?.screenshot_url;

  return (
    <Card 
      className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:-translate-y-1 overflow-hidden group"
      onClick={onClick}
    >
      {/* Thumbnail */}
      <div className="aspect-video bg-muted relative overflow-hidden">
        {thumbnailUrl ? (
          <img 
            src={thumbnailUrl} 
            alt={guide.title} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Image className="h-12 w-12 text-muted-foreground/40" />
          </div>
        )}
        {/* Step count badge */}
        <div className="absolute bottom-2 right-2">
          <Badge variant="secondary" className="bg-background/90 backdrop-blur-sm">
            <Layers className="h-3 w-3 mr-1" />
            {stepCount} step{stepCount !== 1 ? 's' : ''}
          </Badge>
        </div>
      </div>
      
      <CardContent className="p-4">
        <h3 className="font-semibold text-base mb-1 line-clamp-1 group-hover:text-primary transition-colors">
          {guide.title}
        </h3>
        {guide.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {guide.description}
          </p>
        )}
        <div className="flex items-center gap-2 mt-3">
          {guide.module && (
            <Badge variant="outline" className="text-xs">
              {guide.module}
            </Badge>
          )}
          {guide.roles && guide.roles.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {guide.roles.join(', ')}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
