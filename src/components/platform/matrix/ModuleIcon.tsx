import {
  Database,
  Server,
  Monitor,
  Shield,
  Mail,
  Bell,
  Users,
  Plug,
  Clock,
  HardDrive,
  FileText,
  Lock,
  Activity,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const iconMap: Record<string, LucideIcon> = {
  Database,
  Server,
  Monitor,
  Shield,
  Mail,
  Bell,
  Users,
  Plug,
  Clock,
  HardDrive,
  FileText,
  Lock,
  Activity,
};

interface ModuleIconProps {
  icon: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeConfig = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
};

export function ModuleIcon({ icon, className, size = 'md' }: ModuleIconProps) {
  const Icon = iconMap[icon] || Activity;
  
  return <Icon className={cn(sizeConfig[size], className)} />;
}
