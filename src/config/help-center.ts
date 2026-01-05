import { AppRole } from '@/types/auth';

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  module?: string;
  roles?: AppRole[];
  tags: string[];
}

export interface VideoTutorial {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  videoUrl: string;
  duration: string;
  category: string;
  module?: string;
  roles?: AppRole[];
}

export interface QuickGuide {
  id: string;
  title: string;
  description: string;
  module: string;
  icon: string;
  roles?: AppRole[];
  steps: {
    step: number;
    title: string;
    description: string;
  }[];
}

export const FAQ_CATEGORIES = [
  { id: 'getting-started', label: 'Getting Started', icon: 'Rocket' },
  { id: 'employees', label: 'Employees', icon: 'Users' },
  { id: 'leave', label: 'Leave Management', icon: 'Calendar' },
  { id: 'time', label: 'Time Tracking', icon: 'Clock' },
  { id: 'payroll', label: 'Payroll', icon: 'DollarSign' },
  { id: 'documents', label: 'Documents', icon: 'FileText' },
  { id: 'settings', label: 'Settings & Admin', icon: 'Settings' },
  { id: 'security', label: 'Security', icon: 'Shield' },
] as const;

export const FAQS: FAQItem[] = [
  // Getting Started
  {
    id: 'gs-1',
    question: 'How do I get started with the HR Portal?',
    answer: 'After logging in, you\'ll land on the Dashboard. From here, you can navigate to different modules using the sidebar. Start by exploring your profile, checking your leave balance, or if you\'re an admin, adding employees to your organization.',
    category: 'getting-started',
    tags: ['start', 'begin', 'new', 'first time'],
  },
  {
    id: 'gs-2',
    question: 'What are the different user roles and their permissions?',
    answer: 'The system has five roles: Super Admin (full access), Company Admin (company-wide management), HR Manager (HR operations), Manager (team oversight), and Employee (self-service). Each role has specific permissions tailored to their responsibilities.',
    category: 'getting-started',
    roles: ['company_admin', 'super_admin'],
    tags: ['roles', 'permissions', 'access', 'admin'],
  },
  {
    id: 'gs-3',
    question: 'How do I navigate between different modules?',
    answer: 'Use the sidebar on the left to navigate between modules. You can also use the Quick Access grid on the Dashboard for faster navigation. On mobile, tap the menu icon to reveal the sidebar.',
    category: 'getting-started',
    tags: ['navigate', 'sidebar', 'menu', 'modules'],
  },

  // Employees
  {
    id: 'emp-1',
    question: 'How do I add a new employee?',
    answer: 'Navigate to Employees from the sidebar, then click "Add Employee". Fill in the required information including personal details, employment information, and department. You can also assign them a user account for system access.',
    category: 'employees',
    module: 'employees',
    roles: ['company_admin', 'super_admin', 'hr_manager'],
    tags: ['add', 'create', 'new employee', 'hire'],
  },
  {
    id: 'emp-2',
    question: 'How do I bulk import employees?',
    answer: 'In the Employees section, click the "Import" button. Download the template file, fill it with your employee data, then upload the completed file. The system will validate the data and show you any errors before importing.',
    category: 'employees',
    module: 'employees',
    roles: ['company_admin', 'super_admin', 'hr_manager'],
    tags: ['import', 'bulk', 'csv', 'excel', 'upload'],
  },
  {
    id: 'emp-3',
    question: 'How do I view and update employee information?',
    answer: 'Click on any employee in the list to view their full profile. You can edit their information by clicking the "Edit" button. Changes are saved automatically when you submit the form.',
    category: 'employees',
    module: 'employees',
    roles: ['company_admin', 'super_admin', 'hr_manager'],
    tags: ['view', 'update', 'edit', 'profile'],
  },
  {
    id: 'emp-4',
    question: 'How do I view my own employee profile?',
    answer: 'Click on your avatar in the top-right corner and select "My Profile", or navigate to "My Info" in the sidebar. This shows your personal information, employment details, and documents.',
    category: 'employees',
    tags: ['profile', 'my info', 'personal'],
  },
  {
    id: 'emp-5',
    question: 'How do I change an employee\'s status (active, on leave, terminated)?',
    answer: 'Open the employee\'s profile and click on the status dropdown. Select the new status and provide any required information (like termination date). Status changes are logged in the audit trail.',
    category: 'employees',
    module: 'employees',
    roles: ['company_admin', 'super_admin', 'hr_manager'],
    tags: ['status', 'terminate', 'inactive', 'leave'],
  },

  // Leave Management
  {
    id: 'leave-1',
    question: 'How do I submit a leave request?',
    answer: 'Go to Leave Management and click "Request Leave". Select your leave type, dates, and provide a reason. Your request will be sent to your manager for approval. You can track the status in the "My Leave" tab.',
    category: 'leave',
    module: 'leave',
    tags: ['request', 'submit', 'apply', 'time off'],
  },
  {
    id: 'leave-2',
    question: 'How do I check my leave balance?',
    answer: 'Your leave balance is displayed at the top of the Leave Management page. You can see the remaining days for each leave type (Annual, Sick, etc.). The balance updates automatically when requests are approved.',
    category: 'leave',
    module: 'leave',
    tags: ['balance', 'remaining', 'days left', 'quota'],
  },
  {
    id: 'leave-3',
    question: 'How do I approve or reject leave requests?',
    answer: 'As a manager or HR, go to Leave Management and click the "Team Requests" tab. You\'ll see pending requests from your team. Click on a request to view details, then approve or reject with an optional comment.',
    category: 'leave',
    module: 'leave',
    roles: ['manager', 'hr_manager', 'company_admin', 'super_admin'],
    tags: ['approve', 'reject', 'team', 'pending'],
  },
  {
    id: 'leave-4',
    question: 'How do I cancel a pending leave request?',
    answer: 'In the "My Leave" tab, find your pending request and click the cancel button (X icon). You can only cancel requests that haven\'t been approved or rejected yet.',
    category: 'leave',
    module: 'leave',
    tags: ['cancel', 'withdraw', 'pending'],
  },
  {
    id: 'leave-5',
    question: 'How do I configure leave types and policies?',
    answer: 'HR and Admins can configure leave types in Leave Management > Settings tab. Here you can create new leave types, set annual quotas, configure carry-over rules, and manage accrual settings.',
    category: 'leave',
    module: 'leave',
    roles: ['hr_manager', 'company_admin', 'super_admin'],
    tags: ['configure', 'types', 'policy', 'settings'],
  },

  // Time Tracking
  {
    id: 'time-1',
    question: 'How do I clock in and out?',
    answer: 'On the Time Tracking page, use the large clock button to clock in when you start work. The button changes to "Clock Out" when you\'re clocked in. You can also start breaks during your shift.',
    category: 'time',
    module: 'time',
    tags: ['clock', 'punch', 'checkin', 'checkout'],
  },
  {
    id: 'time-2',
    question: 'How do I request a time correction?',
    answer: 'If you forgot to clock in/out or made an error, go to Time Tracking > My Requests tab and click "Request Correction". Select the date, enter the correct times, and provide a reason. Your manager will review the request.',
    category: 'time',
    module: 'time',
    tags: ['correction', 'fix', 'error', 'forgot'],
  },
  {
    id: 'time-3',
    question: 'How do I view my time entries?',
    answer: 'The "My Entries" tab shows all your clock records. You can filter by date range and see details like clock in/out times, breaks, and total hours worked.',
    category: 'time',
    module: 'time',
    tags: ['entries', 'history', 'records', 'hours'],
  },
  {
    id: 'time-4',
    question: 'How do I view and approve my team\'s time entries?',
    answer: 'Managers can access the "Team Entries" tab to view all team members\' time records. Use the "Corrections" tab to review and approve any correction requests from your team.',
    category: 'time',
    module: 'time',
    roles: ['manager', 'hr_manager', 'company_admin', 'super_admin'],
    tags: ['team', 'approve', 'review', 'corrections'],
  },

  // Payroll
  {
    id: 'pay-1',
    question: 'How do payroll runs work?',
    answer: 'Create a new payroll run for a pay period, add employees (or bulk add all active employees), review salary calculations and deductions, then process and complete the run. Once completed, payslips are generated automatically.',
    category: 'payroll',
    module: 'payroll',
    roles: ['hr_manager', 'company_admin', 'super_admin'],
    tags: ['run', 'process', 'salary', 'payment'],
  },
  {
    id: 'pay-2',
    question: 'How do I download my payslip?',
    answer: 'Go to "My Payslips" from the sidebar or your profile. You\'ll see all your payslips listed by period. Click the download icon to get a PDF copy of any payslip.',
    category: 'payroll',
    module: 'payroll',
    tags: ['payslip', 'download', 'pdf', 'salary slip'],
  },
  {
    id: 'pay-3',
    question: 'How do I create a new payroll run?',
    answer: 'In Payroll, click "Create Payroll Run". Enter the period dates and description. Then add employees using the "Add Employees" button. Review the calculations and click "Process" when ready.',
    category: 'payroll',
    module: 'payroll',
    roles: ['hr_manager', 'company_admin', 'super_admin'],
    tags: ['create', 'new', 'run', 'period'],
  },

  // Documents
  {
    id: 'doc-1',
    question: 'How do I upload a document?',
    answer: 'Go to Documents and click "Upload Document". Select the document type, choose the file, and optionally add an expiry date. Documents are securely stored and can be accessed by authorized personnel.',
    category: 'documents',
    module: 'documents',
    tags: ['upload', 'add', 'file', 'attachment'],
  },
  {
    id: 'doc-2',
    question: 'How do I view my documents?',
    answer: 'Navigate to Documents > "My Documents" tab. Here you\'ll see all documents uploaded for your profile including ID proofs, certificates, and other files. Click any document to view or download.',
    category: 'documents',
    module: 'documents',
    tags: ['view', 'my documents', 'files'],
  },
  {
    id: 'doc-3',
    question: 'How do document expiry alerts work?',
    answer: 'The system tracks documents with expiry dates (like visas, certifications). You\'ll receive notifications before they expire. HR can view all expiring documents in the "Expiry Alerts" tab.',
    category: 'documents',
    module: 'documents',
    roles: ['hr_manager', 'company_admin', 'super_admin'],
    tags: ['expiry', 'alerts', 'notifications', 'renewal'],
  },

  // Settings & Admin
  {
    id: 'set-1',
    question: 'How do I invite new users to the system?',
    answer: 'Go to Settings > Users & Roles, click "Create User Accounts". Enter the email address, select a role, and optionally link to an employee record. The user will receive an email invitation.',
    category: 'settings',
    roles: ['company_admin', 'super_admin'],
    tags: ['invite', 'user', 'account', 'create'],
  },
  {
    id: 'set-2',
    question: 'How do I change user permissions?',
    answer: 'Navigate to Settings > Permissions. Here you can configure what each role can access. You can also set individual user overrides for specific permissions beyond their role defaults.',
    category: 'settings',
    roles: ['company_admin', 'super_admin'],
    tags: ['permissions', 'access', 'roles', 'security'],
  },
  {
    id: 'set-3',
    question: 'How do I update company settings?',
    answer: 'Go to Settings > Company to update your organization details including name, logo, address, and fiscal year settings. Changes here affect the entire organization.',
    category: 'settings',
    roles: ['company_admin', 'super_admin'],
    tags: ['company', 'organization', 'logo', 'details'],
  },
  {
    id: 'set-4',
    question: 'How do I configure email settings?',
    answer: 'In Settings > Email, you can configure your email provider for sending notifications. Choose between the platform default or set up your own SMTP/API provider for branded emails.',
    category: 'settings',
    roles: ['company_admin', 'super_admin'],
    tags: ['email', 'smtp', 'notifications', 'provider'],
  },
  {
    id: 'set-5',
    question: 'How do I change my subscription plan?',
    answer: 'Visit Settings > Billing to view your current plan and available upgrades. You can change plans, update payment methods, and view invoice history.',
    category: 'settings',
    roles: ['company_admin', 'super_admin'],
    tags: ['billing', 'plan', 'subscription', 'upgrade'],
  },

  // Security
  {
    id: 'sec-1',
    question: 'How do I change my password?',
    answer: 'Click your avatar in the top-right corner, then "Security Settings" or navigate to "My Security" from the sidebar. Here you can change your password and manage security settings.',
    category: 'security',
    tags: ['password', 'change', 'reset', 'credentials'],
  },
  {
    id: 'sec-2',
    question: 'How do I enable two-factor authentication (2FA)?',
    answer: 'Go to My Security settings and look for the MFA/2FA section. Click to enable, then follow the setup wizard to configure your authenticator app. This adds an extra layer of security to your account.',
    category: 'security',
    tags: ['2fa', 'mfa', 'authenticator', 'security'],
  },
  {
    id: 'sec-3',
    question: 'How do I manage trusted devices?',
    answer: 'In My Security, you can view all devices that have accessed your account. You can revoke access to any device you don\'t recognize or no longer use.',
    category: 'security',
    tags: ['devices', 'trusted', 'sessions', 'logout'],
  },
  {
    id: 'sec-4',
    question: 'Can I export my data?',
    answer: 'Yes, most modules support data export. Look for the "Export" button in sections like Employees, Payroll, Time Tracking, and Audit Logs. Data is exported in CSV or Excel format.',
    category: 'security',
    tags: ['export', 'data', 'download', 'backup'],
  },
];

