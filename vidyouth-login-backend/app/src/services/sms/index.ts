import { env } from '../../config/env.js';
import type { SmsProvider } from './sms-provider.js';
import { MockSmsProvider } from './mock-sms-provider.js';
import { SnsSmsProvider } from './sns-sms-provider.js';

let provider: SmsProvider | null = null;

export function getSmsProvider(): SmsProvider {
  if (provider) return provider;
  provider = env.SMS_PROVIDER === 'sns'
    ? new SnsSmsProvider()
    : new MockSmsProvider();
  return provider;
}