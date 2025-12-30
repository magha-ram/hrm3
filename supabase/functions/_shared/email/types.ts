// Email Provider Interface - All providers must implement this
export interface EmailRecipient {
  email: string;
  name?: string;
}

export interface EmailAttachment {
  filename: string;
  content: string; // Base64 encoded
  contentType: string;
}

export interface EmailMessage {
  to: EmailRecipient[];
  cc?: EmailRecipient[];
  bcc?: EmailRecipient[];
  subject: string;
  html: string;
  text?: string;
  attachments?: EmailAttachment[];
  replyTo?: EmailRecipient;
  tags?: Record<string, string>;
}

export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  provider: string;
}

export interface EmailProviderConfig {
  fromEmail: string;
  fromName: string;
}

// All email providers must implement this interface
export interface EmailProvider {
  readonly name: string;
  send(message: EmailMessage): Promise<EmailSendResult>;
  validateConfig(): boolean;
}

// Supported email providers
export type EmailProviderType = 'mailersend' | 'sendgrid' | 'ses' | 'console';

// Email template types
export type EmailTemplateType = 
  | 'user_invitation'
  | 'welcome'
  | 'password_reset'
  | 'leave_request_submitted'
  | 'leave_request_approved'
  | 'leave_request_rejected'
  | 'payroll_processed'
  | 'subscription_expiring'
  | 'company_frozen'
  | 'suspicious_login';

export interface EmailTemplateData {
  user_invitation: {
    inviterName: string;
    companyName: string;
    inviteUrl: string;
    role: string;
  };
  welcome: {
    userName: string;
    companyName: string;
    loginUrl: string;
  };
  password_reset: {
    userName: string;
    resetUrl: string;
  };
  leave_request_submitted: {
    employeeName: string;
    leaveType: string;
    startDate: string;
    endDate: string;
    managerName: string;
  };
  leave_request_approved: {
    employeeName: string;
    leaveType: string;
    startDate: string;
    endDate: string;
  };
  leave_request_rejected: {
    employeeName: string;
    leaveType: string;
    reason: string;
  };
  payroll_processed: {
    employeeName: string;
    periodStart: string;
    periodEnd: string;
    netPay: string;
  };
  subscription_expiring: {
    companyName: string;
    expirationDate: string;
    renewUrl: string;
  };
  company_frozen: {
    companyName: string;
    reason: string;
    supportEmail: string;
  };
  suspicious_login: {
    userName: string;
    loginTime: string;
    browser: string;
    location: string;
    ipAddress: string;
    reason: string;
    secureAccountUrl: string;
  };
}
