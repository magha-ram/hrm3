import { Card, CardContent } from '@/components/ui/card';
import { Play, Clock, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { VideoTutorial } from '@/config/help-center';

interface VideoTutorialCardProps {
  video: VideoTutorial;
}

export function VideoTutorialCard({ video }: VideoTutorialCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <div className="relative aspect-video bg-muted flex items-center justify-center">
        {video.thumbnailUrl ? (
          <img
            src={video.thumbnailUrl}
            alt={video.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
            <Play className="h-12 w-12" />
            <span className="text-sm">Video Tutorial</span>
          </div>
        )}
        <div className="absolute bottom-2 right-2 bg-background/90 text-foreground text-xs px-2 py-1 rounded flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {video.duration}
        </div>
      </div>
      <CardContent className="p-4">
        <h4 className="font-medium mb-1">{video.title}</h4>
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
          {video.description}
        </p>
        <Button variant="outline" size="sm" className="w-full" asChild>
          <a href={video.videoUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4 mr-2" />
            Watch Tutorial
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}
