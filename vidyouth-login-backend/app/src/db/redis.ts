/**
 * Redis client. ioredis with lazy connect + auto-reconnect.
 * Used for OTPs, session sets, failed-login counters, and lockout flags.
 *
 * Key conventions (env REDIS_KEY_PREFIX is prepended automatically):
 *   otp:{channel}:{identifier}    → 6-digit OTP, TTL = OTP_TTL_SECONDS
 *   fail:{userId}                 → INCR'd failed-login counter
 *   lock:{userId}                 → presence implies locked, TTL = LOCKOUT_DURATION
 *   sess:{userId}                 → SET of active sessionId (LREM/SADD; SCARD <= 3)
 *   otprl:{userId}                → OTP request rate limit counter
 */

import Redis from 'ioredis';
import { env } from '../config/env.js';

export const redis = new Redis(env.REDIS_URL, {
  keyPrefix: env.REDIS_KEY_PREFIX,
  lazyConnect: false,
  enableReadyCheck: true,
  maxRetriesPerRequest: 3,
  // For ElastiCache TLS, prefix the URL with rediss:// — ioredis picks it up.
});

redis.on('error', (err) => {
  // eslint-disable-next-line no-console
  console.error({ err: err.message }, 'redis error');
});

export async function pingRedis(): Promise<boolean> {
  try {
    const r = await redis.ping();
    return r === 'PONG';
  } catch {
    return false;
  }
}

export async function closeRedis(): Promise<void> {
  await redis.quit();
}
