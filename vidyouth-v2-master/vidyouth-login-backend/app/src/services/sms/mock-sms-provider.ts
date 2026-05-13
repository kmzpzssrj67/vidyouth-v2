import type { SendOtpSmsInput, SmsProvider } from './sms-provider.js';

export class MockSmsProvider implements SmsProvider {
  async sendOtp(input: SendOtpSmsInput): Promise<void> {
    input.logger.info(
      {
        provider: 'mock',
        to: input.to,
        code: input.code,
        expiresInSec: input.expiresInSec,
      },
      '[DEV] SMS OTP issued',
    );
  }
}
