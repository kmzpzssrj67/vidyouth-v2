/**
 * Session management. The DB row in `sessions` is the source of truth for
 * audit/revocation; Redis just holds an indexed set per user so we can
 * enforce SESSION_MAX_PER_USER (default 3) without a SQL scan.
 *
 * Convention:
 *   sess:{userId}  =  Redis SET of sessionId (z-set ordered by createdAt
 *                     so the *oldest* session is evicted when a 4th one
 *                     starts; alternatively pass force=true to revoke all).
 */

import { redis } from '../db/redis.js';
import { env } from '../config/env.js';
import { query } from '../db/pg.js';

const sessKey = (userId: string) => `sess:${userId}`;

export interface Session {
  id: string;
  userId: string;
  createdAt: number; // ms epoch
}

/** Records a new session. Returns the IDs of any sessions evicted to
 *  satisfy SESSION_MAX_PER_USER. */
export async function startSession(s: Session): Promise<string[]> {
  await redis.zadd(sessKey(s.userId), s.createdAt, s.id);
  const total = await redis.zcard(sessKey(s.userId));
  const evicted: string[] = [];

  if (total > env.SESSION_MAX_PER_USER) {
    const drop = total - env.SESSION_MAX_PER_USER;
    const oldest = await redis.zrange(sessKey(s.userId), 0, drop - 1);
    if (oldest.length > 0) {
      await redis.zrem(sessKey(s.userId), ...oldest);
      evicted.push(...oldest);
      // soft-delete in DB so audit trail is preserved
      await query(
        `UPDATE sessions SET revoked_at = NOW(), revoked_reason = 'evicted_for_quota'
         WHERE id = ANY($1::uuid[])`,
        [oldest],
      );
    }
  }
  return evicted;
}

export async function endSession(userId: string, sessionId: string): Promise<void> {
  await redis.zrem(sessKey(userId), sessionId);
  await query(
    `UPDATE sessions SET revoked_at = NOW(), revoked_reason = 'logout'
     WHERE id = $1 AND revoked_at IS NULL`,
    [sessionId],
  );
}

export async function endAllSessions(userId: string, reason: string = 'forced'): Promise<void> {
  await redis.del(sessKey(userId));
  await query(
    `UPDATE sessions SET revoked_at = NOW(), revoked_reason = $2
     WHERE user_id = $1 AND revoked_at IS NULL`,
    [userId, reason],
  );
}

export async function isActive(userId: string, sessionId: string): Promise<boolean> {
  const score = await redis.zscore(sessKey(userId), sessionId);
  return score !== null;
}
