/**
 * Session repository.
 *
 * PostgreSQL stores the durable audit/revocation record. Redis remains the
 * hot-path active-session index in services/sessions.ts.
 */

import { query } from '@/db/pg.js';

export interface SessionRecord {
  id: string;
  user_id: string;
  ip: string | null;
  user_agent: string | null;
  created_at: Date;
  last_seen_at: Date;
  revoked_at: Date | null;
  revoked_reason: string | null;
}

export interface CreateSessionInput {
  id: string;
  userId: string;
  ip?: string | null;
  userAgent?: string | null;
}

const sessionColumns = `
  id,
  user_id,
  ip::text AS ip,
  user_agent,
  created_at,
  last_seen_at,
  revoked_at,
  revoked_reason
`;

export async function createSession(input: CreateSessionInput): Promise<SessionRecord> {
  const result = await query<SessionRecord>(
    `INSERT INTO sessions (id, user_id, ip, user_agent, created_at)
     VALUES ($1, $2, $3, $4, NOW())
     RETURNING ${sessionColumns}`,
    [input.id, input.userId, input.ip ?? null, input.userAgent ?? null],
  );
  return result.rows[0] as SessionRecord;
}

export async function findSession(sessionId: string): Promise<SessionRecord | null> {
  const result = await query<SessionRecord>(
    `SELECT ${sessionColumns}
     FROM sessions
     WHERE id = $1
     LIMIT 1`,
    [sessionId],
  );
  return result.rows[0] ?? null;
}

export async function revokeSession(
  sessionId: string,
  reason: string,
): Promise<void> {
  await query(
    `UPDATE sessions
     SET revoked_at = NOW(), revoked_reason = $2
     WHERE id = $1 AND revoked_at IS NULL`,
    [sessionId, reason],
  );
}

export async function revokeSessions(
  sessionIds: string[],
  reason: string,
): Promise<void> {
  if (sessionIds.length === 0) return;
  await query(
    `UPDATE sessions
     SET revoked_at = NOW(), revoked_reason = $2
     WHERE id = ANY($1::uuid[]) AND revoked_at IS NULL`,
    [sessionIds, reason],
  );
}

export async function revokeAllUserSessions(
  userId: string,
  reason: string,
): Promise<void> {
  await query(
    `UPDATE sessions
     SET revoked_at = NOW(), revoked_reason = $2
     WHERE user_id = $1 AND revoked_at IS NULL`,
    [userId, reason],
  );
}

export async function touchSession(sessionId: string): Promise<void> {
  await query(
    `UPDATE sessions
     SET last_seen_at = NOW()
     WHERE id = $1 AND revoked_at IS NULL`,
    [sessionId],
  );
}
