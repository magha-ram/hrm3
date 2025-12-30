import { EmailProvider, EmailProviderType, EmailProviderConfig } from './types.ts';
import { ConsoleEmailProvider } from './providers/console.ts';
import { MailerSendEmailProvider } from './providers/mailersend.ts';
import { SendGridEmailProvider } from './providers/sendgrid.ts';
import { AwsSesEmailProvider } from './providers/aws-ses.ts';

/**
 * Email Provider Factory
 * Creates the appropriate email provider based on environment configuration.
 */
export class EmailProviderFactory {
  private static instance: EmailProvider | null = null;
  private static providerType: EmailProviderType | null = null;

  /**
   * Get the configured email provider.
   * Uses singleton pattern to ensure only one provider instance exists.
   */
  static getProvider(): EmailProvider {
    const currentProviderType = this.getProviderType();

    // Return cached instance if provider type hasn't changed
    if (this.instance && this.providerType === currentProviderType) {
      return this.instance;
    }

    const config = this.getConfig();
    this.providerType = currentProviderType;

    switch (currentProviderType) {
      case 'mailersend':
        this.instance = new MailerSendEmailProvider(config);
        break;
      case 'sendgrid':
        this.instance = new SendGridEmailProvider(config);
        break;
      case 'ses':
        this.instance = new AwsSesEmailProvider(config);
        break;
      case 'console':
        this.instance = new ConsoleEmailProvider(config);
        break;
      default:
        throw new Error(`Unknown email provider: ${currentProviderType}. Valid options: mailersend, sendgrid, ses, console`);
    }

    console.log(`Email provider initialized: ${this.instance.name}`);

    // Validate configuration
    if (!this.instance.validateConfig()) {
      console.warn(`Email provider ${this.instance.name} configuration is incomplete. Emails may fail.`);
    }

    return this.instance;
  }

  /**
   * Get the provider type from environment.
   * Defaults to 'console' in development.
   */
  private static getProviderType(): EmailProviderType {
    const provider = Deno.env.get('EMAIL_PROVIDER')?.toLowerCase() as EmailProviderType;
    
    if (!provider) {
      console.warn('EMAIL_PROVIDER not set. Defaulting to console provider.');
      return 'console';
    }

    const validProviders: EmailProviderType[] = ['mailersend', 'sendgrid', 'ses', 'console'];
    if (!validProviders.includes(provider)) {
      throw new Error(`Invalid EMAIL_PROVIDER: ${provider}. Valid options: ${validProviders.join(', ')}`);
    }

    return provider;
  }

  /**
   * Get shared email configuration from environment.
   */
  private static getConfig(): EmailProviderConfig {
    return {
      fromEmail: Deno.env.get('EMAIL_FROM_ADDRESS') || 'noreply@example.com',
      fromName: Deno.env.get('EMAIL_FROM_NAME') || 'HR System',
    };
  }

  /**
   * Reset the cached provider instance.
   * Useful for testing or when environment changes.
   */
  static reset(): void {
    this.instance = null;
    this.providerType = null;
  }
}
