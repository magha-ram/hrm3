import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricTrendArrowProps {
  trend: 'up' | 'down' | 'stable';
  /** Whether higher values are bad (e.g., error rate) or good (e.g., success rate) */
  higherIsBad?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

const sizeConfig = {
  sm: { icon: 'h-3 w-3', text: 'text-xs' },
  md: { icon: 'h-4 w-4', text: 'text-sm' },
  lg: { icon: 'h-5 w-5', text: 'text-base' },
};

export function MetricTrendArrow({ 
  trend, 
  higherIsBad = true,
  size = 'md',
  showLabel = false,
  className 
}: MetricTrendArrowProps) {
  const sizes = sizeConfig[size];
  
  const getColor = () => {
    if (trend === 'stable') return 'text-muted-foreground';
    
    if (higherIsBad) {
      return trend === 'up' 
        ? 'text-red-500 dark:text-red-400' 
        : 'text-green-500 dark:text-green-400';
    } else {
      return trend === 'up' 
        ? 'text-green-500 dark:text-green-400' 
        : 'text-red-500 dark:text-red-400';
    }
  };

  const getIcon = () => {
    switch (trend) {
      case 'up': return TrendingUp;
      case 'down': return TrendingDown;
      default: return Minus;
    }
  };

  const getLabel = () => {
    switch (trend) {
      case 'up': return 'Increasing';
      case 'down': return 'Decreasing';
      default: return 'Stable';
    }
  };

  const Icon = getIcon();

  return (
    <div 
      className={cn(
        'inline-flex items-center gap-1',
        getColor(),
        className
      )}
      title={getLabel()}
    >
      <Icon className={sizes.icon} />
      {showLabel && (
        <span className={sizes.text}>{getLabel()}</span>
      )}
    </div>
  );
}
