export type AnnotationType = 'circle' | 'arrow' | 'rectangle' | 'text' | 'number' | 'highlight';

export interface BaseAnnotation {
  id: string;
  type: AnnotationType;
  color: string;
  strokeWidth?: number;
}

export interface CircleAnnotation extends BaseAnnotation {
  type: 'circle';
  x: number;
  y: number;
  radius: number;
}

export interface ArrowAnnotation extends BaseAnnotation {
  type: 'arrow';
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

export interface RectangleAnnotation extends BaseAnnotation {
  type: 'rectangle';
  x: number;
  y: number;
  width: number;
  height: number;
  fill?: string;
}

export interface TextAnnotation extends BaseAnnotation {
  type: 'text';
  x: number;
  y: number;
  text: string;
  fontSize: number;
  backgroundColor?: string;
}

export interface NumberAnnotation extends BaseAnnotation {
  type: 'number';
  x: number;
  y: number;
  number: number;
  size: number;
}

export interface HighlightAnnotation extends BaseAnnotation {
  type: 'highlight';
  x: number;
  y: number;
  width: number;
  height: number;
  opacity: number;
}

export type Annotation = 
  | CircleAnnotation 
  | ArrowAnnotation 
  | RectangleAnnotation 
  | TextAnnotation 
  | NumberAnnotation 
  | HighlightAnnotation;

export interface HelpGuideStep {
  id: string;
  guide_id: string;
  step_number: number;
  title: string;
  description?: string;
  screenshot_url?: string;
  annotations: Annotation[];
  created_at: string;
}

export interface HelpGuideStepInput {
  title: string;
  description?: string;
  screenshot_url?: string;
  annotations?: Annotation[];
}

export interface HelpGuide {
  id: string;
  company_id?: string;
  title: string;
  description?: string;
  module?: string;
  category?: string;
  roles?: string[];
  is_active: boolean;
  is_platform_guide: boolean;
  sort_order: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
  steps?: HelpGuideStep[];
}

export interface HelpGuideInput {
  title: string;
  description?: string;
  module?: string | null;
  category?: string | null;
  roles?: string[] | null;
  is_active?: boolean;
  is_platform_guide?: boolean;
  steps?: HelpGuideStepInput[];
}
