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
  Mail,
  Globe,
  LayoutDashboard,
  Bell,
  type LucideIcon 
} from 'lucide-react';
import { AppRole } from '@/types/auth';

export type ModuleId = 
  | 'dashboard'
  | 'employees'
  | 'directory'
  | 'departments'
  | 'leave'
  | 'time_tracking'
  | 'shifts'
  | 'documents'
  | 'recruitment'
  | 'performance'
  | 'payroll'
  | 'compliance'
  | 'audit'
  | 'integrations'
  | 'expenses'
  | 'my_team';

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
    id: 'dashboard',
    name: 'Dashboard',
    description: 'Your personalized overview and quick actions',
    icon: LayoutDashboard,
    path: '/app/dashboard',
    minRole: 'employee',
    planRequired: null, // Always available
  },
  {
    id: 'employees',
    name: 'Employees',
    description: 'Manage employee records and profiles',
    icon: Users,
    path: '/app/employees',
    minRole: 'employee',
    planRequired: 'employees',
  },
  {
    id: 'departments',
    name: 'Departments',
    description: 'Organize team structure',
    icon: Building2,
    path: '/app/departments',
    minRole: 'employee',
    planRequired: 'directory',
  },
  {
    id: 'leave',
    name: 'Leave Management',
    description: 'Handle time-off requests',
    icon: Calendar,
    path: '/app/leave',
    minRole: 'employee',
    planRequired: 'leave',
  },
  {
    id: 'time_tracking',
    name: 'Time Tracking',
    description: 'Track work hours and attendance',
    icon: Clock,
    path: '/app/time',
    minRole: 'employee',
    planRequired: 'time_tracking',
  },
  {
    id: 'shifts',
    name: 'Shift Management',
    description: 'Configure shifts and assignments',
    icon: Clock,
    path: '/app/shifts',
    minRole: 'hr_manager',
    planRequired: 'time_tracking',
  },
  {
    id: 'documents',
    name: 'Documents',
    description: 'Store and manage employee documents',
    icon: FileText,
    path: '/app/documents',
    minRole: 'hr_manager',
    planRequired: 'documents',
  },
  {
    id: 'recruitment',
    name: 'Recruitment',
    description: 'Manage job postings and candidates',
    icon: Briefcase,
    path: '/app/recruitment',
    minRole: 'hr_manager',
    planRequired: 'recruitment',
  },
  {
    id: 'performance',
    name: 'Performance',
    description: 'Track reviews and feedback',
    icon: BarChart3,
    path: '/app/performance',
    minRole: 'manager',
    planRequired: 'performance',
  },
  {
    id: 'payroll',
    name: 'Payroll',
    description: 'Process payroll runs',
    icon: DollarSign,
    path: '/app/payroll',
    minRole: 'hr_manager', // HR Admin can now access payroll (Workflow 1)
    planRequired: 'payroll',
  },
  {
    id: 'expenses',
    name: 'Expenses',
    description: 'Submit and manage expense claims',
    icon: DollarSign,
    path: '/app/expenses',
    minRole: 'employee',
    planRequired: 'expenses',
  },
  {
    id: 'my_team',
    name: 'My Team',
    description: 'Manage your direct reports, approvals, and team calendar',
    icon: Users,
    path: '/app/my-team',
    minRole: 'manager',
    planRequired: null, // Always available for managers
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
    path: '/app/settings/company',
    icon: Building2,
    minRole: 'company_admin',
  },
  {
    name: 'Users & Roles',
    path: '/app/settings/users',
    icon: Users,
    minRole: 'company_admin',
  },
  {
    name: 'Permissions',
    path: '/app/settings/permissions',
    icon: Shield,
    minRole: 'company_admin',
  },
  {
    name: 'Email',
    path: '/app/settings/email',
    icon: Mail,
    minRole: 'company_admin',
  },
  {
    name: 'Billing',
    path: '/app/settings/billing',
    icon: DollarSign,
    minRole: 'company_admin',
  },
  {
    name: 'Notifications',
    path: '/app/settings/notifications',
    icon: Bell,
    minRole: 'company_admin',
  },
  {
    name: 'Security',
    path: '/app/settings/security',
    icon: Shield,
    minRole: 'company_admin',
  },
  {
    name: 'Appearance',
    path: '/app/settings/appearance',
    icon: Settings,
    minRole: 'employee',
  },
  {
    name: 'Localization',
    path: '/app/settings/localization',
    icon: Globe,
    minRole: 'employee',
  },
  {
    name: 'Integrations',
    path: '/app/settings/integrations',
    icon: Settings,
    minRole: 'company_admin',
  },
  {
    name: 'Compliance',
    path: '/app/settings/compliance',
    icon: Shield,
    minRole: 'company_admin',
  },
];

export const UTILITY_NAV = [
  {
    name: 'Settings',
    path: '/app/settings',
    icon: Settings,
  },
  {
    name: 'Help & Support',
    path: '/app/help',
    icon: HelpCircle,
  },
];