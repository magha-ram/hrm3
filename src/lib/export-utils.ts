import { format } from 'date-fns';

/**
 * Convert data to CSV string
 */
export function convertToCSV<T extends Record<string, unknown>>(
  data: T[],
  columns: { key: keyof T; label: string; format?: (value: unknown) => string }[]
): string {
  if (data.length === 0) return '';

  // Header row
  const header = columns.map(col => `"${col.label}"`).join(',');

  // Data rows
  const rows = data.map(item =>
    columns
      .map(col => {
        const value = item[col.key];
        const formatted = col.format ? col.format(value) : String(value ?? '');
        // Escape double quotes and wrap in quotes
        return `"${formatted.replace(/"/g, '""')}"`;
      })
      .join(',')
  );

  return [header, ...rows].join('\n');
}

/**
 * Trigger file download
 */
export function downloadFile(content: string, filename: string, mimeType: string = 'text/csv') {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export audit logs to CSV
 */
export function exportAuditLogsToCSV(
  logs: Array<{
    id: string;
    created_at: string;
    action: string;
    table_name: string;
    record_id: string | null;
    user_id: string | null;
    ip_address: unknown;
    old_values: unknown;
    new_values: unknown;
  }>,
  filename?: string
) {
  const csvContent = convertToCSV(logs, [
    { key: 'created_at', label: 'Timestamp', format: (v) => format(new Date(v as string), 'yyyy-MM-dd HH:mm:ss') },
    { key: 'action', label: 'Action' },
    { key: 'table_name', label: 'Table' },
    { key: 'record_id', label: 'Record ID', format: (v) => String(v || '-') },
    { key: 'user_id', label: 'User ID', format: (v) => String(v || 'System') },
    { key: 'ip_address', label: 'IP Address', format: (v) => String(v || '-') },
    { key: 'old_values', label: 'Old Values', format: (v) => v ? JSON.stringify(v) : '-' },
    { key: 'new_values', label: 'New Values', format: (v) => v ? JSON.stringify(v) : '-' },
  ]);

  const exportFilename = filename || `audit-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`;
  downloadFile(csvContent, exportFilename);
}

/**
 * Export compliance report to CSV
 */
export function exportComplianceReportToCSV(
  data: {
    securityEvents: Array<{
      id: string;
      created_at: string;
      event_type: string;
      description: string | null;
      severity: string | null;
      is_resolved: boolean | null;
    }>;
    mfaEnabled: boolean;
    supportAccessCount: number;
    complianceScore: number;
  },
  filename?: string
) {
  // Create a summary section
  const summary = [
    { section: 'Compliance Summary', metric: 'Compliance Score', value: `${data.complianceScore}%` },
    { section: 'Compliance Summary', metric: 'MFA Status', value: data.mfaEnabled ? 'Enabled' : 'Not Enabled' },
    { section: 'Compliance Summary', metric: 'Active Support Access Grants', value: String(data.supportAccessCount) },
    { section: 'Compliance Summary', metric: 'Security Events Count', value: String(data.securityEvents.length) },
  ];

  const summaryCSV = convertToCSV(summary, [
    { key: 'section', label: 'Section' },
    { key: 'metric', label: 'Metric' },
    { key: 'value', label: 'Value' },
  ]);

  // Security events section
  let eventsCSV = '';
  if (data.securityEvents.length > 0) {
    eventsCSV = '\n\nSecurity Events\n' + convertToCSV(data.securityEvents, [
      { key: 'created_at', label: 'Timestamp', format: (v) => format(new Date(v as string), 'yyyy-MM-dd HH:mm:ss') },
      { key: 'event_type', label: 'Event Type', format: (v) => String(v).replace(/_/g, ' ') },
      { key: 'description', label: 'Description', format: (v) => String(v || '-') },
      { key: 'severity', label: 'Severity' },
      { key: 'is_resolved', label: 'Resolved', format: (v) => v ? 'Yes' : 'No' },
    ]);
  }

  const fullContent = summaryCSV + eventsCSV;
  const exportFilename = filename || `compliance-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
  downloadFile(fullContent, exportFilename);
}

/**
 * Export employees to CSV
 */
export function exportEmployeesToCSV(
  employees: Array<{
    first_name: string;
    last_name: string;
    email: string;
    employee_number: string;
    hire_date: string;
    job_title: string | null;
    employment_type: string;
    employment_status: string;
    phone: string | null;
    personal_email: string | null;
    work_location: string | null;
    department?: { name: string } | null;
  }>,
  filename?: string
) {
  const csvContent = convertToCSV(employees, [
    { key: 'first_name', label: 'First Name' },
    { key: 'last_name', label: 'Last Name' },
    { key: 'email', label: 'Email' },
    { key: 'employee_number', label: 'Employee Number' },
    { key: 'hire_date', label: 'Hire Date' },
    { key: 'job_title', label: 'Job Title', format: (v) => String(v || '') },
    { key: 'department', label: 'Department', format: (v) => (v as { name: string } | null)?.name || '' },
    { key: 'employment_type', label: 'Employment Type', format: (v) => String(v).replace('_', ' ') },
    { key: 'employment_status', label: 'Status', format: (v) => String(v).replace('_', ' ') },
    { key: 'phone', label: 'Phone', format: (v) => String(v || '') },
    { key: 'personal_email', label: 'Personal Email', format: (v) => String(v || '') },
    { key: 'work_location', label: 'Work Location', format: (v) => String(v || '') },
  ]);

  const exportFilename = filename || `employees-${format(new Date(), 'yyyy-MM-dd')}.csv`;
  downloadFile(csvContent, exportFilename);
}

/**
 * Download sample employee import template
 */
export function downloadEmployeeImportTemplate() {
  const template = `first_name,last_name,email,employee_number,hire_date,job_title,employment_type,employment_status,phone,personal_email,work_location
John,Doe,john.doe@company.com,EMP-001,2024-01-15,Software Engineer,full_time,active,+1234567890,john@personal.com,New York
Jane,Smith,jane.smith@company.com,EMP-002,2024-02-01,Product Manager,full_time,active,,jane@personal.com,Remote`;
  
  downloadFile(template, 'employee-import-template.csv');
}
