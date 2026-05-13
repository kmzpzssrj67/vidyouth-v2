import type { EmailProvider, SendVerificationEmailInput } from './email-provider.js';

export class SesEmailProvider implements EmailProvider {
  async sendVerificationEmail(_input: SendVerificationEmailInput): Promise<void> {
    // TODO(SES): integrate AWS SES v3 client, verified sender identity, and
    // production HTML/text templates.
    // TODO(email-queue): move delivery to a background job with retries and
    // dead-letter handling before enabling real production traffic.
    throw new Error('ses_email_provider_not_configured');
  }
}
