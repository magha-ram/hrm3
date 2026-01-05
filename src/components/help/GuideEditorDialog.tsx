import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, GripVertical, Image as ImageIcon } from 'lucide-react';
import { AnnotationEditor } from './AnnotationEditor';
import { useCreateHelpGuide, useUpdateHelpGuide, useUploadGuideScreenshot } from '@/hooks/useHelpGuides';
import { useTenant } from '@/contexts/TenantContext';
import type { HelpGuide, Annotation, HelpGuideInput, HelpGuideStepInput } from '@/types/help-guides';

interface GuideEditorDialogProps {
  guide?: HelpGuide | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface StepData {
  id: string;
  title: string;
  description: string;
  screenshot_url?: string;
  annotations: Annotation[];
  localImageFile?: File;
  localImageUrl?: string;
}

const MODULES = [
  { value: 'dashboard', label: 'Dashboard' },
  { value: 'employees', label: 'Employees' },
  { value: 'leave', label: 'Leave Management' },
  { value: 'time', label: 'Time Tracking' },
  { value: 'payroll', label: 'Payroll' },
  { value: 'documents', label: 'Documents' },
  { value: 'settings', label: 'Settings' },
];

const ROLES = [
  { value: 'employee', label: 'Employee' },
  { value: 'manager', label: 'Manager' },
  { value: 'hr_manager', label: 'HR Manager' },
  { value: 'company_admin', label: 'Admin' },
];

export function GuideEditorDialog({ guide, open, onOpenChange }: GuideEditorDialogProps) {
  const { companyId } = useTenant();
  const createGuide = useCreateHelpGuide();
  const updateGuide = useUpdateHelpGuide();
  const uploadScreenshot = useUploadGuideScreenshot();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [module, setModule] = useState<string>('');
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [steps, setSteps] = useState<StepData[]>([]);
  const [activeStep, setActiveStep] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize form when guide changes
  useEffect(() => {
    if (guide) {
      setTitle(guide.title);
      setDescription(guide.description || '');
      setModule(guide.module || '');
      setSelectedRoles(guide.roles || []);
      setSteps(
        guide.steps?.map((s) => ({
          id: s.id,
          title: s.title,
          description: s.description || '',
          screenshot_url: s.screenshot_url,
          annotations: s.annotations || [],
        })) || []
      );
    } else {
      setTitle('');
      setDescription('');
      setModule('');
      setSelectedRoles([]);
      setSteps([]);
    }
    setActiveStep(0);
  }, [guide, open]);

  const handleAddStep = () => {
    const newStep: StepData = {
      id: `new-${Date.now()}`,
      title: `Step ${steps.length + 1}`,
      description: '',
      annotations: [],
    };
    setSteps([...steps, newStep]);
    setActiveStep(steps.length);
  };

  const handleRemoveStep = (index: number) => {
    const newSteps = steps.filter((_, i) => i !== index);
    setSteps(newSteps);
    if (activeStep >= newSteps.length) {
      setActiveStep(Math.max(0, newSteps.length - 1));
    }
  };

  const handleUpdateStep = (index: number, updates: Partial<StepData>) => {
    setSteps(steps.map((s, i) => (i === index ? { ...s, ...updates } : s)));
  };

  const handleImageUpload = (index: number, file: File) => {
    const localUrl = URL.createObjectURL(file);
    handleUpdateStep(index, {
      localImageFile: file,
      localImageUrl: localUrl,
    });
  };

  const handleSave = async () => {
    if (!title.trim() || steps.length === 0) return;
    
    setIsSaving(true);
    
    try {
      const guideId = guide?.id || `temp-${Date.now()}`;
      
      // Upload any local images first
      const processedSteps = await Promise.all(
        steps.map(async (step, index) => {
          let screenshot_url = step.screenshot_url;
          
          if (step.localImageFile && companyId) {
            screenshot_url = await uploadScreenshot.mutateAsync({
              file: step.localImageFile,
              companyId,
              guideId,
              stepNumber: index + 1,
            });
          }
          
          return {
            title: step.title,
            description: step.description,
            screenshot_url,
            annotations: step.annotations,
          };
        })
      );
      
      const guideData: HelpGuideInput = {
        title,
        description,
        module: module || null,
        roles: selectedRoles.length > 0 ? selectedRoles : null,
        is_active: true,
        steps: processedSteps as HelpGuideStepInput[],
      };
      
      if (guide?.id) {
        await updateGuide.mutateAsync({ id: guide.id, ...guideData });
      } else {
        await createGuide.mutateAsync(guideData);
      }
      
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save guide:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const currentStep = steps[activeStep];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl w-[95vw] h-[90vh] p-0 gap-0 flex flex-col">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle>
            {guide ? 'Edit Screenshot Guide' : 'Create Screenshot Guide'}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex overflow-hidden">
          {/* Left sidebar - Guide info and steps */}
          <div className="w-80 border-r flex flex-col bg-muted/30">
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-4">
                {/* Guide metadata */}
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="How to Request Leave"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Step-by-step guide..."
                      rows={2}
                    />
                  </div>
                  <div>
                    <Label>Module</Label>
                    <Select value={module} onValueChange={setModule}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select module" />
                      </SelectTrigger>
                      <SelectContent>
                        {MODULES.map((m) => (
                          <SelectItem key={m.value} value={m.value}>
                            {m.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Visible to Roles</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {ROLES.map((r) => (
                        <Badge
                          key={r.value}
                          variant={selectedRoles.includes(r.value) ? 'default' : 'outline'}
                          className="cursor-pointer"
                          onClick={() => {
                            setSelectedRoles(
                              selectedRoles.includes(r.value)
                                ? selectedRoles.filter((sr) => sr !== r.value)
                                : [...selectedRoles, r.value]
                            );
                          }}
                        >
                          {r.label}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Leave empty for all roles
                    </p>
                  </div>
                </div>

                <div className="h-px bg-border" />

                {/* Steps list */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Steps</Label>
                    <Button variant="ghost" size="sm" onClick={handleAddStep}>
                      <Plus className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {steps.map((step, index) => (
                      <Card
                        key={step.id}
                        className={`cursor-pointer transition-colors ${
                          index === activeStep ? 'ring-2 ring-primary' : ''
                        }`}
                        onClick={() => setActiveStep(index)}
                      >
                        <CardContent className="p-3 flex items-start gap-2">
                          <GripVertical className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="text-xs">
                                {index + 1}
                              </Badge>
                              <span className="text-sm font-medium truncate">
                                {step.title || `Step ${index + 1}`}
                              </span>
                            </div>
                            {(step.screenshot_url || step.localImageUrl) && (
                              <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                                <ImageIcon className="h-3 w-3" />
                                <span>Has screenshot</span>
                              </div>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 flex-shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveStep(index);
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                    {steps.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground text-sm">
                        <p>No steps yet</p>
                        <Button variant="outline" size="sm" className="mt-2" onClick={handleAddStep}>
                          <Plus className="h-4 w-4 mr-1" />
                          Add First Step
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </ScrollArea>
          </div>

          {/* Right side - Step editor */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {currentStep ? (
              <>
                <div className="p-4 border-b space-y-3">
                  <div>
                    <Label>Step Title</Label>
                    <Input
                      value={currentStep.title}
                      onChange={(e) => handleUpdateStep(activeStep, { title: e.target.value })}
                      placeholder="Click the Leave button"
                    />
                  </div>
                  <div>
                    <Label>Step Description</Label>
                    <Textarea
                      value={currentStep.description}
                      onChange={(e) => handleUpdateStep(activeStep, { description: e.target.value })}
                      placeholder="Describe what the user should do in this step..."
                      rows={2}
                    />
                  </div>
                </div>
                <ScrollArea className="flex-1">
                  <div className="p-4">
                    <Label className="mb-2 block">Screenshot & Annotations</Label>
                    <AnnotationEditor
                      imageUrl={currentStep.localImageUrl || currentStep.screenshot_url}
                      annotations={currentStep.annotations}
                      onAnnotationsChange={(annotations) =>
                        handleUpdateStep(activeStep, { annotations })
                      }
                      onImageUpload={(file) => handleImageUpload(activeStep, file)}
                    />
                  </div>
                </ScrollArea>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <p className="text-lg font-medium">No step selected</p>
                  <p className="text-sm">Add a step to start editing</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!title.trim() || steps.length === 0 || isSaving}
          >
            {isSaving ? 'Saving...' : guide ? 'Save Changes' : 'Create Guide'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