export const VIDEO_TUTORIALS: VideoTutorial[] = [
  {
    id: 'vid-1',
    title: 'Getting Started with HR Portal',
    description: 'A comprehensive introduction to navigating and using the HR Portal effectively.',
    thumbnailUrl: '',
    videoUrl: 'https://example.com/videos/getting-started',
    duration: '5:30',
    category: 'getting-started',
  },
  {
    id: 'vid-2',
    title: 'Managing Employees',
    description: 'Learn how to add, edit, and manage employee records, including bulk imports.',
    thumbnailUrl: '',
    videoUrl: 'https://example.com/videos/managing-employees',
    duration: '8:15',
    category: 'employees',
    module: 'employees',
    roles: ['hr_manager', 'company_admin', 'super_admin'],
  },
  {
    id: 'vid-3',
    title: 'Leave Management Workflow',
    description: 'Complete guide to requesting, approving, and managing leave requests.',
    thumbnailUrl: '',
    videoUrl: 'https://example.com/videos/leave-management',
    duration: '6:45',
    category: 'leave',
    module: 'leave',
  },
  {
    id: 'vid-4',
    title: 'Time Tracking Essentials',
    description: 'Master the clock in/out system, breaks, and time correction requests.',
    thumbnailUrl: '',
    videoUrl: 'https://example.com/videos/time-tracking',
    duration: '4:20',
    category: 'time',
    module: 'time',
  },
  {
    id: 'vid-5',
    title: 'Running Payroll',
    description: 'Step-by-step guide to creating and processing payroll runs.',
    thumbnailUrl: '',
    videoUrl: 'https://example.com/videos/payroll',
    duration: '10:00',
    category: 'payroll',
    module: 'payroll',
    roles: ['hr_manager', 'company_admin', 'super_admin'],
  },
  {
    id: 'vid-6',
    title: 'User & Permission Management',
    description: 'Configure roles, permissions, and user access for your organization.',
    thumbnailUrl: '',
    videoUrl: 'https://example.com/videos/permissions',
    duration: '7:30',
    category: 'settings',
    roles: ['company_admin', 'super_admin'],
  },
];

