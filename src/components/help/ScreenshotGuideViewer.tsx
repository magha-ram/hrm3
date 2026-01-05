import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ChevronLeft, ChevronRight, X, Image } from 'lucide-react';
import { AnnotationCanvas } from './AnnotationCanvas';
import type { HelpGuide } from '@/types/help-guides';

interface ScreenshotGuideViewerProps {
  guide: HelpGuide | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ScreenshotGuideViewer({ guide, open, onOpenChange }: ScreenshotGuideViewerProps) {
  const [currentStep, setCurrentStep] = useState(0);
  
  const steps = guide?.steps || [];
  const totalSteps = steps.length;
  const step = steps[currentStep];
  const progress = totalSteps > 0 ? ((currentStep + 1) / totalSteps) * 100 : 0;

  // Reset step when guide changes
  useEffect(() => {
    if (open) {
      setCurrentStep(0);
    }
  }, [open, guide?.id]);

  const handlePrev = useCallback(() => {
    setCurrentStep((prev) => Math.max(0, prev - 1));
  }, []);

  const handleNext = useCallback(() => {
    setCurrentStep((prev) => Math.min(totalSteps - 1, prev + 1));
  }, [totalSteps]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'Escape') {
        onOpenChange(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, handlePrev, handleNext, onOpenChange]);

  if (!guide || totalSteps === 0) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl w-[95vw] h-[90vh] p-0 gap-0 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-3">
            <DialogTitle className="text-lg font-semibold">{guide.title}</DialogTitle>
            <Badge variant="secondary">
              Step {currentStep + 1} of {totalSteps}
            </Badge>
          </div>
          <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Progress bar */}
        <Progress value={progress} className="h-1 rounded-none" />

        {/* Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Step title and description */}
          <div className="px-6 py-4 border-b bg-muted/30">
            <h3 className="font-semibold text-lg">{step?.title}</h3>
            {step?.description && (
              <p className="text-muted-foreground mt-1">{step.description}</p>
            )}
          </div>

          {/* Screenshot with annotations */}
          <div className="flex-1 flex items-center justify-center p-6 bg-muted/10 overflow-auto">
            {step?.screenshot_url ? (
              <AnnotationCanvas
                imageUrl={step.screenshot_url}
                annotations={step.annotations || []}
                width={900}
                height={500}
                className="shadow-lg"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-muted-foreground">
                <Image className="h-16 w-16 mb-3 opacity-40" />
                <p>No screenshot available for this step</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between px-6 py-4 border-t bg-background">
          {/* Step indicators */}
          <div className="flex items-center gap-1.5">
            {steps.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentStep(index)}
                className={`w-2.5 h-2.5 rounded-full transition-colors ${
                  index === currentStep
                    ? 'bg-primary'
                    : index < currentStep
                    ? 'bg-primary/50'
                    : 'bg-muted-foreground/30'
                }`}
              />
            ))}
          </div>

          {/* Navigation buttons */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handlePrev}
              disabled={currentStep === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            {currentStep < totalSteps - 1 ? (
              <Button onClick={handleNext}>
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button onClick={() => onOpenChange(false)}>
                Finish
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
