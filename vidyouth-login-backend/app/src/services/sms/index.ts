import { env } from '../../config/env.js';
import type { SmsProvider } from './sms-provider.js';
import { MockSmsProvider } from './mock-sms-provider.js';
import { SnsSmsProvider } from './sns-sms-provider.js';
import { Msg91SmsProvider } from './msg91-sms-provider.js';

let provider: SmsProvider | null = null;

export function getSmsProvider(): SmsProvider {
  if (provider) return provider;
  switch (env.SMS_PROVIDER) {
    case 'sns':
      provider = new SnsSmsProvider();
      break;
    case 'msg91':
      provider = new Msg91SmsProvider();
      break;
    default:
      provider = new MockSmsProvider();
  }
  return provider;
}