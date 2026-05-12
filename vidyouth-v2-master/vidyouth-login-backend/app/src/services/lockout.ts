/**
 * Failed-login + account-lockout policy, backed by Redis counters.
 *
 *   LOCKOUT_MAX_FAILED      = 5    consecutive failures within window
 *   LOCKOUT_WINDOW_SECONDS  = 1800 sliding TTL on the counter
 *   LOCKOUT_DURATION_SECONDS= 1800 lock duration once tripped
 *
 * Counter resets on a successful login. The lock flag is checked first on
 * every attempt — short-circuits before bcrypt verification (cheap denial).
 */

import { redis } from '@/db/redis.js';
import { env } from '@/config/env.js';

const failKey = (userId: string) => `fail:${userId}`;
const lockKey = (userId: string) => `lock:${userId}`;

export async function isLocked(userId: string): Promise<boolean> {
  const v = await redis.get(lockKey(userId));
  return v !== null;
}

export interface FailureResult {
  failures: number;
  locked: boolean;
}

/** Increment the failure counter; lock the account if threshold reached. */
export async function recordFailure(userId: string): Promise<FailureResult> {
  const key = failKey(userId);
  const failures = await redis.incr(key);
  if (failures === 1) {
    await redis.expire(key, env.LOCKOUT_WINDOW_SECONDS);
  }
  if (failures >= env.LOCKOUT_MAX_FAILED) {
    await redis.set(lockKey(userId), '1', 'EX', env.LOCKOUT_DURATION_SECONDS);
    await redis.del(key); // counter served its purpose
    return { failures, locked: true };
  }
  return { failures, locked: false };
}

export async function resetFailures(userId: string): Promise<void> {
  await redis.del(failKey(userId), lockKey(userId));
}
