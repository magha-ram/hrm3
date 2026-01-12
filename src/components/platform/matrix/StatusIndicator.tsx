import { cn } from '@/lib/utils';
import { CheckCircle2, AlertTriangle, XCircle, Minus } from 'lucide-react';

interface StatusIndicatorProps {
  status: 'healthy' | 'warning' | 'critical' | 'disabled';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

const statusConfig = {
  healthy: {
    icon: CheckCircle2,
    label: 'Healthy',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    textColor: 'text-green-700 dark:text-green-400',
    dotColor: 'bg-green-500',
  },
  warning: {
    icon: AlertTriangle,
    label: 'Warning',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
    textColor: 'text-yellow-700 dark:text-yellow-400',
    dotColor: 'bg-yellow-500',
  },
  critical: {
    icon: XCircle,
    label: 'Critical',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    textColor: 'text-red-700 dark:text-red-400',
    dotColor: 'bg-red-500',
  },
  disabled: {
    icon: Minus,
    label: 'Disabled',
    bgColor: 'bg-muted',
    textColor: 'text-muted-foreground',
    dotColor: 'bg-muted-foreground',
  },
};

const sizeConfig = {
  sm: {
    iconSize: 'h-3 w-3',
    dotSize: 'h-2 w-2',
    padding: 'px-1.5 py-0.5',
    text: 'text-xs',
  },
  md: {
    iconSize: 'h-4 w-4',
    dotSize: 'h-2.5 w-2.5',
    padding: 'px-2 py-1',
    text: 'text-sm',
  },
  lg: {
    iconSize: 'h-5 w-5',
    dotSize: 'h-3 w-3',
    padding: 'px-3 py-1.5',
    text: 'text-base',
  },
};

export function StatusIndicator({ 
  status, 
  size = 'md', 
  showLabel = true,
  className 
}: StatusIndicatorProps) {
  const config = statusConfig[status];
  const sizes = sizeConfig[size];
  const Icon = config.icon;

  if (!showLabel) {
    return (
      <div 
        className={cn(
          'rounded-full',
          sizes.dotSize,
          config.dotColor,
          'animate-pulse',
          className
        )} 
        title={config.label}
      />
    );
  }

  return (
    <div 
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium',
        config.bgColor,
        config.textColor,
        sizes.padding,
        sizes.text,
        className
      )}
    >
      <Icon className={sizes.iconSize} />
      <span>{config.label}</span>
    </div>
  );
}

export function StatusDot({ 
  status,
  size = 'md',
  pulse = true,
  className 
}: { 
  status: 'healthy' | 'warning' | 'critical' | 'disabled';
  size?: 'sm' | 'md' | 'lg';
  pulse?: boolean;
  className?: string;
}) {
  const config = statusConfig[status];
  const sizes = sizeConfig[size];

  return (
    <div 
      className={cn(
        'rounded-full',
        sizes.dotSize,
        config.dotColor,
        pulse && status !== 'disabled' && 'animate-pulse',
        className
      )} 
      title={config.label}
    />
  );
}
