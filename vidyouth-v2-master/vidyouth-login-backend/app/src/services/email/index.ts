import { env } from '@/config/env.js';
import type { EmailProvider } from './email-provider.js';
import { MockEmailProvider } from './mock-email-provider.js';
import { SesEmailProvider } from './ses-email-provider.js';

let provider: EmailProvider | null = null;

export function getEmailProvider(): EmailProvider {
  if (provider) return provider;
  provider = env.EMAIL_PROVIDER === 'ses'
    ? new SesEmailProvider()
    : new MockEmailProvider();
  return provider;
}
