import { useEffect, useRef } from 'react';
import type { Annotation } from '@/types/help-guides';

interface AnnotationCanvasProps {
  imageUrl: string;
  annotations: Annotation[];
  width?: number;
  height?: number;
  className?: string;
}

export function AnnotationCanvas({
  imageUrl,
  annotations,
  width = 800,
  height = 600,
  className = '',
}: AnnotationCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      // Calculate aspect ratio to fit image
      const imgAspect = img.width / img.height;
      const canvasAspect = width / height;
      
      let drawWidth = width;
      let drawHeight = height;
      let offsetX = 0;
      let offsetY = 0;
      
      if (imgAspect > canvasAspect) {
        drawHeight = width / imgAspect;
        offsetY = (height - drawHeight) / 2;
      } else {
        drawWidth = height * imgAspect;
        offsetX = (width - drawWidth) / 2;
      }
      
      // Clear and draw image
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = '#f3f4f6';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
      
      // Draw annotations
      annotations.forEach((annotation) => {
        drawAnnotation(ctx, annotation, drawWidth / img.width, offsetX, offsetY);
      });
    };
    img.src = imageUrl;
  }, [imageUrl, annotations, width, height]);

  const drawAnnotation = (
    ctx: CanvasRenderingContext2D,
    annotation: Annotation,
    scale: number,
    offsetX: number,
    offsetY: number
  ) => {
    ctx.save();
    
    switch (annotation.type) {
      case 'circle': {
        const x = annotation.x * scale + offsetX;
        const y = annotation.y * scale + offsetY;
        const radius = annotation.radius * scale;
        
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI);
        ctx.strokeStyle = annotation.color;
        ctx.lineWidth = annotation.strokeWidth || 3;
        ctx.stroke();
        break;
      }
      
      case 'arrow': {
        const startX = annotation.startX * scale + offsetX;
        const startY = annotation.startY * scale + offsetY;
        const endX = annotation.endX * scale + offsetX;
        const endY = annotation.endY * scale + offsetY;
        
        const headLength = 15;
        const angle = Math.atan2(endY - startY, endX - startX);
        
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.strokeStyle = annotation.color;
        ctx.lineWidth = annotation.strokeWidth || 3;
        ctx.stroke();
        
        // Arrow head
        ctx.beginPath();
        ctx.moveTo(endX, endY);
        ctx.lineTo(
          endX - headLength * Math.cos(angle - Math.PI / 6),
          endY - headLength * Math.sin(angle - Math.PI / 6)
        );
        ctx.lineTo(
          endX - headLength * Math.cos(angle + Math.PI / 6),
          endY - headLength * Math.sin(angle + Math.PI / 6)
        );
        ctx.closePath();
        ctx.fillStyle = annotation.color;
        ctx.fill();
        break;
      }
      
      case 'rectangle': {
        const x = annotation.x * scale + offsetX;
        const y = annotation.y * scale + offsetY;
        const rectWidth = annotation.width * scale;
        const rectHeight = annotation.height * scale;
        
        if (annotation.fill) {
          ctx.fillStyle = annotation.fill;
          ctx.fillRect(x, y, rectWidth, rectHeight);
        }
        ctx.strokeStyle = annotation.color;
        ctx.lineWidth = annotation.strokeWidth || 2;
        ctx.strokeRect(x, y, rectWidth, rectHeight);
        break;
      }
      
      case 'highlight': {
        const x = annotation.x * scale + offsetX;
        const y = annotation.y * scale + offsetY;
        const highlightWidth = annotation.width * scale;
        const highlightHeight = annotation.height * scale;
        
        ctx.fillStyle = annotation.color;
        ctx.globalAlpha = annotation.opacity;
        ctx.fillRect(x, y, highlightWidth, highlightHeight);
        ctx.globalAlpha = 1;
        break;
      }
      
      case 'text': {
        const x = annotation.x * scale + offsetX;
        const y = annotation.y * scale + offsetY;
        const fontSize = annotation.fontSize * scale;
        
        ctx.font = `bold ${fontSize}px Inter, sans-serif`;
        const textMetrics = ctx.measureText(annotation.text);
        const padding = 6;
        
        if (annotation.backgroundColor) {
          ctx.fillStyle = annotation.backgroundColor;
          ctx.fillRect(
            x - padding,
            y - fontSize - padding,
            textMetrics.width + padding * 2,
            fontSize + padding * 2
          );
        }
        
        ctx.fillStyle = annotation.color;
        ctx.fillText(annotation.text, x, y);
        break;
      }
      
      case 'number': {
        const x = annotation.x * scale + offsetX;
        const y = annotation.y * scale + offsetY;
        const size = annotation.size * scale;
        
        // Draw circle background
        ctx.beginPath();
        ctx.arc(x, y, size / 2, 0, 2 * Math.PI);
        ctx.fillStyle = annotation.color;
        ctx.fill();
        
        // Draw number
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${size * 0.6}px Inter, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(annotation.number), x, y);
        break;
      }
    }
    
    ctx.restore();
  };

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={`rounded-lg ${className}`}
    />
  );
}
