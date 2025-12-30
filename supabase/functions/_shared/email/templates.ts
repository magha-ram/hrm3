import { EmailTemplateType, EmailTemplateData } from './types.ts';

interface RenderedTemplate {
  subject: string;
  html: string;
  text: string;
}

// Base email styles
const baseStyles = `
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
  .header { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
  .header h1 { color: white; margin: 0; font-size: 24px; }
  .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
  .footer { background: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; border-top: none; }
  .button { display: inline-block; background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; margin: 20px 0; }
  .button:hover { background: #4f46e5; }
  .highlight { background: #f0f9ff; border-left: 4px solid #6366f1; padding: 15px; margin: 20px 0; }
`;

function wrapTemplate(content: string, title: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>${baseStyles}</style>
</head>
<body>
  <div class="container">
    ${content}
  </div>
</body>
</html>`;
}

const templates: Record<EmailTemplateType, (data: any) => RenderedTemplate> = {
  user_invitation: (data: EmailTemplateData['user_invitation']) => ({
    subject: `You've been invited to join ${data.companyName}`,
    html: wrapTemplate(`
      <div class="header">
        <h1>You're Invited!</h1>
      </div>
      <div class="content">
        <p>Hi there,</p>
        <p><strong>${data.inviterName}</strong> has invited you to join <strong>${data.companyName}</strong> as a <strong>${data.role}</strong>.</p>
        <p>Click the button below to accept your invitation and set up your account:</p>
        <p style="text-align: center;">
          <a href="${data.inviteUrl}" class="button">Accept Invitation</a>
        </p>
        <p style="color: #6b7280; font-size: 14px;">If you didn't expect this invitation, you can safely ignore this email.</p>
      </div>
      <div class="footer">
        <p>This invitation was sent via our HR Management System</p>
      </div>
    `, `Invitation to ${data.companyName}`),
    text: `You've been invited to join ${data.companyName}!\n\n${data.inviterName} has invited you to join as a ${data.role}.\n\nAccept your invitation: ${data.inviteUrl}\n\nIf you didn't expect this invitation, you can safely ignore this email.`
  }),

  welcome: (data: EmailTemplateData['welcome']) => ({
    subject: `Welcome to ${data.companyName}!`,
    html: wrapTemplate(`
      <div class="header">
        <h1>Welcome Aboard!</h1>
      </div>
      <div class="content">
        <p>Hi ${data.userName},</p>
        <p>Welcome to <strong>${data.companyName}</strong>! Your account has been successfully created.</p>
        <p>You can now access your dashboard and start exploring all the features available to you.</p>
        <p style="text-align: center;">
          <a href="${data.loginUrl}" class="button">Go to Dashboard</a>
        </p>
        <p>If you have any questions, don't hesitate to reach out to your HR team.</p>
      </div>
      <div class="footer">
        <p>© ${new Date().getFullYear()} ${data.companyName}. All rights reserved.</p>
      </div>
    `, `Welcome to ${data.companyName}`),
    text: `Welcome to ${data.companyName}, ${data.userName}!\n\nYour account has been successfully created.\n\nGo to your dashboard: ${data.loginUrl}`
  }),

  password_reset: (data: EmailTemplateData['password_reset']) => ({
    subject: 'Reset Your Password',
    html: wrapTemplate(`
      <div class="header">
        <h1>Password Reset</h1>
      </div>
      <div class="content">
        <p>Hi ${data.userName},</p>
        <p>We received a request to reset your password. Click the button below to create a new password:</p>
        <p style="text-align: center;">
          <a href="${data.resetUrl}" class="button">Reset Password</a>
        </p>
        <p style="color: #6b7280; font-size: 14px;">This link will expire in 1 hour. If you didn't request a password reset, please ignore this email.</p>
      </div>
      <div class="footer">
        <p>For security, this request was received from your account.</p>
      </div>
    `, 'Password Reset'),
    text: `Hi ${data.userName},\n\nWe received a request to reset your password.\n\nReset your password: ${data.resetUrl}\n\nThis link will expire in 1 hour. If you didn't request this, please ignore this email.`
  }),

  leave_request_submitted: (data: EmailTemplateData['leave_request_submitted']) => ({
    subject: `Leave Request from ${data.employeeName}`,
    html: wrapTemplate(`
      <div class="header">
        <h1>New Leave Request</h1>
      </div>
      <div class="content">
        <p>Hi ${data.managerName},</p>
        <p><strong>${data.employeeName}</strong> has submitted a leave request for your review:</p>
        <div class="highlight">
          <p><strong>Leave Type:</strong> ${data.leaveType}</p>
          <p><strong>Start Date:</strong> ${data.startDate}</p>
          <p><strong>End Date:</strong> ${data.endDate}</p>
        </div>
        <p>Please log in to the system to approve or reject this request.</p>
      </div>
      <div class="footer">
        <p>This is an automated notification from the HR System.</p>
      </div>
    `, 'New Leave Request'),
    text: `Hi ${data.managerName},\n\n${data.employeeName} has submitted a leave request:\n\nLeave Type: ${data.leaveType}\nStart Date: ${data.startDate}\nEnd Date: ${data.endDate}\n\nPlease log in to review this request.`
  }),

  leave_request_approved: (data: EmailTemplateData['leave_request_approved']) => ({
    subject: 'Your Leave Request Has Been Approved',
    html: wrapTemplate(`
      <div class="header">
        <h1>Leave Approved ✓</h1>
      </div>
      <div class="content">
        <p>Hi ${data.employeeName},</p>
        <p>Great news! Your leave request has been <strong style="color: #10b981;">approved</strong>.</p>
        <div class="highlight">
          <p><strong>Leave Type:</strong> ${data.leaveType}</p>
          <p><strong>Start Date:</strong> ${data.startDate}</p>
          <p><strong>End Date:</strong> ${data.endDate}</p>
        </div>
        <p>Enjoy your time off!</p>
      </div>
      <div class="footer">
        <p>This is an automated notification from the HR System.</p>
      </div>
    `, 'Leave Request Approved'),
    text: `Hi ${data.employeeName},\n\nYour leave request has been approved!\n\nLeave Type: ${data.leaveType}\nStart Date: ${data.startDate}\nEnd Date: ${data.endDate}\n\nEnjoy your time off!`
  }),

  leave_request_rejected: (data: EmailTemplateData['leave_request_rejected']) => ({
    subject: 'Your Leave Request Status',
    html: wrapTemplate(`
      <div class="header">
        <h1>Leave Request Update</h1>
      </div>
      <div class="content">
        <p>Hi ${data.employeeName},</p>
        <p>Unfortunately, your ${data.leaveType} leave request could not be approved at this time.</p>
        <div class="highlight">
          <p><strong>Reason:</strong> ${data.reason}</p>
        </div>
        <p>Please speak with your manager if you have any questions.</p>
      </div>
      <div class="footer">
        <p>This is an automated notification from the HR System.</p>
      </div>
    `, 'Leave Request Update'),
    text: `Hi ${data.employeeName},\n\nYour ${data.leaveType} leave request could not be approved.\n\nReason: ${data.reason}\n\nPlease speak with your manager if you have any questions.`
  }),

  payroll_processed: (data: EmailTemplateData['payroll_processed']) => ({
    subject: 'Your Payslip is Ready',
    html: wrapTemplate(`
      <div class="header">
        <h1>Payslip Available</h1>
      </div>
      <div class="content">
        <p>Hi ${data.employeeName},</p>
        <p>Your payslip for the period <strong>${data.periodStart}</strong> to <strong>${data.periodEnd}</strong> is now available.</p>
        <div class="highlight">
          <p><strong>Net Pay:</strong> ${data.netPay}</p>
        </div>
        <p>Log in to your dashboard to view the full details.</p>
      </div>
      <div class="footer">
        <p>This is a confidential payroll notification.</p>
      </div>
    `, 'Payslip Available'),
    text: `Hi ${data.employeeName},\n\nYour payslip for ${data.periodStart} to ${data.periodEnd} is ready.\n\nNet Pay: ${data.netPay}\n\nLog in to view full details.`
  }),

  subscription_expiring: (data: EmailTemplateData['subscription_expiring']) => ({
    subject: `Action Required: ${data.companyName} Subscription Expiring Soon`,
    html: wrapTemplate(`
      <div class="header">
        <h1>Subscription Reminder</h1>
      </div>
      <div class="content">
        <p>Hello,</p>
        <p>This is a reminder that the subscription for <strong>${data.companyName}</strong> will expire on <strong>${data.expirationDate}</strong>.</p>
        <p>To avoid any service interruption, please renew your subscription before the expiration date.</p>
        <p style="text-align: center;">
          <a href="${data.renewUrl}" class="button">Renew Now</a>
        </p>
      </div>
      <div class="footer">
        <p>If you have any questions, please contact our support team.</p>
      </div>
    `, 'Subscription Expiring'),
    text: `Reminder: The subscription for ${data.companyName} will expire on ${data.expirationDate}.\n\nRenew now: ${data.renewUrl}`
  }),

  company_frozen: (data: EmailTemplateData['company_frozen']) => ({
    subject: `Important: ${data.companyName} Account Suspended`,
    html: wrapTemplate(`
      <div class="header" style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);">
        <h1>Account Suspended</h1>
      </div>
      <div class="content">
        <p>Hello,</p>
        <p>We regret to inform you that the account for <strong>${data.companyName}</strong> has been suspended.</p>
        <div class="highlight" style="border-left-color: #dc2626;">
          <p><strong>Reason:</strong> ${data.reason}</p>
        </div>
        <p>If you believe this is an error or would like to resolve this issue, please contact our support team.</p>
        <p><strong>Support Email:</strong> <a href="mailto:${data.supportEmail}">${data.supportEmail}</a></p>
      </div>
      <div class="footer">
        <p>This is an automated notification.</p>
      </div>
    `, 'Account Suspended'),
    text: `Important: The account for ${data.companyName} has been suspended.\n\nReason: ${data.reason}\n\nContact support: ${data.supportEmail}`
  }),

  suspicious_login: (data: EmailTemplateData['suspicious_login']) => ({
    subject: '⚠️ Suspicious Login Detected on Your Account',
    html: wrapTemplate(`
      <div class="header" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);">
        <h1>⚠️ Security Alert</h1>
      </div>
      <div class="content">
        <p>Hi ${data.userName},</p>
        <p>We detected a login to your account that looks unusual. If this was you, you can ignore this email.</p>
        <div class="highlight" style="border-left-color: #f59e0b;">
          <p><strong>When:</strong> ${data.loginTime}</p>
          <p><strong>Browser:</strong> ${data.browser}</p>
          <p><strong>Location:</strong> ${data.location}</p>
          <p><strong>IP Address:</strong> ${data.ipAddress}</p>
          <p><strong>Reason for alert:</strong> ${data.reason}</p>
        </div>
        <p><strong>If this wasn't you:</strong> Someone may have access to your account. We recommend you:</p>
        <ol>
          <li>Change your password immediately</li>
          <li>Enable two-factor authentication</li>
          <li>Review recent account activity</li>
        </ol>
        <p style="text-align: center;">
          <a href="${data.secureAccountUrl}" class="button" style="background: #dc2626;">Secure My Account</a>
        </p>
      </div>
      <div class="footer">
        <p>This is an automated security notification. Do not reply to this email.</p>
      </div>
    `, 'Security Alert - Suspicious Login'),
    text: `Security Alert\n\nHi ${data.userName},\n\nWe detected a suspicious login to your account:\n\nWhen: ${data.loginTime}\nBrowser: ${data.browser}\nLocation: ${data.location}\nIP Address: ${data.ipAddress}\nReason: ${data.reason}\n\nIf this wasn't you, please secure your account immediately: ${data.secureAccountUrl}`
  }),
};

export function renderTemplate<T extends EmailTemplateType>(
  templateType: T,
  data: EmailTemplateData[T]
): RenderedTemplate {
  const renderer = templates[templateType];
  if (!renderer) {
    throw new Error(`Unknown email template: ${templateType}`);
  }
  return renderer(data);
}
