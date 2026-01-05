import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Circle,
  ArrowRight,
  Square,
  Type,
  Hash,
  Highlighter,
  MousePointer2,
  Trash2,
  Undo2,
  Upload,
  Palette,
  Image as ImageIcon,
} from 'lucide-react';
import type { Annotation, AnnotationType } from '@/types/help-guides';

interface AnnotationEditorProps {
  imageUrl?: string;
  annotations: Annotation[];
  onAnnotationsChange: (annotations: Annotation[]) => void;
  onImageUpload: (file: File) => void;
}

const COLORS = [
  '#EF4444', // red
  '#F97316', // orange
  '#EAB308', // yellow
  '#22C55E', // green
  '#3B82F6', // blue
  '#8B5CF6', // purple
  '#EC4899', // pink
  '#000000', // black
];

export function AnnotationEditor({
  imageUrl,
  annotations,
  onAnnotationsChange,
  onImageUpload,
}: AnnotationEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tool, setTool] = useState<AnnotationType | 'select'>('select');
  const [color, setColor] = useState('#EF4444');
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [numberCounter, setNumberCounter] = useState(1);
  const [history, setHistory] = useState<Annotation[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load image
  useEffect(() => {
    if (!imageUrl) {
      setImage(null);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setImage(img);
      // Calculate scale
      const canvas = canvasRef.current;
      if (canvas) {
        const imgAspect = img.width / img.height;
        const canvasAspect = canvas.width / canvas.height;
        
        if (imgAspect > canvasAspect) {
          setScale(canvas.width / img.width);
          setOffset({ x: 0, y: (canvas.height - (canvas.width / imgAspect)) / 2 });
        } else {
          setScale(canvas.height / img.height);
          setOffset({ x: (canvas.width - (canvas.height * imgAspect)) / 2, y: 0 });
        }
      }
    };
    img.src = imageUrl;
  }, [imageUrl]);

  // Redraw canvas
  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#f3f4f6';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (image) {
      const drawWidth = image.width * scale;
      const drawHeight = image.height * scale;
      ctx.drawImage(image, offset.x, offset.y, drawWidth, drawHeight);
    }

    // Draw annotations
    annotations.forEach((ann) => {
      drawAnnotation(ctx, ann, ann.id === selectedId);
    });
  }, [image, annotations, selectedId, scale, offset]);

  useEffect(() => {
    redraw();
  }, [redraw]);

  const drawAnnotation = (ctx: CanvasRenderingContext2D, ann: Annotation, selected: boolean) => {
    ctx.save();
    
    const lineWidth = selected ? (ann.strokeWidth || 3) + 2 : (ann.strokeWidth || 3);
    
    switch (ann.type) {
      case 'circle': {
        ctx.beginPath();
        ctx.arc(ann.x * scale + offset.x, ann.y * scale + offset.y, ann.radius * scale, 0, 2 * Math.PI);
        ctx.strokeStyle = ann.color;
        ctx.lineWidth = lineWidth;
        ctx.stroke();
        break;
      }
      case 'arrow': {
        const sx = ann.startX * scale + offset.x;
        const sy = ann.startY * scale + offset.y;
        const ex = ann.endX * scale + offset.x;
        const ey = ann.endY * scale + offset.y;
        
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(ex, ey);
        ctx.strokeStyle = ann.color;
        ctx.lineWidth = lineWidth;
        ctx.stroke();
        
        const angle = Math.atan2(ey - sy, ex - sx);
        const headLen = 15;
        ctx.beginPath();
        ctx.moveTo(ex, ey);
        ctx.lineTo(ex - headLen * Math.cos(angle - Math.PI/6), ey - headLen * Math.sin(angle - Math.PI/6));
        ctx.lineTo(ex - headLen * Math.cos(angle + Math.PI/6), ey - headLen * Math.sin(angle + Math.PI/6));
        ctx.closePath();
        ctx.fillStyle = ann.color;
        ctx.fill();
        break;
      }
      case 'rectangle': {
        const x = ann.x * scale + offset.x;
        const y = ann.y * scale + offset.y;
        const w = ann.width * scale;
        const h = ann.height * scale;
        if (ann.fill) {
          ctx.fillStyle = ann.fill;
          ctx.fillRect(x, y, w, h);
        }
        ctx.strokeStyle = ann.color;
        ctx.lineWidth = lineWidth;
        ctx.strokeRect(x, y, w, h);
        break;
      }
      case 'highlight': {
        ctx.fillStyle = ann.color;
        ctx.globalAlpha = ann.opacity;
        ctx.fillRect(
          ann.x * scale + offset.x,
          ann.y * scale + offset.y,
          ann.width * scale,
          ann.height * scale
        );
        ctx.globalAlpha = 1;
        break;
      }
      case 'text': {
        const x = ann.x * scale + offset.x;
        const y = ann.y * scale + offset.y;
        const fontSize = ann.fontSize * scale;
        ctx.font = `bold ${fontSize}px Inter, sans-serif`;
        const metrics = ctx.measureText(ann.text);
        const padding = 4;
        if (ann.backgroundColor) {
          ctx.fillStyle = ann.backgroundColor;
          ctx.fillRect(x - padding, y - fontSize - padding, metrics.width + padding * 2, fontSize + padding * 2);
        }
        ctx.fillStyle = ann.color;
        ctx.fillText(ann.text, x, y);
        break;
      }
      case 'number': {
        const x = ann.x * scale + offset.x;
        const y = ann.y * scale + offset.y;
        const size = ann.size * scale;
        ctx.beginPath();
        ctx.arc(x, y, size / 2, 0, 2 * Math.PI);
        ctx.fillStyle = ann.color;
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${size * 0.6}px Inter, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(ann.number), x, y);
        break;
      }
    }
    
    ctx.restore();
  };

  const toImageCoords = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: (clientX - rect.left - offset.x) / scale,
      y: (clientY - rect.top - offset.y) / scale,
    };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const pos = toImageCoords(e.clientX, e.clientY);
    setStartPos(pos);
    setIsDrawing(true);
    setSelectedId(null);
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isDrawing || tool === 'select') {
      setIsDrawing(false);
      return;
    }

    const endPos = toImageCoords(e.clientX, e.clientY);
    let newAnnotation: Annotation | null = null;
    const id = `ann-${Date.now()}`;

    switch (tool) {
      case 'circle': {
        const radius = Math.sqrt(
          Math.pow(endPos.x - startPos.x, 2) + Math.pow(endPos.y - startPos.y, 2)
        );
        newAnnotation = {
          id,
          type: 'circle',
          x: startPos.x,
          y: startPos.y,
          radius: Math.max(20, radius),
          color,
          strokeWidth: 3,
        };
        break;
      }
      case 'arrow': {
        newAnnotation = {
          id,
          type: 'arrow',
          startX: startPos.x,
          startY: startPos.y,
          endX: endPos.x,
          endY: endPos.y,
          color,
          strokeWidth: 3,
        };
        break;
      }
      case 'rectangle': {
        newAnnotation = {
          id,
          type: 'rectangle',
          x: Math.min(startPos.x, endPos.x),
          y: Math.min(startPos.y, endPos.y),
          width: Math.abs(endPos.x - startPos.x),
          height: Math.abs(endPos.y - startPos.y),
          color,
          strokeWidth: 2,
        };
        break;
      }
      case 'highlight': {
        newAnnotation = {
          id,
          type: 'highlight',
          x: Math.min(startPos.x, endPos.x),
          y: Math.min(startPos.y, endPos.y),
          width: Math.abs(endPos.x - startPos.x),
          height: Math.abs(endPos.y - startPos.y),
          color: '#FFFF00',
          opacity: 0.3,
          strokeWidth: 0,
        };
        break;
      }
      case 'number': {
        newAnnotation = {
          id,
          type: 'number',
          x: startPos.x,
          y: startPos.y,
          number: numberCounter,
          color,
          size: 30,
          strokeWidth: 0,
        };
        setNumberCounter((n) => n + 1);
        break;
      }
      case 'text': {
        const text = prompt('Enter text:');
        if (text) {
          newAnnotation = {
            id,
            type: 'text',
            x: startPos.x,
            y: startPos.y,
            text,
            fontSize: 16,
            color: '#000000',
            backgroundColor: '#FFFF00',
            strokeWidth: 0,
          };
        }
        break;
      }
    }

    if (newAnnotation) {
      const newAnnotations = [...annotations, newAnnotation];
      onAnnotationsChange(newAnnotations);
      saveToHistory(newAnnotations);
    }

    setIsDrawing(false);
  };

  const saveToHistory = (newAnnotations: Annotation[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newAnnotations);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      onAnnotationsChange(history[historyIndex - 1]);
    }
  };

  const handleDelete = () => {
    if (selectedId) {
      const newAnnotations = annotations.filter((a) => a.id !== selectedId);
      onAnnotationsChange(newAnnotations);
      saveToHistory(newAnnotations);
      setSelectedId(null);
    }
  };

  const handleClear = () => {
    onAnnotationsChange([]);
    saveToHistory([]);
    setNumberCounter(1);
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 p-3 bg-muted/50 rounded-lg">
        <ToggleGroup type="single" value={tool} onValueChange={(v) => v && setTool(v as AnnotationType | 'select')}>
          <ToggleGroupItem value="select" aria-label="Select">
            <MousePointer2 className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="circle" aria-label="Circle">
            <Circle className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="arrow" aria-label="Arrow">
            <ArrowRight className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="rectangle" aria-label="Rectangle">
            <Square className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="text" aria-label="Text">
            <Type className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="number" aria-label="Number">
            <Hash className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="highlight" aria-label="Highlight">
            <Highlighter className="h-4 w-4" />
          </ToggleGroupItem>
        </ToggleGroup>

        <div className="h-6 w-px bg-border mx-1" />

        {/* Color picker */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Palette className="h-4 w-4" />
              <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: color }} />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-3">
            <div className="grid grid-cols-4 gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  className={`w-6 h-6 rounded-sm border-2 ${
                    c === color ? 'border-foreground' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <div className="h-6 w-px bg-border mx-1" />

        <Button variant="outline" size="sm" onClick={handleUndo} disabled={historyIndex === 0}>
          <Undo2 className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={handleDelete} disabled={!selectedId}>
          <Trash2 className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={handleClear}>
          Clear All
        </Button>

        <div className="flex-1" />

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onImageUpload(file);
          }}
        />
        <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
          <Upload className="h-4 w-4 mr-2" />
          Upload Image
        </Button>
      </div>

      {/* Canvas */}
      <div ref={containerRef} className="relative border rounded-lg overflow-hidden bg-muted">
        {imageUrl ? (
          <canvas
            ref={canvasRef}
            width={800}
            height={500}
            className="cursor-crosshair"
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
          />
        ) : (
          <div className="w-full h-[500px] flex flex-col items-center justify-center text-muted-foreground">
            <ImageIcon className="h-16 w-16 mb-3 opacity-40" />
            <p className="text-lg font-medium">No screenshot uploaded</p>
            <p className="text-sm">Upload an image to start adding annotations</p>
            <Button variant="outline" className="mt-4" onClick={() => fileInputRef.current?.click()}>
              <Upload className="h-4 w-4 mr-2" />
              Upload Screenshot
            </Button>
          </div>
        )}
      </div>

      {/* Instructions */}
      {imageUrl && (
        <p className="text-sm text-muted-foreground">
          Select a tool and click/drag on the image to add annotations. Use the number tool to add numbered callouts.
        </p>
      )}
    </div>
  );
}
