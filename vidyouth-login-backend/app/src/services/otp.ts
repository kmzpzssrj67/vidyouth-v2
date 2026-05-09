/**
 * OTP service — generate, store, verify.
 *
 * Channels: 'sms' | 'email'. The OTP is stored hashed in Redis (so a Redis
 * read leak doesn't expose live codes). A small per-user request-rate
 * counter prevents OTP abuse.
 */

import { createHash, randomInt } from 'node:crypto';
import { redis } from '@/db/redis.js';
import { env } from '@/config/env.js';
import { safeEqual } from './passwords.js';

export type OtpChannel = 'sms' | 'email';

const otpKey = (channel: OtpChannel, identifier: string) =>
  `otp:${channel}:${identifier.toLowerCase()}`;
const rateKey = (identifier: string) => `otprl:${identifier.toLowerCase()}`;

export function generateCode(): string {
  // randomInt is uniform; toString.padStart keeps leading zeros visible.
  const max = 10 ** env.OTP_LENGTH;
  return randomInt(0, max).toString().padStart(env.OTP_LENGTH, '0');
}

function hashCode(code: string): string {
  return createHash('sha256').update(code).digest('hex');
}

export interface OtpIssued {
  code: string;        // returned to caller so the SMS/email worker can send it
  expiresInSec: number;
}

/** Issues a fresh OTP for (channel, identifier). Returns the code so the
 *  SMS/email layer can deliver it. The hash is stored in Redis. */
export async function issueOtp(
  channel: OtpChannel,
  identifier: string,
): Promise<OtpIssued> {
  // Rate-limit per identifier.
  const rk = rateKey(identifier);
  const count = await redis.incr(rk);
  if (count === 1) {
    await redis.expire(rk, env.OTP_RATE_LIMIT_WINDOW_SECONDS);
  }
  if (count > env.OTP_RATE_LIMIT_MAX) {
    throw Object.assign(new Error('otp_rate_limited'), { statusCode: 429 });
  }

  const code = generateCode();
  await redis.set(
    otpKey(channel, identifier),
    hashCode(code),
    'EX',
    env.OTP_TTL_SECONDS,
  );
  return { code, expiresInSec: env.OTP_TTL_SECONDS };
}

/** True if the supplied code matches and is not expired. Single-use:
 *  consumes the OTP on success. */
export async function verifyOtp(
  channel: OtpChannel,
  identifier: string,
  submitted: string,
): Promise<boolean> {
  const k = otpKey(channel, identifier);
  const stored = await redis.get(k);
  if (!stored) return false;
  const ok = safeEqual(stored, hashCode(submitted));
  if (ok) {
    await redis.del(k);
  }
  return ok;
}