export const QUICK_GUIDES: QuickGuide[] = [
  {
    id: 'guide-leave-request',
    title: 'Submit a Leave Request',
    description: 'Request time off in a few simple steps',
    module: 'leave',
    icon: 'Calendar',
    steps: [
      { step: 1, title: 'Go to Leave Management', description: 'Click "Leave" in the sidebar navigation' },
      { step: 2, title: 'Click Request Leave', description: 'Find the button in the top-right of the page' },
      { step: 3, title: 'Select Leave Type', description: 'Choose from available types (Annual, Sick, etc.)' },
      { step: 4, title: 'Pick Your Dates', description: 'Select start and end dates for your leave' },
      { step: 5, title: 'Add Details', description: 'Provide a reason and submit for approval' },
    ],
  },
  {
    id: 'guide-clock-in',
    title: 'Clock In/Out',
    description: 'Track your work hours daily',
    module: 'time',
    icon: 'Clock',
    steps: [
      { step: 1, title: 'Go to Time Tracking', description: 'Click "Time" in the sidebar' },
      { step: 2, title: 'Click Clock In', description: 'Press the large clock button to start your shift' },
      { step: 3, title: 'Take Breaks', description: 'Use break buttons during your shift if needed' },
      { step: 4, title: 'Clock Out', description: 'Press the clock button again when ending your shift' },
    ],
  },
  {
    id: 'guide-add-employee',
    title: 'Add a New Employee',
    description: 'Onboard new team members',
    module: 'employees',
    icon: 'UserPlus',
    roles: ['hr_manager', 'company_admin', 'super_admin'],
    steps: [
      { step: 1, title: 'Go to Employees', description: 'Click "Employees" in the sidebar' },
      { step: 2, title: 'Click Add Employee', description: 'Find the button in the page header' },
      { step: 3, title: 'Enter Personal Info', description: 'Fill in name, email, phone, and address' },
      { step: 4, title: 'Set Employment Details', description: 'Add department, position, and hire date' },
      { step: 5, title: 'Create User Account', description: 'Optionally create login credentials' },
      { step: 6, title: 'Save', description: 'Review and save the employee record' },
    ],
  },
  {
    id: 'guide-approve-leave',
    title: 'Approve Leave Requests',
    description: 'Review and action team requests',
    module: 'leave',
    icon: 'CheckCircle',
    roles: ['manager', 'hr_manager', 'company_admin', 'super_admin'],
    steps: [
      { step: 1, title: 'Go to Leave Management', description: 'Click "Leave" in the sidebar' },
      { step: 2, title: 'Open Team Requests Tab', description: 'Switch to the "Team Requests" tab' },
      { step: 3, title: 'Review Request', description: 'Check dates, type, and employee balance' },
      { step: 4, title: 'Approve or Reject', description: 'Click the appropriate action button' },
      { step: 5, title: 'Add Comment (Optional)', description: 'Provide feedback if rejecting' },
    ],
  },
  {
    id: 'guide-payroll-run',
    title: 'Create a Payroll Run',
    description: 'Process employee salaries',
    module: 'payroll',
    icon: 'DollarSign',
    roles: ['hr_manager', 'company_admin', 'super_admin'],
    steps: [
      { step: 1, title: 'Go to Payroll', description: 'Click "Payroll" in the sidebar' },
      { step: 2, title: 'Create New Run', description: 'Click "Create Payroll Run" button' },
      { step: 3, title: 'Set Period', description: 'Enter the pay period dates' },
      { step: 4, title: 'Add Employees', description: 'Use bulk add or select individuals' },
      { step: 5, title: 'Review Calculations', description: 'Verify salaries and deductions' },
      { step: 6, title: 'Process', description: 'Click Process to finalize the run' },
    ],
  },
  {
    id: 'guide-invite-user',
    title: 'Invite a User',
    description: 'Give someone system access',
    module: 'settings',
    icon: 'UserPlus',
    roles: ['company_admin', 'super_admin'],
    steps: [
      { step: 1, title: 'Go to Settings', description: 'Click "Settings" in the sidebar' },
      { step: 2, title: 'Open Users & Roles', description: 'Navigate to the Users section' },
      { step: 3, title: 'Click Create User', description: 'Find the "Create User Accounts" button' },
      { step: 4, title: 'Enter Email', description: 'Type the user\'s email address' },
      { step: 5, title: 'Select Role', description: 'Choose their access level' },
      { step: 6, title: 'Send Invite', description: 'User receives an email with login link' },
    ],
  },
];

export const KEYBOARD_SHORTCUTS = [
  { keys: ['⌘/Ctrl', 'K'], description: 'Open global search' },
  { keys: ['⌘/Ctrl', '/'], description: 'Open help' },
  { keys: ['Esc'], description: 'Close dialogs' },
  { keys: ['←', '→'], description: 'Navigate between tabs' },
];
