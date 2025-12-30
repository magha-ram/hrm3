import { 
  EmailTemplateType, 
  EmailTemplateData, 
  EmailRecipient, 
  EmailSendResult,
  EmailMessage,
  EmailAttachment,
} from './types.ts';
import { renderTemplate } from './templates.ts';
import { EmailProviderFactory } from './provider-factory.ts';

export interface SendEmailOptions<T extends EmailTemplateType> {
  template: T;
  data: EmailTemplateData[T];
  to: EmailRecipient | EmailRecipient[];
  cc?: EmailRecipient[];
  bcc?: EmailRecipient[];
  replyTo?: EmailRecipient;
  attachments?: EmailAttachment[];
  tags?: Record<string, string>;
}

export interface SendRawEmailOptions {
  to: EmailRecipient | EmailRecipient[];
  subject: string;
  html: string;
  text?: string;
  cc?: EmailRecipient[];
  bcc?: EmailRecipient[];
  replyTo?: EmailRecipient;
  attachments?: EmailAttachment[];
  tags?: Record<string, string>;
}

/**
 * EmailService - Provider-agnostic email orchestrator
 * 
 * This service handles all email sending in the application.
 * It uses templates for consistent formatting and delegates
 * actual sending to the configured provider.
 * 
 * Usage:
 * ```typescript
 * const emailService = new EmailService();
 * 
 * // Using templates
 * await emailService.send({
 *   template: 'user_invitation',
 *   data: { inviterName: 'John', companyName: 'Acme', ... },
 *   to: { email: 'user@example.com', name: 'Jane' },
 * });
 * 
 * // Raw email
 * await emailService.sendRaw({
 *   to: { email: 'user@example.com' },
 *   subject: 'Hello',
 *   html: '<p>Hello World</p>',
 * });
 * ```
 */
export class EmailService {
  /**
   * Send an email using a predefined template.
   */
  async send<T extends EmailTemplateType>(
    options: SendEmailOptions<T>
  ): Promise<EmailSendResult> {
    const { template, data, to, cc, bcc, replyTo, attachments, tags } = options;

    // Render the template
    const rendered = renderTemplate(template, data);

    // Normalize recipients
    const recipients = Array.isArray(to) ? to : [to];

    const message: EmailMessage = {
      to: recipients,
      cc,
      bcc,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
      replyTo,
      attachments,
      tags: {
        ...tags,
        template: template,
      },
    };

    return this.sendMessage(message);
  }

  /**
   * Send a raw email without using a template.
   */
  async sendRaw(options: SendRawEmailOptions): Promise<EmailSendResult> {
    const { to, subject, html, text, cc, bcc, replyTo, attachments, tags } = options;

    // Normalize recipients
    const recipients = Array.isArray(to) ? to : [to];

    const message: EmailMessage = {
      to: recipients,
      cc,
      bcc,
      subject,
      html,
      text,
      replyTo,
      attachments,
      tags,
    };

    return this.sendMessage(message);
  }

  /**
   * Send multiple emails in parallel.
   */
  async sendBatch<T extends EmailTemplateType>(
    emails: SendEmailOptions<T>[]
  ): Promise<EmailSendResult[]> {
    return Promise.all(emails.map(email => this.send(email)));
  }

  /**
   * Internal method to send a message through the provider.
   */
  private async sendMessage(message: EmailMessage): Promise<EmailSendResult> {
    const provider = EmailProviderFactory.getProvider();

    try {
      console.log(`Sending email via ${provider.name}:`, {
        to: message.to.map(r => r.email).join(', '),
        subject: message.subject,
      });

      const result = await provider.send(message);

      if (result.success) {
        console.log(`Email sent successfully via ${provider.name}. Message ID: ${result.messageId}`);
      } else {
        console.error(`Email failed via ${provider.name}:`, result.error);
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Unexpected error sending email via ${provider.name}:`, errorMessage);
      
      return {
        success: false,
        error: errorMessage,
        provider: provider.name,
      };
    }
  }
}

// Export a singleton instance for convenience
export const emailService = new EmailService();
