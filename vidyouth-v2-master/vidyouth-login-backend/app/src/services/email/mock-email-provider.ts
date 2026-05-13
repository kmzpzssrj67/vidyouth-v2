import type { EmailProvider, SendVerificationEmailInput } from './email-provider.js';

export class MockEmailProvider implements EmailProvider {
  async sendVerificationEmail(input: SendVerificationEmailInput): Promise<void> {
    input.logger.info(
      {
        provider: 'mock',
        to: input.to,
        verificationUrl: input.verificationUrl,
        expiresAt: input.expiresAt.toISOString(),
      },
      '[DEV] Email verification link',
    );
  }
}
