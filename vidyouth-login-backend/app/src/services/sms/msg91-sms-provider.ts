/**
 * MSG91 SMS provider (https://msg91.com) — the practical gateway for
 * delivering OTPs to Indian (+91) and international numbers.
 *
 * Uses the MSG91 Flow API v5. India requires a DLT-approved template;
 * the template must contain a variable for the code, e.g.:
 *
 *   "Your Vidyouth verification code is ##OTP##. Valid for ##EXPIRY##
 *    minutes. Do not share it with anyone."
 *
 * Required env:
 *   SMS_PROVIDER=msg91
 *   MSG91_AUTH_KEY=<your msg91 auth key>      (or SMS_API_KEY as fallback)
 *   MSG91_TEMPLATE_ID=<DLT-approved flow/template id>
 *   MSG91_SENDER_ID=<6-char DLT header>       (optional but recommended)
 *
 * The mobile number is sent without the leading "+" (MSG91 expects the
 * country code + number, e.g. 919876543210).
 */

import { env } from '../../config/env.js';
import type { SendOtpSmsInput, SmsProvider } from './sms-provider.js';

const MSG91_FLOW_ENDPOINT = 'https://control.msg91.com/api/v5/flow/';

export class Msg91NotConfiguredError extends Error {
  constructor(missing: string[]) {
    super(`msg91_not_configured: missing ${missing.join(', ')}`);
    this.name = 'Msg91NotConfiguredError';
  }
}

export class Msg91SmsProvider implements SmsProvider {
  private readonly authKey = env.MSG91_AUTH_KEY || env.SMS_API_KEY;
  private readonly templateId = env.MSG91_TEMPLATE_ID;
  private readonly senderId = env.MSG91_SENDER_ID;

  private assertConfigured(): void {
    const missing: string[] = [];
    if (!this.authKey) missing.push('MSG91_AUTH_KEY');
    if (!this.templateId) missing.push('MSG91_TEMPLATE_ID');
    if (missing.length) throw new Msg91NotConfiguredError(missing);
  }

  async sendOtp(input: SendOtpSmsInput): Promise<void> {
    this.assertConfigured();

    // MSG91 wants the number without "+"
    const mobile = input.to.replace(/^\+/, '');
    const expiryMin = String(Math.ceil(input.expiresInSec / 60));

    const body: Record<string, unknown> = {
      template_id: this.templateId,
      recipients: [
        {
          mobiles: mobile,
          OTP: input.code,
          EXPIRY: expiryMin,
        },
      ],
    };
    if (this.senderId) body.sender = this.senderId;

    try {
      const res = await fetch(MSG91_FLOW_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          accept: 'application/json',
          authkey: this.authKey as string,
        },
        body: JSON.stringify(body),
      });

      const text = await res.text();
      let parsed: unknown;
      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = text;
      }

      // MSG91 returns 200 with { type: 'success' | 'error', message }
      const ok =
        res.ok &&
        (typeof parsed !== 'object' ||
          parsed === null ||
          (parsed as { type?: string }).type !== 'error');

      if (!ok) {
        throw new Error(
          `msg91_send_failed: ${res.status} ${
            typeof parsed === 'string' ? parsed : JSON.stringify(parsed)
          }`,
        );
      }

      input.logger.info(
        {
          provider: 'msg91',
          to: input.to,
          templateId: this.templateId,
          response: parsed,
        },
        'MSG91 OTP SMS sent',
      );
    } catch (err) {
      const e = err as { name?: string; message?: string };
      input.logger.error(
        {
          provider: 'msg91',
          to: input.to,
          errorName: e.name,
          errorMessage: e.message,
        },
        'MSG91 OTP SMS send failed',
      );
      throw err;
    }
  }
}

// TODO(msg91-delivery-receipts): consume MSG91 webhook for delivery status.
// TODO(msg91-fallback): fall back to SNS if MSG91 returns a hard failure.
