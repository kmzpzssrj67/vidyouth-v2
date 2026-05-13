/**
 * Password reset token repository.
 *
 * Mirrors email verification token lifecycle: store only token hashes, allow
 * one successful atomic consume, and keep expired/consumed rows for audit.
 */

import { query } from '@/db/pg.js';

export interface PasswordResetTokenRecord {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: Date;
  consumed_at: Date | null;
  created_at: Date;
  requested_ip: string | null;
  user_agent: string | null;
}

export interface CreateResetTokenInput {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  requestedIp?: string | null;
  userAgent?: string | null;
}

const tokenColumns = `
  id,
  user_id,
  token_hash,
  expires_at,
  consumed_at,
  created_at,
  requested_ip::text AS requested_ip,
  user_agent
`;

export async function createResetToken(
  input: CreateResetTokenInput,
): Promise<PasswordResetTokenRecord> {
  const result = await query<PasswordResetTokenRecord>(
    `INSERT INTO password_reset_tokens
       (user_id, token_hash, expires_at, requested_ip, user_agent)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING ${tokenColumns}`,
    [
      input.userId,
      input.tokenHash,
      input.expiresAt,
      input.requestedIp ?? null,
      input.userAgent ?? null,
    ],
  );
  return result.rows[0] as PasswordResetTokenRecord;
}

export async function findValidResetToken(
  tokenHash: string,
): Promise<PasswordResetTokenRecord | null> {
  const result = await query<PasswordResetTokenRecord>(
    `SELECT ${tokenColumns}
     FROM password_reset_tokens
     WHERE token_hash = $1
       AND consumed_at IS NULL
       AND expires_at > NOW()
     LIMIT 1`,
    [tokenHash],
  );
  return result.rows[0] ?? null;
}

export async function consumeResetToken(
  tokenHash: string,
): Promise<PasswordResetTokenRecord | null> {
  const result = await query<PasswordResetTokenRecord>(
    `UPDATE password_reset_tokens
     SET consumed_at = NOW()
     WHERE token_hash = $1
       AND consumed_at IS NULL
       AND expires_at > NOW()
     RETURNING ${tokenColumns}`,
    [tokenHash],
  );
  return result.rows[0] ?? null;
}

export async function revokeUserResetTokens(userId: string): Promise<void> {
  await query(
    `UPDATE password_reset_tokens
     SET consumed_at = NOW()
     WHERE user_id = $1 AND consumed_at IS NULL`,
    [userId],
  );
}
