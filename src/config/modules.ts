import { 
  Users, 
  Building2, 
  Calendar, 
  Clock, 
  FileText, 
  Briefcase, 
  BarChart3, 
  DollarSign,
  Settings,
  Shield,
  HelpCircle,
  type LucideIcon 
} from 'lucide-react';
import { AppRole } from '@/types/auth';

export type ModuleId = 
  | 'employees'
  | 'directory'
  | 'departments'
  | 'leave'
  | 'time_tracking'
  | 'documents'
  | 'recruitment'
  | 'performance'
  | 'payroll';

export interface ModuleConfig {
  id: ModuleId;
  name: string;
  description: string;
  icon: LucideIcon;
  path: string;
  minRole: AppRole;
  planRequired: ModuleId | null; // null means always available
  children?: ModuleConfig[];
}

export const HR_MODULES: ModuleConfig[] = [
  {
    id: 'employees',
    name: 'Employees',
    description: 'Manage employee records and profiles',
    icon: Users,
    path: '/employees',
    minRole: 'employee',
    planRequired: 'employees',
  },
  {
    id: 'departments',
    name: 'Departments',
    description: 'Organize team structure',
    icon: Building2,
    path: '/departments',
    minRole: 'employee',
    planRequired: 'directory',
  },
  {
    id: 'leave',
    name: 'Leave Management',
    description: 'Handle time-off requests',
    icon: Calendar,
    path: '/leave',
    minRole: 'employee',
    planRequired: 'leave',
  },
  {
    id: 'time_tracking',
    name: 'Time Tracking',
    description: 'Track work hours and attendance',
    icon: Clock,
    path: '/time',
    minRole: 'employee',
    planRequired: 'time_tracking',
  },
  {
    id: 'documents',
    name: 'Documents',
    description: 'Store and manage employee documents',
    icon: FileText,
    path: '/documents',
    minRole: 'hr_manager',
    planRequired: 'documents',
  },
  {
    id: 'recruitment',
    name: 'Recruitment',
    description: 'Manage job postings and candidates',
    icon: Briefcase,
    path: '/recruitment',
    minRole: 'hr_manager',
    planRequired: 'recruitment',
  },
  {
    id: 'performance',
    name: 'Performance',
    description: 'Track reviews and feedback',
    icon: BarChart3,
    path: '/performance',
    minRole: 'manager',
    planRequired: 'performance',
  },
  {
    id: 'payroll',
    name: 'Payroll',
    description: 'Process payroll runs',
    icon: DollarSign,
    path: '/payroll',
    minRole: 'company_admin',
    planRequired: 'payroll',
  },
];

export interface SettingsNavItem {
  name: string;
  path: string;
  icon: LucideIcon;
  minRole: AppRole;
}

export const SETTINGS_NAV: SettingsNavItem[] = [
  {
    name: 'Company Settings',
    path: '/settings/company',
    icon: Building2,
    minRole: 'company_admin',
  },
  {
    name: 'Users & Roles',
    path: '/settings/users',
    icon: Users,
    minRole: 'company_admin',
  },
  {
    name: 'Billing',
    path: '/settings/billing',
    icon: DollarSign,
    minRole: 'company_admin',
  },
  {
    name: 'Security',
    path: '/settings/security',
    icon: Shield,
    minRole: 'company_admin',
  },
];

export const UTILITY_NAV = [
  {
    name: 'Settings',
    path: '/settings',
    icon: Settings,
  },
  {
    name: 'Help & Support',
    path: '/help',
    icon: HelpCircle,
  },
];
